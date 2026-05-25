# RFC-02 — Autenticação por CPF via Function Serverless

**Autor:** Arthur Freitas Cesarino dos Santos
**Data:** 2026-05-25
**Status:** Accepted

## Contexto

A Fase 2 implementou autenticação tradicional baseada em usuário e senha, com JWT emitido pela própria API NestJS. A Fase 3 reformula esse fluxo: o enunciado exige explicitamente:

> Proteger rotas sensíveis da aplicação com autenticação via CPF. Criar uma Function Serverless para:
> - Validar o CPF do cliente;
> - Consultar a existência e o status do cliente na base de dados;
> - Gerar e devolver um token (JWT) válido para consumo das APIs protegidas.

A motivação real (negócio): a oficina expandiu, atendendo clientes em múltiplas unidades. Operadores trabalham com clientes presenciais — o que importa é identificar **quem é o dono do veículo** rapidamente. CPF é o identificador natural (único, conhecido, já cadastrado). Não há fluxo de "cadastro de senha" pra cliente final no contexto da oficina.

## Decisão

Implementar a autenticação com **AWS Lambda** + **API Gateway HTTP API** + **JWT** (HS256), com o seguinte fluxo:

```
1. Cliente: POST /auth { cpf }
2. API Gateway → Lambda Auth
3. Lambda:
   a. Valida formato + dígitos verificadores do CPF
   b. Consulta tabela customers no RDS por cpf
   c. Se encontrado, gera JWT (sub=customerId, exp=1h)
   d. Retorna { token, expiresIn, customer }
4. Cliente usa token em chamadas subsequentes: Authorization: Bearer <token>
5. API Gateway invoca um Lambda Authorizer custom que valida o JWT
6. Se válido, roteia pra API NestJS via VPC Link
7. API NestJS valida o JWT novamente (defesa em profundidade) e processa
```

### Detalhes técnicos

- **Algoritmo:** HS256 (secret simétrico, gerenciado no Secrets Manager — ver [ADR-07](../adrs/ADR-07-secrets-manager.md))
- **Claims do JWT:** `sub` (customerId UUID), `name`, `cpf` (mascarado), `iat`, `exp`
- **Expiração:** 1 hora. Sem refresh token nesta versão (renova com nova chamada `/auth`)
- **Lambda runtime:** Node.js 20 + TypeScript (consistência com API NestJS)
- **Lambda em VPC:** sim, pra acessar RDS via security group; aceita cold start ~1-3s
- **Validação CPF:** algoritmo brasileiro padrão (11 dígitos, rejeita sequências repetidas, calcula 2 dígitos verificadores mod 11)
- **Lambda Authorizer:** função separada (`fiap-fase3-authorizer`), valida apenas assinatura+expiração do JWT, retorna `{ isAuthorized, context }` com claims pro API Gateway

## Alternativas consideradas

### Opção A — Amazon Cognito

**Prós:** serviço gerenciado de identidade; integra nativamente com API Gateway; tem MFA, recuperação de senha, etc.

**Contras:**
- Cognito User Pools usa username/email/phone como identificador primário, não CPF. Adaptar exigiria custom attribute + alias + lambdas de pre-signup; complexidade alta para benefício marginal
- Não atende o requisito explícito de "criar uma Function Serverless para validar CPF" (Cognito seria o opposite — usar serviço gerenciado pronto)
- Possível bloqueio de criação no AWS Academy (User Pools podem estar restritos)

**Rejeitada** por desalinhamento com o enunciado.

### Opção B — Manter login user/senha no NestJS (sem Lambda)

**Prós:** zero refactor; já testado.

**Contras:** **não atende ao requisito**. O enunciado é explícito sobre uso de "Function Serverless" pra auth. Reprovação certa.

**Rejeitada.**

### Opção C — Lambda Authorizer só (sem rota `/auth`)

Esquema onde o cliente já manda o CPF no header, e o Authorizer:
1. Valida CPF
2. Consulta cliente
3. Gera contexto com customerId
4. API recebe customer via `request.requestContext.authorizer`

**Prós:** sem emissão de token; uma única função; latência por chamada inclui só uma Lambda.

**Contras:**
- Cada chamada pra API roda consulta no RDS — não escala (latência + custo de queries)
- CPF em todo request é menos seguro que JWT short-lived
- Não atende o requisito "Gerar e devolver um token (JWT) válido"

**Rejeitada.**

### Opção D — Lambda + Token assimétrico (RS256 + JWKS)

Lambda emite JWT assinado com chave privada RS256; API Gateway usa **JWT Authorizer nativo** que valida via JWKS público.

**Prós:** Authorizer nativo (sem custom Lambda); chave privada nunca sai do Lambda; chave pública distribuída via JWKS.

**Contras:**
- Maior complexidade de setup (gerar par RSA, publicar JWKS num endpoint público, rotacionar)
- Marginal pra projeto acadêmico (HS256 é simples e seguro com secret bem guardado)
- API Gateway HTTP API JWT Authorizer nativo exige endpoint JWKS exposto — orquestração adicional

**Rejeitada** por complexidade desproporcional. Reconsiderar em produção real.

## Consequências

### Positivas
- Atende literalmente o requisito do enunciado
- Separa concerns: identidade (Lambda) vs lógica de negócio (NestJS)
- Lambda escala automaticamente até limite do Academy (10 concorrentes — suficiente)
- Pay-per-request (Lambda) ao invés de pod sempre on (significativo se Lambda ficar de pé entre demos)
- JWT permite frontend stateless

### Negativas / Trade-offs
- **Cold start** Lambda em VPC ~1-3s; aceitável pra projeto, problemático em produção real (mitigação seria provisioned concurrency)
- **Sem refresh token** — UX exige re-autenticação a cada 1h. Em produção, adicionar refresh; pra demo de 15min, irrelevante
- **CPF em payload do JWT** (mascarado) — claim útil em logs/auditoria, mas é dado pessoal (LGPD); mascaramento mitiga, criptografia adicional poderia ser feita
- **Defesa em profundidade dupla** (Authorizer + JwtStrategy no Nest) — desperdiça ~1ms por request mas garante que mesmo bypass do Gateway (kubectl port-forward) ainda exija token

### Riscos
- Lambda em VPC tem ENI overhead — se concorrência ultrapassar limite Academy, requests pendentes recebem 429. Mitigação: limitar reservedConcurrentExecutions no Terraform pra evitar surpresa
- Bug em validação de CPF deixa falsos negativos. Mitigação: testes unitários cobrindo casos conhecidos (vetor de CPFs válidos e inválidos)

## Referências

- Enunciado Fase 3, seção "Autenticação e API Gateway"
- [ADR-04 — API Gateway HTTP API](../adrs/ADR-04-http-api.md)
- [ADR-07 — Secrets Manager para JWT](../adrs/ADR-07-secrets-manager.md)
- [Plano 07 — Lambda Auth](../../../plans/fase-3/07-lambda-auth.md)
- Algoritmo CPF: https://www.geradorcpf.com/algoritmo_do_cpf.htm
