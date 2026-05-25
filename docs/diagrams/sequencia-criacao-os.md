# Diagrama de Sequência — Criação de Ordem de Serviço

Fluxo de uma chamada autenticada que cria uma Ordem de Serviço, atravessando todos os componentes do sistema.

## Diagrama

```mermaid
sequenceDiagram
    autonumber
    participant C as Cliente (já autenticado)
    participant GW as API Gateway
    participant LA as Lambda Authorizer
    participant SM as Secrets Manager
    participant NLB as NLB (interno)
    participant NG as NGINX Ingress
    participant API as NestJS API Pod
    participant DB as RDS Postgres
    participant GC as Grafana Cloud

    C->>+GW: POST /homolog/api/service-orders<br/>Headers: Authorization: Bearer eyJ...<br/>Body: { vehicleId, items: [...] }<br/>x-correlation-id: 7a3f-...
    GW->>+LA: invoke Authorizer<br/>(REQUEST, payload v2.0)
    activate LA
    Note over LA: cache JWT secret check
    opt cold start
        LA->>+SM: GetSecretValue("fiap-fase3-jwt-secret")
        SM-->>-LA: secretString
    end
    LA->>LA: jwt.verify(token, secret)<br/>(checa assinatura + exp)
    alt JWT inválido / expirado
        LA-->>GW: { isAuthorized: false }
        GW-->>C: 401 Unauthorized
        LA-)GC: log warn auth.denied
    else JWT válido
        LA-->>-GW: { isAuthorized: true, context: { customerId, name, cpf } }
        deactivate LA

        Note over GW: TTL cache do Authorizer = 60s<br/>(invocações subsequentes evitam Lambda)

        GW->>+NLB: HTTP_PROXY (via VPC Link)<br/>Headers: + x-customer-id (do context)
        NLB->>+NG: forward (Layer 4)
        NG->>+API: HTTP request
        activate API

        API->>API: CorrelationIdInterceptor lê header,<br/>cria AsyncLocalStorage
        API->>API: JwtAuthGuard valida token (defesa em profundidade)
        API->>API: extrai customerId do JWT
        API->>API: valida body (DTO)

        Note over API: Use case CreateServiceOrder
        API->>+DB: BEGIN TRANSACTION
        API->>DB: SELECT * FROM vehicles<br/>WHERE id = $1 AND customer_id = $2
        DB-->>API: vehicle row

        alt veículo não pertence ao cliente
            API->>DB: ROLLBACK
            API-->>NG: 403 { code: V0001, message: VEHICLE_NOT_OWNED }
            NG-->>NLB: 403
            NLB-->>GW: 403
            GW-->>C: 403
            API-)GC: log warn order.create_denied
        else veículo OK
            loop pra cada item (service ou part)
                API->>DB: SELECT preço/estoque<br/>FROM services/parts WHERE id = $1
                DB-->>API: data
            end
            API->>DB: INSERT INTO service_orders<br/>(id, order_number, customer_id, vehicle_id,<br/> status='RECEIVED', total_amount, created_at)
            DB-->>API: order inserted
            API->>DB: INSERT INTO service_order_items<br/>VALUES (...) (batch)
            DB-->>API: items inserted
            API->>DB: COMMIT
            DB-->>-API: COMMITTED

            API->>API: emite evento OrderCreated<br/>(BullMQ → notification)
            API-)GC: ordersCreatedCounter.add(1, {...})
            API-->>-NG: 201 { id, orderNumber, status: RECEIVED }
            NG-->>-NLB: 201
            NLB-->>-GW: 201
            GW-->>-C: 201 + x-correlation-id
            API-)GC: log info order.created { orderId, correlationId }
            GW->>GC: access log
        end
    end
```

## Observações de design

### Defesa em profundidade na autenticação
1. **Lambda Authorizer** valida JWT no Gateway (curto, em segundos)
2. **JwtAuthGuard** valida o mesmo JWT no Nest (defesa contra bypass do Gateway via `kubectl port-forward`)
3. Ambos consultam o **mesmo segredo** no Secrets Manager

### Cache do Authorizer
- Configurado com `authorizer_result_ttl_in_seconds = 60`
- Invocações subsequentes pro mesmo token nos 60s seguintes pulam a Lambda Authorizer
- Economiza ~50ms e ~10 Lambda invocações/sessão típica
- Trade-off: revogação de token tem latência até 60s (aceitável)

### Propagação de correlation ID
- Cliente envia ou Gateway gera no auth inicial
- Authorizer **não modifica** (só lê pra log)
- Gateway repassa para o NLB via header
- NestJS `CorrelationIdInterceptor` extrai e popula `AsyncLocalStorage`
- Todos os logs do request (Authorizer, Gateway, API, queries DB via custom logger) carregam o mesmo cid
- Cliente recebe de volta no `x-correlation-id` response

### Métricas custom
- `recordCustomEvent("ServiceOrderCreated", { ... })` envia evento ao New Relic
- Usado pra dashboards: "Volume diário de OS" via NRQL `SELECT count(*) FROM ServiceOrderCreated TIMESERIES`

### Atomicidade da criação
- Toda inserção (ordem + itens) em uma transação Postgres
- Falha em qualquer passo → ROLLBACK; cliente recebe erro estruturado
- `BullMQ` evento só é emitido após COMMIT bem-sucedido

## Variação: mudança de status

A mudança de status (`PATCH /api/service-orders/:id/status`) segue fluxo similar, mas:
- Acessa `service_orders` por id + valida ownership do cliente
- Aplica máquina de estados (`RECEIVED → IN_DIAGNOSIS → AWAITING_APPROVAL → ...`)
- Emite `recordCustomEvent("ServiceOrderStatusChanged", { fromStatus, toStatus, durationMs })`
- Métrica feed dashboard "Tempo médio por status"
