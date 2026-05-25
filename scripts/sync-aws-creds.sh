#!/usr/bin/env bash
#
# sync-aws-creds.sh — Sincroniza credenciais STS do AWS Academy Learner Lab
#                     para os GitHub secrets dos 4 repos da Fase 3.
#
# Por que existe:
#   O AWS Academy emite credenciais temporárias que mudam a cada `Start Lab` (4h).
#   Não é possível usar OIDC/role assumption federada (IAM bloqueado no sandbox).
#   Este script lê o profile [fiap] de ~/.aws/credentials e publica nos GitHub secrets
#   dos 4 repos. Rodar antes de cada push importante após uma nova sessão do Lab.
#
# Pré-requisitos:
#   - aws cli configurada com profile [fiap]
#   - gh cli autenticada na conta arthurfcs98
#
# Uso:
#   ./scripts/sync-aws-creds.sh
#
# Decisão documentada em: docs/adrs/ADR-02-sts-rotation.md

set -euo pipefail

PROFILE="${AWS_PROFILE_FIAP:-fiap}"
GH_OWNER="${GH_OWNER:-arthurfcs98}"
REPOS=(
  "fiap-fase3-auth-lambda"
  "fiap-fase3-infra-k8s"
  "fiap-fase3-infra-db"
  "fiap-fase3-app"
)

if ! command -v aws >/dev/null 2>&1; then
  echo "❌ aws cli não encontrada." >&2
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh cli não encontrada." >&2
  exit 1
fi

# Valida que o profile existe
if ! aws configure get aws_access_key_id --profile "$PROFILE" >/dev/null 2>&1; then
  echo "❌ Profile [$PROFILE] não encontrado em ~/.aws/credentials" >&2
  echo "   Configure com:" >&2
  echo "     aws configure set aws_access_key_id <ID> --profile $PROFILE" >&2
  exit 1
fi

# Valida sessão ativa
echo "🔍 Validando sessão STS..."
IDENTITY=$(aws sts get-caller-identity --profile "$PROFILE" 2>&1) || {
  echo "❌ Sessão STS inválida ou expirada. Faça 'Start Lab' no Canvas e reconfigure o profile." >&2
  echo "   Erro: $IDENTITY" >&2
  exit 1
}
ACCOUNT_ID=$(echo "$IDENTITY" | python3 -c "import json,sys;print(json.load(sys.stdin)['Account'])")
echo "   Account: $ACCOUNT_ID ✓"

# Lê credenciais do profile
AK=$(aws configure get aws_access_key_id     --profile "$PROFILE")
SK=$(aws configure get aws_secret_access_key --profile "$PROFILE")
ST=$(aws configure get aws_session_token     --profile "$PROFILE")
REGION=$(aws configure get region            --profile "$PROFILE")
REGION="${REGION:-us-east-1}"

# Publica em todos os repos
for R in "${REPOS[@]}"; do
  echo "📤 $GH_OWNER/$R"
  printf '%s' "$AK"         | gh secret set AWS_ACCESS_KEY_ID     --repo "$GH_OWNER/$R" >/dev/null
  printf '%s' "$SK"         | gh secret set AWS_SECRET_ACCESS_KEY --repo "$GH_OWNER/$R" >/dev/null
  printf '%s' "$ST"         | gh secret set AWS_SESSION_TOKEN     --repo "$GH_OWNER/$R" >/dev/null
  printf '%s' "$REGION"     | gh secret set AWS_REGION            --repo "$GH_OWNER/$R" >/dev/null
  printf '%s' "$ACCOUNT_ID" | gh secret set AWS_ACCOUNT_ID        --repo "$GH_OWNER/$R" >/dev/null
done

echo
echo "✅ Credenciais sincronizadas em ${#REPOS[@]} repos."
echo "   Validade: ~4h (sessão Academy)."
