# ADR-06 — Observabilidade com Grafana Cloud

**Data:** 2026-05-25
**Status:** Accepted (substitui rascunho inicial que apontava para New Relic)
**Arquivo legado:** mantido o nome original `ADR-06-observability-newrelic.md` por estabilidade do link nos demais documentos; conteúdo redirecionado para Grafana Cloud.

## Contexto

O enunciado da Fase 3 lista como obrigatório:

> Implementar integração com ferramentas como Datadog ou New Relic (escolha livre).

E exige monitorar:
- Latência das APIs
- Consumo de recursos do K8s (CPU, memória)
- Healthchecks e uptime
- Alertas para falhas no processamento de OS
- Logs estruturados (JSON) com correlação entre requisições
- Dashboards (volume diário de OS, tempo médio por status, erros)

A redação do enunciado "como Datadog ou New Relic" é exemplificativa, não restritiva — qualquer ferramenta de observabilidade que entregue os requisitos atende. O autor tem preferência por **Grafana**, com familiaridade prévia em queries PromQL/LogQL.

Critérios de escolha:
- Free tier permanente (projeto curto-prazo, sem orçamento)
- Sem cartão de crédito
- Visualização unificada (métricas + logs + traces + uptime)
- Padrão aberto (OpenTelemetry) pra reduzir lock-in
- Setup viável no AWS Academy Learner Lab

## Decisão

Usar **Grafana Cloud** (SaaS managed, free tier) como única plataforma de observabilidade. Stack:

| Sinal | Backend | Coletor |
|-------|---------|---------|
| Métricas | Mimir/Prometheus (Grafana Cloud) | Grafana Alloy (DaemonSet no EKS) |
| Logs | Loki (Grafana Cloud) | Grafana Alloy + Fluent Bit fallback |
| Traces | Tempo (Grafana Cloud) | OpenTelemetry SDK no app + AWS Lambda layer |
| Visualização | Grafana (UI managed) | — |
| Synthetic monitoring | Grafana Synthetic Monitoring | — |
| Alertas | Grafana Alerting | — |

**Free tier permanente** (não trial):
- 10.000 séries Prometheus ativas
- 50 GB de logs/mês
- 50 GB de traces/mês
- 14 dias de retenção
- 3 usuários
- Synthetic checks: 100k execuções/mês
- Alerting incluído

Setup técnico:
- Conta criada em `grafana.com/products/cloud` (free, sem cartão)
- **Grafana Alloy** instalado via Helm no EKS (substitui Promtail/Agent legacy)
- App NestJS: `@grafana/faro-web-sdk` (opcional, frontend) + `@opentelemetry/sdk-node` + `@opentelemetry/auto-instrumentations-node`
- Lambdas: Grafana Lambda extension layer ou OTel layer apontando pro endpoint do Grafana Cloud
- Dashboards declarados como JSON e versionados no repo (`fiap-fase3-app/grafana/dashboards/*.json`); aplicados via Terraform com provider `grafana/grafana` (também aceita import manual via UI)

## Consequências

### Positivas
- Padrões abertos: OpenTelemetry pra instrumentação; PromQL/LogQL pra queries — portável pra qualquer backend compatível no futuro
- Visualização unificada (métricas + logs + traces em um único painel)
- Familiaridade do autor com Grafana — produtividade alta na criação de dashboards
- Free tier permanente, robusto, sem cartão de crédito
- Synthetic monitoring incluído (uptime checks pra rota `/api/health`)
- Provider Terraform oficial pra IaC dos dashboards e alerts

### Negativas
- Mais peças móveis que uma solução "all-in-one" (precisa entender Mimir, Loki, Tempo, Alloy) — mas isso fica abstrato em produto único na UI
- Alloy DaemonSet consome ~50-100Mi RAM por node — irrelevante pra projeto
- Lambda layer da Grafana é menos maduro que NR/Datadog — pode demandar troubleshooting

### Riscos
- Free tier tem limites; se gerar volume excessivo de traces durante demo, pode haver throttling. Mitigação: sampling no SDK
- Conta free pode ter mudanças de política no futuro; risco baixo no horizonte do projeto

## Alternativas rejeitadas

- **New Relic free tier:** atendia bem, mas perde no critério "preferência do autor" + "padrões abertos". NR é proprietário (NRQL), enquanto Grafana usa PromQL/LogQL (PoC com Prometheus oss vira trivial).
- **Datadog free tier:** limitado a 5 hosts, 14 dias de retenção, sem APM Lambda no free; menos previsível pra projeto longo.
- **Stack self-hosted no EKS (Prometheus + Loki + Grafana + Tempo):** complexidade alta; gastaria meio dia do blitz só pra estabilizar; consome recursos do cluster.
- **CloudWatch + X-Ray:** funcional pra APM básico AWS-native, mas:
  - Dashboards limitados (sem PromQL/LogQL)
  - Cross-referência manual entre logs e traces
  - Não atende plenamente "logs estruturados JSON com correlação" (precisaria Insights queries)
  - Ainda assim fica ativado em background como camada de fallback (CloudWatch é nativo)

## Implementação

Ver [Plano 11 — Observabilidade](../../../plans/fase-3/11-observabilidade.md) (atualizado pra Grafana Cloud).
