# Architecture Decision Records (ADRs)

ADRs são registros curtos e imutáveis das decisões arquiteturais permanentes da Fase 3. RFCs (em [`../rfcs/`](../rfcs/)) discutem alternativas; ADRs registram a decisão final.

## Índice

| # | Título | Status |
|---|--------|--------|
| 01 | [EKS gerenciado vs K3s self-hosted](ADR-01-eks-managed.md) | Accepted |
| 02 | [Credenciais STS rotativas no CI/CD](ADR-02-sts-rotation.md) | Accepted |
| 03 | [Estrutura multi-repo (4 repositórios)](ADR-03-multi-repo.md) | Accepted |
| 04 | [API Gateway HTTP API](ADR-04-http-api.md) | Accepted |
| 05 | [Ingress NGINX + NLB no EKS](ADR-05-ingress-nginx.md) | Accepted |
| 06 | [Observabilidade com New Relic](ADR-06-observability-newrelic.md) | Accepted |
| 07 | [Secrets em AWS Secrets Manager](ADR-07-secrets-manager.md) | Accepted |

## Convenção

- Numeração sequencial, nunca reaproveitada
- Status: `Proposed` → `Accepted` → `Superseded by ADR-NN`
- ADRs aceitos são **imutáveis**. Se a decisão mudar, crie novo ADR que "supersedes" o anterior.
