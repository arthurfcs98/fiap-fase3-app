# ADR-01 — EKS Gerenciado vs K3s Self-Hosted

**Data:** 2026-05-25
**Status:** Accepted

## Contexto

A Fase 2 entregou um cluster K3s self-hosted em VM própria, com HPA configurado (2-5 réplicas). O requisito da Fase 3 é "Cluster Kubernetes com escalabilidade". Embora K3s atenda literalmente (HPA OK), o espírito do enunciado é demonstrar prática de cloud — "Infraestrutura obrigatória (livre escolha de nuvem)".

Considerando a estratégia blitz (2-3 dias ligado), o custo extra do EKS gerenciado é absorvível dentro do orçamento de $50 do AWS Academy Learner Lab.

## Decisão

Provisionar o cluster Kubernetes como **Amazon EKS** na region `us-east-1`, usando a role pré-existente `LabEksClusterRole` (Academy não permite criar roles arbitrárias).

Configuração:
- Cluster: `fiap-fase3-eks`, versão 1.30
- Nodegroup gerenciado: `t3.small` × 2 (desired), max 3
- Endpoint público (Academy não suporta IRSA com OIDC custom)
- VPC custom 10.20.0.0/16, 2 subnets públicas (us-east-1a, us-east-1b)

## Consequências

### Positivas
- Alinhamento completo com "livre escolha de nuvem"
- Control plane gerenciado pela AWS (patching, HA do controle)
- Integração nativa com IAM, ECR, ALB/NLB, CloudWatch
- Banca não tem motivo pra questionar adequação

### Negativas
- Custo: ~$0.10/h control plane + ~$0.04/h nodes = $0.14/h × 72h (blitz) ≈ $10
- Provisionamento lento (~15-20 min) — afeta iteração local
- Sem IRSA: serviceaccounts no EKS herdam role do node (`LabEksClusterRole`) em vez de role específica por workload (menos privilégio mínimo)

## Alternativas rejeitadas

- **K3s self-hosted (Fase 2):** atende literalmente mas vai contra o espírito do enunciado; banca pode penalizar.
- **ECS Fargate:** mais barato, mas **não é Kubernetes** — viola requisito explícito.
- **AKS via Azure Students:** AKS gratuito atrai pra rodadas longas; estratégia blitz neutraliza vantagem; ferramentas/credenciais do AWS Academy já configuradas.
