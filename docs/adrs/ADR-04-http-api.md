# ADR-04 — API Gateway HTTP API (não REST API)

**Data:** 2026-05-25
**Status:** Accepted

## Contexto

AWS API Gateway tem dois sabores:

1. **REST API** (V1) — feature-rich (request validation, models, transformações, API Keys, usage plans, WAF integrado)
2. **HTTP API** (V2) — leve, mais barato (~70% menos), latência menor, suporte nativo a JWT Authorizer

Pro projeto da Fase 3, precisamos:
- Proxy direto pra Lambda (rota `/auth`)
- Proxy pra ALB/NLB do EKS via VPC Link (rotas `/api/*`)
- Lambda Authorizer custom (HS256)
- Stages `homolog` e `prod`

Não precisamos: WAF integrado (público), request validation profunda, usage plans (sem API keys pra clientes externos), API Keys.

## Decisão

Usar **API Gateway HTTP API** (V2) com:
- 2 stages: `homolog` e `prod`
- 1 integração `AWS_PROXY` pra Lambda Auth (`POST /auth`)
- 1 integração `HTTP_PROXY` via VPC Link pra NLB (`{ANY} /api/{proxy+}`)
- 1 Lambda Authorizer custom (REQUEST type, payload v2.0)
- CORS configurado (allow `*` em homolog; restringir em prod se necessário)
- Access logs estruturados em JSON pro CloudWatch (`/aws/apigateway/fiap-fase3`)

## Consequências

### Positivas
- Custo: $1.00 por milhão de requests (vs $3.50 do REST) — irrelevante no free tier, mas demonstra escolha consciente
- Latência menor (~50ms vs ~100ms do REST em testes públicos)
- Setup mais simples (sem deployments/stages como objetos separados)
- Suporte nativo a Lambda Authorizer v2.0 com `enable_simple_responses`

### Negativas
- Sem AWS WAF nativo (precisaria CloudFront na frente)
- Sem request validation declarativa (validação fica na Lambda/API)
- Sem usage plans / API keys (se precisarmos no futuro, migrar)

## Alternativas rejeitadas

- **REST API:** features além do necessário; mais caro; mais lento. Vale quando se precisa de WAF nativo + transformações + canary deployments — não é o caso.
- **AppSync (GraphQL):** mudança de paradigma, não justificada.
- **ALB com listener rules complexas + Cognito:** sai do espírito do enunciado (não é "API Gateway").
