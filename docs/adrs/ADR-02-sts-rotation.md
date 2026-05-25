# ADR-02 — Credenciais STS Rotativas no CI/CD

**Data:** 2026-05-25
**Status:** Accepted

## Contexto

O AWS Academy Learner Lab emite credenciais STS temporárias (`aws_access_key_id` + `aws_secret_access_key` + `aws_session_token`) que são **regeneradas a cada `Start Lab`** (a cada 4 horas, ou ao iniciar uma nova sessão). Não é possível:

1. Criar usuários IAM com keys permanentes (IAM bloqueado)
2. Configurar OIDC identity provider para GitHub Actions (IAM bloqueado)
3. Usar `aws-actions/configure-aws-credentials` com `role-to-assume` apontando pra role custom (não pode criar)

Em produção real, a prática recomendada seria GitHub Actions com OIDC + role assumida via federação. No sandbox, isso é inviável.

## Decisão

GitHub Actions de cada um dos 4 repositórios usa secrets com as 3 credenciais STS atuais:

| Secret | Origem |
|--------|--------|
| `AWS_ACCESS_KEY_ID` | Lab → AWS Details → AWS CLI |
| `AWS_SECRET_ACCESS_KEY` | idem |
| `AWS_SESSION_TOKEN` | idem |
| `AWS_REGION` | hardcoded `us-east-1` |

Atualização: script `scripts/sync-aws-creds.sh` no repo `fiap-fase3-app`:

```bash
#!/usr/bin/env bash
# Lê profile [fiap] de ~/.aws/credentials e publica nos GitHub secrets dos 4 repos.
set -euo pipefail
AK=$(aws --profile fiap configure get aws_access_key_id)
SK=$(aws --profile fiap configure get aws_secret_access_key)
ST=$(aws --profile fiap configure get aws_session_token)
for R in fiap-fase3-auth-lambda fiap-fase3-infra-k8s fiap-fase3-infra-db fiap-fase3-app; do
  gh secret set AWS_ACCESS_KEY_ID     --repo arthurfcs98/$R --body "$AK"
  gh secret set AWS_SECRET_ACCESS_KEY --repo arthurfcs98/$R --body "$SK"
  gh secret set AWS_SESSION_TOKEN     --repo arthurfcs98/$R --body "$ST"
done
echo "Synced AWS creds to 4 repos."
```

Rodar antes de qualquer push importante, sempre depois de novo `Start Lab`.

## Consequências

### Positivas
- Solução simples e funcional dentro das restrições do sandbox
- Permite CI/CD totalmente automatizado durante uma sessão
- Não requer infraestrutura adicional

### Negativas
- **Não é production-grade.** Token compartilhado entre 4 repos = blast radius alto se um repo vazar
- Manutenção manual (rodar script) a cada 4h se sessão renovou
- Se token expirar no meio de um workflow longo, falha (mitigação: workflows curtos; reapply ao reiniciar sessão)

## Alternativas rejeitadas

- **OIDC + IAM role federada (best practice):** IAM Identity Provider creation bloqueado no Academy.
- **AWS Vault tool no runner:** runner do GitHub Actions é efêmero — vault não persiste; ainda precisaria de credenciais base.
- **Self-hosted runner na VM safira:** complexidade desnecessária; perderia ambiente isolado do GitHub.
