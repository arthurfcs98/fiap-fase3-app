# Diagrama de Componentes — Fase 3

Visão de alto nível dos componentes do sistema, suas responsabilidades e fronteiras (rede, conta AWS, ambiente).

## Diagrama

```mermaid
flowchart TB
    %% Externo
    User([Cliente / Operador da Oficina])
    DNS[Cloudflare DNS]

    %% Conta AWS Academy / us-east-1
    subgraph AWS["AWS Academy — us-east-1"]

        APIGW["API Gateway HTTP API<br/>(stages: homolog, prod)"]

        subgraph Auth["Autenticação"]
            LambdaAuth["Lambda Auth<br/>(POST /auth)"]
            LambdaAuthorizer["Lambda Authorizer<br/>(JWT validation)"]
        end

        subgraph EKS["EKS Cluster — VPC 10.20.0.0/16"]
            subgraph Pods["Namespace oficina"]
                API["NestJS API<br/>x2 réplicas (HPA 2-5)"]
                MigJob["Job: migrations"]
            end
            subgraph Ingress["Namespace ingress-nginx"]
                NGINX[NGINX Ingress Controller]
            end
            subgraph Mon_NS["Namespace monitoring"]
                Alloy[Grafana Alloy<br/>DaemonSet (metrics+logs+traces)]
            end
        end

        NLB["Network Load Balancer<br/>(internal)"]
        VPCLink["VPC Link"]

        subgraph Persist["Persistência & Segredos"]
            RDS["RDS Postgres<br/>db.t3.micro Single-AZ"]
            SM["Secrets Manager<br/>(db-credentials, jwt-secret)"]
        end

        ECR["ECR<br/>(fiap-fase3-app, fiap-fase3-auth-lambda)"]
        CW[CloudWatch Logs]
    end

    %% Observabilidade externa
    GC["Grafana Cloud<br/>(Mimir + Loki + Tempo + Synthetic + Alerts)"]

    %% Repositórios
    subgraph Git["GitHub — arthurfcs98"]
        Repo1["fiap-fase3-auth-lambda"]
        Repo2["fiap-fase3-infra-k8s"]
        Repo3["fiap-fase3-infra-db"]
        Repo4["fiap-fase3-app"]
    end

    %% Tráfego
    User --> DNS --> APIGW
    APIGW -- "POST /auth" --> LambdaAuth
    APIGW -- "Authorize JWT" --> LambdaAuthorizer
    APIGW -- "ANY /api/*<br/>via VPC Link" --> VPCLink --> NLB --> NGINX --> API

    %% Dados
    LambdaAuth --> RDS
    LambdaAuth --> SM
    LambdaAuthorizer --> SM
    API --> RDS
    API --> SM
    MigJob --> RDS

    %% Observabilidade
    API -. logs JSON .-> Alloy
    NGINX -. logs .-> Alloy
    Alloy --> GC
    LambdaAuth -. spans + logs .-> GC
    LambdaAuthorizer -. spans + logs .-> GC
    APIGW -- "Access Logs" --> CW

    %% CI/CD
    Repo1 -. "GH Actions deploy" .-> LambdaAuth
    Repo2 -. "GH Actions deploy" .-> EKS
    Repo3 -. "GH Actions deploy" .-> RDS
    Repo4 -. "GH Actions deploy" .-> ECR
    ECR --> API

    classDef ext fill:#fef3c7,stroke:#92400e
    classDef aws fill:#dbeafe,stroke:#1e40af
    classDef obs fill:#dcfce7,stroke:#166534
    classDef git fill:#f3e8ff,stroke:#6b21a8

    class User,DNS ext
    class APIGW,LambdaAuth,LambdaAuthorizer,API,MigJob,NGINX,Alloy,NLB,VPCLink,RDS,SM,ECR,CW aws
    class GC obs
    class Repo1,Repo2,Repo3,Repo4 git
```

## Componentes e responsabilidades

### Fronteira externa
| Componente | Responsabilidade |
|------------|-----------------|
| Cliente / Operador | Acessa via app/curl; primeiro autentica com CPF, depois consome `/api/*` |
| Cloudflare DNS | (Reusa zona `asdevit.com` da Fase 2; nesta fase, opcionalmente aponta subdomínio pro API Gateway domain customizado — opcional, pode usar `*.execute-api.amazonaws.com` direto) |

### Camada de Gateway
| Componente | Responsabilidade |
|------------|-----------------|
| API Gateway HTTP API | Ponto único de entrada; rotas públicas (`/auth`, `/api/health`, `/api/docs`) e protegidas (`/api/{proxy+}`); CORS; access logs |

### Camada Serverless (Lambda)
| Componente | Responsabilidade |
|------------|-----------------|
| Lambda Auth (`fiap-fase3-auth`) | Recebe `POST /auth { cpf }`; valida CPF; consulta cliente no RDS; emite JWT HS256 |
| Lambda Authorizer (`fiap-fase3-authorizer`) | Validação síncrona de JWT pra rotas protegidas; retorna `{ isAuthorized, context }` |

### Camada de aplicação (EKS)
| Componente | Responsabilidade |
|------------|-----------------|
| NestJS API | Lógica de negócio: customers, vehicles, services, parts, service-orders, notification |
| NGINX Ingress | Roteamento path-based dentro do cluster; backend único do NLB |
| Migration Job | Roda migrations TypeORM em deploy (one-shot) |

### Camada de persistência
| Componente | Responsabilidade |
|------------|-----------------|
| RDS Postgres | Banco gerenciado; armazena domínio relacional |
| Secrets Manager | DB credentials + JWT signing secret |

### Camada de observabilidade
| Componente | Responsabilidade |
|------------|-----------------|
| Grafana Alloy (K8s) | DaemonSet capturando métricas de host + logs de pods (stdout JSON) + recebendo OTLP de apps |
| Grafana Cloud SaaS | Mimir (metrics), Loki (logs), Tempo (traces), Synthetic, Alerts |
| CloudWatch Logs | Access logs do API Gateway, logs de Lambda |

### Camada de delivery
| Componente | Responsabilidade |
|------------|-----------------|
| ECR | Repositório de imagens Docker do app principal |
| GitHub Actions | Pipeline por repo: lint → test → build → push → deploy via Terraform/kubectl |

## Notas de design

- **Defesa em profundidade na auth:** JWT validado 2 vezes (Authorizer no Gateway + JwtStrategy na API). Mesmo bypass do Gateway (port-forward direto pro pod) ainda exige token. Ver [RFC-02](../rfcs/RFC-02-auth-cpf-serverless.md).
- **NLB interno:** tráfego entre Gateway e EKS não trafega na internet pública. Ver [ADR-05](../adrs/ADR-05-ingress-nginx.md).
- **Sem NAT Gateway:** nodes EKS em subnets públicas pra acesso ECR/Internet sem cobrança de NAT. Trade-off conhecido, ver [ADR-01](../adrs/ADR-01-eks-managed.md).
- **Migration via Job:** evita "race" entre múltiplos pods rodando migrations no startup; Job tem `restartPolicy: OnFailure` e roda 1×.
