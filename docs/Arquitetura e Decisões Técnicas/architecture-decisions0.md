# 📁 Architecture Decision Records (ADR)

Este diretório registra as decisões arquiteturais tomadas durante o desenvolvimento do projeto.

Cada ADR documenta **uma decisão**, o **contexto** que a motivou, as **alternativas consideradas** e as **consequências** esperadas.

Uma vez registrada, uma decisão só é substituída por um novo ADR — nunca editada retroativamente.

---

## Índice

| ID | Título | Status |
|---|---|---|
| [ADR-001](./ADR-001-fake-store-api.md) | Escolha da Fake Store API como alvo dos testes | ✅ Aceita |
| [ADR-002](./ADR-002-configuracao-json-externa.md) | Configuração externalizada em arquivos JSON | ✅ Aceita |
| [ADR-003](./ADR-003-k6-reporter-html.md) | k6-reporter para geração de relatórios HTML | ✅ Aceita |
| [ADR-004](./ADR-004-github-actions-cicd.md) | GitHub Actions como plataforma de CI/CD | ✅ Aceita |
| [ADR-005](./ADR-005-ramping-vus-stress.md) | Executor `ramping-vus` para testes de stress | ✅ Aceita |
| [ADR-006](./ADR-006-tags-por-endpoint.md) | Tags por endpoint para thresholds granulares | ✅ Aceita |
| [ADR-007](./ADR-007-fallback-id-fixo.md) | Fallback para ID fixo em APIs sem persistência | ✅ Aceita |

---

## Como ler um ADR

Cada arquivo segue a estrutura:

- **Status** — Proposta / Aceita / Substituída / Descartada
- **Contexto** — Problema ou situação que gerou a decisão
- **Decisão** — O que foi escolhido e por quê
- **Alternativas consideradas** — O que mais foi avaliado
- **Consequências** — O que muda com essa decisão (positivo e negativo)
- **Referências** — Links ou documentos relacionados