# ADR-03 — Estrutura Multi-Repo (4 Repositórios Separados)

**Data:** 2026-05-25
**Status:** Accepted

## Contexto

O enunciado da Fase 3 é explícito:

> Organizar o projeto em quatro repositórios separados, cada um com CI/CD implementado, com deploy automático para a nuvem:
> 1. Lambda (Function Serverless)
> 2. Infraestrutura Kubernetes (Terraform)
> 3. Infraestrutura do Banco de Dados Gerenciado (Terraform)
> 4. Aplicação principal executando em Kubernetes

A Fase 2 entregou monorepo único (`tech-challenge/`), o que viola o requisito.

## Decisão

Separar em 4 repositórios públicos no GitHub:

| # | Repo | Conteúdo |
|---|------|----------|
| 1 | `fiap-fase3-auth-lambda` | Function Serverless + Terraform de deploy da Lambda |
| 2 | `fiap-fase3-infra-k8s` | Terraform: VPC + EKS + NGINX Ingress |
| 3 | `fiap-fase3-infra-db` | Terraform: RDS Postgres + Secrets Manager |
| 4 | `fiap-fase3-app` | API NestJS + manifestos K8s + docs centrais (RFCs, ADRs, diagramas, PDF, vídeo) |

Comunicação entre repos via:
- **State remoto compartilhado em S3** (`s3://fiap-fase3-tfstate-<accid>/<repo>/main.tfstate`) com DynamoDB lock
- **`terraform_remote_state` data sources** para cross-reference de outputs (ex: Lambda lê endpoint do RDS, Gateway lê NLB do EKS)
- **Diagramas e RFCs centralizados** em `fiap-fase3-app/docs/` (linkados dos READMEs dos outros 3)

Branch protection em todos: `main` exige PR (sem commits diretos), branch `homolog` paralela pra deploy de pré-produção.

`soat-architecture` adicionado como collaborator (Read) nos 4 repos — exigência do enunciado.

## Consequências

### Positivas
- Atende requisito explícito do enunciado
- Cada repo tem ciclo de deploy independente (lambda pode ir pra produção sem rebuildar EKS)
- Permissionamento mais granular por equipe (se houvesse equipe)
- Pipeline de CI/CD por repo é mais simples e rápido
- Branch protection isola riscos

### Negativas
- Refactor cross-cutting (ex: mudar um contrato JWT) exige PRs em 2-3 repos
- State remoto requer ordem de provisionamento (`infra-k8s` antes de `infra-db` antes de `auth-lambda` antes de `app`)
- Versionamento conjunto inexistente — se quebra contrato Lambda↔API, descobrimos em runtime

### Mitigações
- README do `fiap-fase3-app` centraliza ordem de execução em "Setup Completo"
- Plano [15 — Execução Blitz](../../../plans/fase-3/15-execucao-blitz.md) documenta dependências

## Alternativas rejeitadas

- **Monorepo (Fase 2):** viola requisito explícito.
- **Monorepo com 4 subdiretórios + workflows separados por path:** tecnicamente atende "CI/CD por repo" mas o enunciado pede **repositórios separados** com Pull Requests independentes. Não passa numa leitura literal.
