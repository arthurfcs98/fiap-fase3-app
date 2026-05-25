# Diagramas Arquiteturais

Conjunto de diagramas obrigatórios pela Fase 3 do Tech Challenge FIAP.

## Índice

| Diagrama | Arquivo | Formato |
|----------|---------|---------|
| Componentes (visão de cloud) | [componentes.md](componentes.md) | Mermaid flowchart |
| Sequência — Autenticação por CPF | [sequencia-auth.md](sequencia-auth.md) | Mermaid sequenceDiagram |
| Sequência — Criação de Ordem de Serviço | [sequencia-criacao-os.md](sequencia-criacao-os.md) | Mermaid sequenceDiagram |
| Entidade-Relacionamento + justificativa formal | [er.md](er.md) | Mermaid erDiagram + DBML |

## Como visualizar

- **No GitHub:** Mermaid é renderizado nativamente. Abrir o `.md` no browser do GitHub.
- **VSCode:** instalar extensão "Markdown Preview Mermaid Support".
- **Local:** `mmdc -i componentes.md -o componentes.png` (após `npm i -g @mermaid-js/mermaid-cli`).
- **ER em alta resolução:** copiar bloco DBML do [er.md](er.md) em https://dbdiagram.io e exportar PNG.

## Convenções

- **Cores no diagrama de componentes:**
  - Amarelo: tráfego externo
  - Azul: AWS
  - Verde: observabilidade (NR)
  - Roxo: repositórios Git
- **Setas:**
  - Sólida: requisição síncrona / dependência direta
  - Pontilhada: telemetria / async / build pipeline

## Atualizando

Estes diagramas refletem a arquitetura **final** da Fase 3. Mudanças durante implementação devem:
1. Ajustar o `.md` aqui
2. Documentar a razão num ADR (se for mudança arquitetural)
3. Re-gerar a `er.png` se schema mudou

## Para o PDF de entrega

Exportar PNGs:

```bash
# instalar mermaid-cli
npm i -g @mermaid-js/mermaid-cli

# exportar
mmdc -i componentes.md     -o exports/componentes.png    --width 1920 --backgroundColor white
mmdc -i sequencia-auth.md  -o exports/sequencia-auth.png --width 1920 --backgroundColor white
mmdc -i sequencia-criacao-os.md -o exports/sequencia-os.png --width 1920 --backgroundColor white
# para o ER, usar dbdiagram.io
```

PNGs em `exports/` são incluídos no PDF de entrega (plano [14](../../../plans/fase-3/14-pdf-entrega.md)).
