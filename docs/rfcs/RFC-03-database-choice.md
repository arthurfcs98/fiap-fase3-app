# RFC-03 — Escolha do Banco de Dados Gerenciado

**Autor:** Arthur Freitas Cesarino dos Santos
**Data:** 2026-05-25
**Status:** Accepted

## Contexto

A Fase 3 exige explicitamente:
> **Banco de Dados Gerenciado** (PostgreSQL, MySQL, SQL Server, etc.)

E também:
> Justificativa formal para a escolha do banco de dados e ajustes no modelo relacional, com diagramas ER e explicação dos relacionamentos.

A Fase 2 modelou o domínio em **PostgreSQL** com TypeORM, contemplando:
- Customers (clientes)
- Vehicles (veículos por cliente)
- Services (catálogo de serviços)
- Parts (catálogo de peças com estoque)
- ServiceOrders (ordens de serviço) com status workflow
- ServiceOrderItems (itens da OS — serviços e/ou peças)

Existem 11 migrations TypeORM aplicadas e schema validado por 380 testes.

## Decisão

Manter **PostgreSQL** como SGBD, migrando da instância em pod (Fase 2) para **Amazon RDS Postgres** (Fase 3), com a seguinte configuração:

| Atributo | Valor |
|----------|-------|
| Engine | PostgreSQL 16.x |
| Instance class | `db.t3.micro` (Burstable, 2 vCPU, 1 GB RAM) |
| Storage | 20 GB gp2 |
| Multi-AZ | No (custo) |
| Backup retention | 0 (modo blitz, recriação via Terraform) |
| Publicly accessible | No |
| Encryption at rest | Yes (default AWS managed key) |
| Enhanced Monitoring | Off (não suportado no Academy) |
| Performance Insights | Off |

Credenciais (usuário, senha, host) armazenadas no **AWS Secrets Manager** (ver [ADR-07](../adrs/ADR-07-secrets-manager.md)) e consumidas pela Lambda Auth e pela API NestJS via `aws-sdk`.

## Alternativas consideradas

### Opção A — Amazon Aurora Serverless v2

**Prós:**
- Auto-scaling até zero ACU (~$0 quando inativo)
- Compatível com Postgres
- Backups automáticos

**Contras:**
- Mais caro em uso ativo (~$0.12/ACU-hora, mínimo 0.5 ACU = $0.06/h vs $0.018/h do `db.t3.micro`)
- Pode não estar habilitado no Academy Learner Lab (Aurora Serverless costuma estar em listas restritas)
- Cold start (~30s pra escalar de 0 → 0.5 ACU) atrapalha demo
- Overkill pra carga zero do projeto acadêmico

**Rejeitada** por custo e disponibilidade incerta.

### Opção B — Amazon DynamoDB

**Prós:**
- Totalmente gerenciado, escala automaticamente
- Pay-per-request (zero custo sem tráfego)
- Atende "banco de dados gerenciado"

**Contras:**
- **NoSQL** — exige remodelagem completa do domínio (sem JOIN, sem agregações nativas, sem FK)
- Quebra todo o código TypeORM da Fase 2
- Não atende "modelo relacional" + "diagramas ER" + "relacionamentos" exigidos na justificativa
- Ordens de serviço dependem de queries com agregação (volume por status, totais) — DynamoDB exige design de access patterns muito específico

**Rejeitada** por incompatibilidade com modelo relacional exigido.

### Opção C — Amazon RDS MySQL

**Prós:**
- Também gerenciado
- Habilitado no Academy
- Schema relacional preservado

**Contras:**
- Perde features que a Fase 2 usa: CTEs, window functions, tipo `jsonb`, `gen_random_uuid()`, `CHECK` constraints com regex
- TypeORM funciona em MySQL, mas migrations da Fase 2 precisariam ser reescritas
- Zero ganho sobre Postgres

**Rejeitada** por desvio desnecessário.

### Opção D — Amazon RDS SQL Server

**Contras:**
- Custo significativamente maior (licensing)
- Não compatível com TypeORM de forma transparente em alguns features
- Sem aderência ao stack atual

**Rejeitada.**

## Justificativa formal (resposta direta ao enunciado)

### Por que PostgreSQL?

1. **Continuidade arquitetural:** o domínio foi modelado em Postgres na Fase 2; reaproveita 11 migrations TypeORM, 6 entidades, 380 testes. Migrar de SGBD agora seria retrabalho sem ganho funcional.

2. **Recursos relacionais avançados utilizados:**
   - `uuid` nativo (`gen_random_uuid()`) — IDs gerados na app sem ida ao banco
   - `enum` tipado para `order_status` (garantia de integridade no nível do banco)
   - `CHECK` constraints para invariantes (preço ≥ 0, quantity > 0)
   - `jsonb` para metadados extensíveis (audit log, snapshot de itens)
   - CTEs e window functions para queries analíticas (ranking de ordens por prioridade)
   - Suporte robusto a transações ACID e isolation levels (necessário pro fluxo de aprovação de OS)

3. **Ecossistema TypeORM maduro** — driver `pg` battle-tested, migrations declarativas, integração nativa com NestJS.

4. **Open-source, sem lock-in** — facilita eventual portabilidade para outras clouds ou self-hosted.

### Por que RDS (vs Postgres em pod)?

| Critério | Postgres em pod (Fase 2) | RDS Postgres (Fase 3) |
|----------|-------------------------|----------------------|
| Backup automático | Manual (não havia) | Automático (snapshots) |
| Failover | Indisponível em single-node | Multi-AZ disponível (não usado por custo) |
| Patching SO | Manual | Automático |
| Métricas nativas | Limitadas | CloudWatch integrado |
| Conformidade | Self-managed | AWS shared responsibility |
| Atendimento ao requisito | ❌ Não é "gerenciado" | ✅ Gerenciado |

### Ajustes do modelo relacional para Fase 3

Os ajustes são mínimos — o modelo da Fase 2 já é normalizado e atende ao escopo. Mudanças específicas para Fase 3:

1. **Remoção da tabela `users`** (autenticação operador interna): Fase 3 unifica acesso via CPF do cliente; tabela `users` da Fase 2 fica obsoleta (será removida em migration `017_drop_users.sql`).

2. **Coluna `cpf` na tabela `customers` recebe índice `UNIQUE`:** auth depende de `SELECT ... WHERE cpf = $1` em tempo crítico (latência da Lambda). A unicidade já era regra de negócio; agora vira constraint.

3. **Snapshot de itens em `service_order_items`:** já existia (`unit_price`, `total_price`) — relevante pra Fase 3 porque permite ordens auditáveis mesmo se serviços/peças mudarem de preço.

4. **Nenhum schema novo** — Fase 3 é evolução de infra/integração, não de domínio.

### Diagramas

- [Diagrama ER completo](../diagrams/er.md) — DBML + Mermaid + tabela de relacionamentos
- [Diagrama de componentes](../diagrams/componentes.md) — onde o RDS encaixa no stack

## Consequências

### Positivas
- Zero retrabalho de domínio
- Reuso de migrations e testes
- Conformidade plena com requisito "gerenciado"
- Trabalhabilidade alta (psql, dbeaver, etc.)

### Negativas / Trade-offs
- **Single-AZ:** RPO/RTO inadequados pra produção real; aceitável pra demo
- **db.t3.micro:** Burstable — pode esgotar créditos de CPU em testes de carga; suficiente pro fluxo demonstrado
- **gp2 (não gp3):** menos IOPS por GB; irrelevante pro volume da demo

### Riscos
- Se Academy desabilitar Postgres engine (improvável), fallback é MySQL ou MariaDB com migrations adaptadas
- Snapshot final desligado (`skip_final_snapshot = true`) — perde dados no `terraform destroy`; aceitável (sem dados reais)

## Referências

- Enunciado Fase 3, seção "Documentação da Arquitetura" (exige justificativa formal)
- [Plano 06 — Infra RDS](../../../plans/fase-3/06-infra-rds.md)
- [Diagrama ER](../diagrams/er.md)
- [ADR-07 — Secrets Manager](../adrs/ADR-07-secrets-manager.md)
