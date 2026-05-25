# ADR-07 — Secrets em AWS Secrets Manager

**Data:** 2026-05-25
**Status:** Accepted

## Contexto

A Fase 3 lida com dados sensíveis que precisam ser gerenciados fora do código:

- Senha do RDS Postgres
- JWT signing secret (compartilhado entre Lambda Auth e API NestJS)
- (Eventual) chaves de API de serviços terceiros (Resend, etc.)

A Fase 2 usou `Secret` nativo do Kubernetes, com valores placeholder em base64 substituídos por Terraform via `sed` no deploy. Funcional, mas:
- Secret K8s é base64 (não criptografia real) — qualquer um com `kubectl get secret -o yaml` lê
- Rotação manual e propensa a erro
- Sem audit trail nativo
- Não atravessa o serverless (Lambda não consome Secret K8s)

## Decisão

Usar **AWS Secrets Manager** como fonte única de secrets. Estrutura:

| Secret name | Conteúdo (JSON) | Consumido por |
|-------------|----------------|---------------|
| `fiap-fase3-db-credentials` | `{ username, password, host, port, dbname }` | Lambda Auth, API NestJS (via `SecretsService`) |
| `fiap-fase3-jwt-secret` | string raw (48 chars random) | Lambda Auth (assina), Lambda Authorizer (verifica), API NestJS (verifica) |

Geração:
- `random_password` no Terraform do repo `infra-db` gera as senhas
- Versionamento automático ao trocar `secret_string`
- `recovery_window_in_days = 0` durante modo blitz (delete imediato no destroy)

Acesso (autorização):
- `LabRole` (atribuída a Lambdas e nodes EKS) tem permissão `secretsmanager:GetSecretValue`
- Pods da API herdam permissão via instance metadata (sem IRSA, ver [ADR-05](ADR-05-ingress-nginx.md))

Consumo:
- Lambda: `@aws-sdk/client-secrets-manager` no boot, cache em variável de módulo
- NestJS: `SecretsService` (provider `OnModuleInit`) carrega no startup do pod

## Consequências

### Positivas
- Criptografia at-rest com KMS managed key
- Rotação automática suportada (não usada no projeto, mas demonstrável)
- Acesso auditável via CloudTrail
- Múltiplos consumidores (Lambda + EKS) lêem do mesmo lugar — JWT secret consistente
- Versionamento de secrets — possibilidade de rollback

### Negativas
- Custo: $0.40/secret/mês — irrelevante no projeto (2 secrets × ~3 dias = $0.08)
- Cold start ligeiramente maior nas Lambdas (chamada extra ao SM no primeiro invoke)
- Pods do NestJS demoram mais pra ficar Ready (1-2s extra) pelo `onModuleInit` esperar resposta do SM

### Riscos
- Se `LabRole` perder permissão `secretsmanager:GetSecretValue` (mudança no Academy), tudo quebra. Mitigação: testar antes da gravação do vídeo.
- Limite de chamadas API ao Secrets Manager (10.000/segundo) — irrelevante no projeto.

## Alternativas rejeitadas

- **K8s Secret (Fase 2):** não atravessa o Lambda; menos seguro que SM.
- **HashiCorp Vault self-hosted:** complexidade desnecessária no Academy.
- **AWS Systems Manager Parameter Store:** atende, é mais barato (até 10k params free), mas Secrets Manager tem rotação automática e expira — features mais alinhadas com "operação corporativa" exigida pelo enunciado.
- **Variáveis de ambiente em `terraform.tfvars`:** anti-padrão; secrets ficam em texto plano no state remoto (S3 já é encrypted, mas qualquer leitor do state tem acesso).
