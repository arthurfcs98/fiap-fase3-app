# ADR-05 — Ingress NGINX + NLB no EKS

**Data:** 2026-05-25
**Status:** Accepted

## Contexto

O EKS precisa expor a API NestJS para que o API Gateway (via VPC Link) consiga rotear `/api/*` para os pods. Opções:

1. **AWS Load Balancer Controller (ALB Ingress)** — provisiona ALBs por Ingress
2. **NGINX Ingress Controller + Service LoadBalancer (NLB)** — um único NLB pro cluster, NGINX faz roteamento interno
3. **Service tipo `LoadBalancer` direto no Deployment da API** — NLB criado por Service, sem camada NGINX

Restrição importante do AWS Academy: ALB Ingress Controller exige IRSA (IAM Roles for Service Accounts), que exige criar OIDC identity provider — **bloqueado** no sandbox IAM restrito.

## Decisão

Usar **NGINX Ingress Controller** instalado via Helm no namespace `ingress-nginx`, exposto através de um **Service tipo `LoadBalancer`** com annotation `aws-load-balancer-type: nlb`. Isso cria um **Network Load Balancer (NLB)** automaticamente, que vira o backend do **VPC Link** do API Gateway.

Pods da API criam um `Ingress` apontando pra NGINX; nenhum LB AWS adicional por endpoint.

Configuração:
- Helm chart: `ingress-nginx/ingress-nginx` v4.11.2
- Namespace: `ingress-nginx`
- NLB internal (não público) — tráfego entra só via API Gateway VPC Link

## Consequências

### Positivas
- Funciona sem IRSA (compatível com Academy)
- 1 NLB para todo o cluster (vs múltiplos ALBs)
- Roteamento path-based avançado via NGINX (mais opções que ALB)
- Familiar: mesmo controller usado na Fase 2

### Negativas
- NLB é Layer 4 (NGINX faz L7) — perde features que ALB faria nativamente em Layer 7
- NGINX consome ~50Mi RAM por pod do controller (×2 réplicas = 100Mi extra)
- Custo: ~$0.0225/h pro NLB (~$0.50/dia)

### Riscos
- Se houver problema com VPC Link enxergar o NLB, fallback é deixar o Service Public e usar HTTP_PROXY direto no API Gateway (perde isolamento de rede)

## Alternativas rejeitadas

- **AWS Load Balancer Controller (ALB Ingress):** bloqueado por IAM restritivo no Academy.
- **Service LoadBalancer direto na API (sem NGINX):** funcional mas perde flexibilidade de rotear health, swagger, rotas distintas; também cada nova API exigiria novo NLB.
- **Traefik:** equivalente ao NGINX em funcionalidade, mas o time tem mais familiaridade com NGINX (Fase 2).
