# fiap-fase3-app

> Parte do Tech Challenge FIAP — Pós-graduação Software Architecture (14SOAT) — **Fase 3**.

## Propósito

API NestJS principal do sistema de gestão de oficina mecânica. Roda em pods no **Amazon EKS**, autentica requisições via JWT emitido pela Lambda externa, persiste em **RDS Postgres** e expõe APIs protegidas via API Gateway.

Este repositório também centraliza a **documentação arquitetural** da Fase 3: RFCs, ADRs, diagramas, ER, e materiais de entrega (vídeo, PDF).

## Arquitetura

Ver [docs/diagrams/componentes.md](docs/diagrams/componentes.md) — visão completa do sistema.

## Tecnologias

| Categoria | Stack |
|-----------|-------|
| Runtime | Node.js 20 |
| Linguagem | TypeScript |
| Framework | NestJS 10 |
| DB | RDS Postgres + TypeORM |
| Cache/Queue | Redis + BullMQ |
| Auth | JWT (validação — emissão em [fiap-fase3-auth-lambda](https://github.com/arthurfcs98/fiap-fase3-auth-lambda)) |
| Email | Resend |
| Observabilidade | OpenTelemetry + Grafana Cloud |
| Docs | Swagger |
| Container | Docker + ECR |
| Orquestração | Amazon EKS |
| CI/CD | GitHub Actions |

## Estrutura

```
fiap-fase3-app/
├── docs/                    # documentação arquitetural (RFCs, ADRs, diagramas)
├── src/                     # código NestJS
├── test/                    # testes Jest
├── k8s/                     # manifestos Kubernetes
├── entrega/                 # template + script de geração do PDF
└── Dockerfile
```

## Setup local

> ⚠️ Em construção — a app é portada da Fase 2 (`tech-challenge/service-order-api`) com refactor descrito em [plano 08](../plans/fase-3/08-app-principal.md).

```bash
npm ci
cp .env.example .env
docker-compose up -d postgres redis
npm run migration:run
npm run start:dev
```

Acesso: http://localhost:3000/api/docs

## Deploy

Pipeline CI/CD:
- PR em `main`/`homolog` → lint + test + build
- Merge em `homolog` → deploy automático em ambiente de homologação
- Merge em `main` → deploy automático em produção

## Documentação arquitetural

- [RFCs](docs/rfcs/) — escolhas técnicas (cloud, auth, banco)
- [ADRs](docs/adrs/) — decisões arquiteturais (EKS, multi-repo, observabilidade, etc.)
- [Diagramas](docs/diagrams/) — componentes, sequência, ER

## Repositórios da Fase 3

- [`fiap-fase3-app`](https://github.com/arthurfcs98/fiap-fase3-app) ← você está aqui
- [`fiap-fase3-auth-lambda`](https://github.com/arthurfcs98/fiap-fase3-auth-lambda) — Function serverless de auth
- [`fiap-fase3-infra-k8s`](https://github.com/arthurfcs98/fiap-fase3-infra-k8s) — Terraform: EKS + Ingress
- [`fiap-fase3-infra-db`](https://github.com/arthurfcs98/fiap-fase3-infra-db) — Terraform: RDS + Secrets

## Autor

Arthur Freitas Cesarino dos Santos — RM369347
