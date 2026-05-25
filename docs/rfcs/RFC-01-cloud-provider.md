# RFC-01 — Escolha do Provedor de Nuvem

**Autor:** Arthur Freitas Cesarino dos Santos
**Data:** 2026-05-25
**Status:** Accepted

## Contexto

A Fase 3 do Tech Challenge exige migrar a aplicação de oficina mecânica para um modelo de "operação corporativa" em nuvem, com:

- **API Gateway** gerenciado
- **Function Serverless** para autenticação
- **Banco de Dados Gerenciado** (RDS, Cloud SQL, ou equivalente)
- **Cluster Kubernetes** com escalabilidade
- **Terraform** como IaC

O enunciado permite "livre escolha de nuvem". A Fase 2 foi entregue usando infraestrutura self-hosted (K3s em VM própria, Postgres em pod, Pritunl VPN), o que não atende a totalidade dos requisitos da Fase 3 (banco precisa ser gerenciado; espírito do enunciado favorece cloud).

Restrição financeira relevante: o projeto é acadêmico, sem orçamento corporativo. A estratégia escolhida é **modo blitz** — montar, testar, gravar vídeo e derrubar tudo em 2-3 dias, ao invés de manter ambiente 24/7 por meses.

## Decisão

Usar **AWS** como provedor de nuvem, acessada via **AWS Academy Learner Lab** (curso 165490 — orçamento de $50 USD total).

Todos os componentes obrigatórios da Fase 3 serão deployados na AWS:

| Componente | Serviço AWS |
|------------|------------|
| API Gateway | API Gateway HTTP API |
| Function Serverless | AWS Lambda |
| Banco Gerenciado | Amazon RDS Postgres |
| Cluster Kubernetes | Amazon EKS |
| IaC | Terraform com provider `hashicorp/aws` |
| Observabilidade | New Relic (free tier) + CloudWatch nativo |
| Registry | Amazon ECR |
| Secrets | AWS Secrets Manager |
| State Terraform | S3 + DynamoDB lock |

## Alternativas consideradas

### Opção A — Azure (via Azure for Students)

- **Crédito:** $100 USD por 12 meses, sem cartão de crédito
- **AKS:** control plane gratuito (só paga nodes)
- **Postgres Flexible Server Burstable B1ms:** ~$13-16/mês
- **Functions:** 1M execuções/mês free permanente
- **API Management Consumption tier:** 1M chamadas/mês free

**Prós:** mais previsível pra rodar por meses; AKS gratuito; sem dependência de curso ativo.

**Contras:** afastamento dos exemplos do enunciado (AWS API Gateway é citado explicitamente como exemplo); strategia blitz neutraliza vantagem de longevidade; ferramental familiar do autor é AWS.

### Opção B — GCP (Free Trial)

- **Crédito:** $300 USD por 90 dias

**Contras:** exige cartão de crédito; conta pessoal corre risco de cobrança após trial; ecossistema menos alinhado com o enunciado (Cloud Functions, Cloud Run, Cloud SQL — terminologia diferente do "API Gateway + Lambda + RDS").

### Opção C — Multi-cloud (Azure para K8s + AWS para Lambda/RDS)

**Prós:** experimentação rica; aproveitamento de múltiplos free tiers.

**Contras:** complexidade desnecessária; gerenciamento de credenciais duplicado; redes cruzadas (VPN/peering) inviáveis no sandbox da Academy; risco de não terminar no prazo.

### Opção D — Self-hosted (manter K3s + adicionar componentes self-hosted)

**Prós:** custo zero contínuo; reuso da Fase 2.

**Contras:** **não atende o requisito "Banco de Dados Gerenciado"**; espírito do enunciado é demonstrar uso de cloud; banca pode questionar.

## Consequências

### Positivas
- Alinhamento total com exemplos do enunciado (AWS API Gateway, Lambda)
- Terraform AWS provider é o mais maduro do ecossistema
- Demonstra prática de cloud "real" (não apenas K8s genérico)
- Custo previsível: ~$15-18 em 3 dias blitz, com folga sobre o orçamento de $50

### Negativas / Trade-offs aceitos
- **Credenciais STS rotativas** a cada 4h (sessão do Learner Lab) → CI/CD precisa atualização manual dos secrets a cada nova sessão (mitigação: script `sync-aws-creds.sh`)
- **Roles IAM fixas** (`LabRole`, `LabEksClusterRole`, `LabInstanceProfile`) → não é possível criar roles arbitrárias; Terraform referencia roles existentes
- **Region única** (`us-east-1`) → sem demonstração de multi-region
- **Acesso encerra** ao fim do curso Academy → após entrega, eventual re-execução exige re-inscrição ou conta nova
- **NAT Gateway evitado** (custo alto) → nodes EKS em subnets públicas, documentado como decisão arquitetural ([ADR-01](../adrs/ADR-01-eks-managed.md))

### Riscos
- Se EKS não estiver disponível no Learner Lab por restrição não documentada, fallback é ECS Fargate (não atende "Cluster Kubernetes" literal — exigiria RFC superseding)
- Se crédito esgotar antes da gravação, fallback é Azure for Students ($100 cobre +6 meses)
- Se conta Academy expirar antes da entrega no Portal do Aluno, documentação completa nos repos permite avaliação assíncrona pela banca (deploys live são "se aplicável" no enunciado)

## Referências

- Enunciado Fase 3: `tech-challenge/14SOAT - Fase 3 - Tech challenge.pdf`
- AWS Academy Learner Lab restrictions: documento "Service usage and other restrictions" do curso 165490
- [ADR-01 — EKS Managed Cluster](../adrs/ADR-01-eks-managed.md)
- [ADR-02 — Credenciais STS Rotativas](../adrs/ADR-02-sts-rotation.md)
