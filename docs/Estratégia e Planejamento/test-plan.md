# 🗓️ Test Plan — QA Flow Workshop K6

**Projeto:** QA Flow Workshop K6  
**API Under Test:** Fake Store API (`https://fakestoreapi.com`)  
**Versão do documento:** 1.0  
**Status:** Em andamento  
**Última atualização:** Junho 2026  
**Autor:** Miguel Luis

---

## 1. Objetivo

Este documento descreve **o que será testado, quando e em qual ordem**, mapeando cada fluxo de negócio da Fake Store API para um script k6, definindo dependências entre testes e o cronograma de desenvolvimento do workshop.

Para entender *por que* cada decisão foi tomada (thresholds, perfis de carga, arquitetura), consulte o [`test-strategy.md`](./test-strategy.md).

---

## 2. Fluxos de Negócio Mapeados

A Fake Store API cobre quatro domínios. Cada domínio foi mapeado para um ou mais scripts de acordo com o tipo de operação.

```
Fake Store API
│
├── 🔐 Auth          → POST /auth/login
├── 📦 Produtos      → GET /products, POST, PUT/:id, DELETE/:id
├── 👤 Usuários      → GET /users, POST, GET/:id, PUT/:id, DELETE/:id
└── 🏪 Loja          → GET /
```

---

## 3. Mapeamento: Fluxo → Script → Tipo de Teste

| # | Fluxo de Negócio | Script | Tipo | Config | Status |
|---|---|---|---|---|---|
| 1 | Listagem de produtos | `getAllProducts.js` | Load | `config.load.json` | ✅ Implementado |
| 2 | Listagem geral da loja | `getAllStore.js` | Load | `config.load.json` | ✅ Implementado |
| 3 | CRUD completo de produtos | `productProcess.js` | Load | `config.product-process.json` | ✅ Implementado |
| 4 | CRUD completo de usuários | `usersProcess.js` | Stress | `config.stress.json` | ✅ Implementado |
| 5 | Autenticação (login) | `authProcess.js` | Load | `config.load.json` | ✅ Implementado |
| 6 | Smoke geral da API | `smoke.js` | Smoke | `config.smoke.json` | 🔲 Planejado |
| 7 | Spike em autenticação | `authSpike.js` | Spike | `config.spike.json` | 🔲 Planejado |
| 8 | CRUD de carrinhos | `cartProcess.js` | Load | `config.product-process.json` | 🔲 Planejado |

---

## 4. Detalhamento por Script

### 4.1 `getAllProducts.js` — Listagem de Produtos

**Fluxo coberto:** Usuário acessa a listagem completa de produtos da loja.

**Endpoints:**
```
GET /products
```

**Checks validados:**
- Status 200
- Tempo de resposta abaixo de 600ms
- Payload não vazio (array com itens)

**Perfil de carga:** Load — 40 VUs sustentados por 1 minuto  
**Dependências:** Nenhuma — endpoint público, sem autenticação  
**Relatório gerado:** `results/performance-report.html`

---

### 4.2 `getAllStore.js` — Listagem Geral da Loja

**Fluxo coberto:** Acesso à raiz da API, validando disponibilidade geral do serviço.

**Endpoints:**
```
GET /
```

**Checks validados:**
- Status 200
- Tempo de resposta dentro do threshold

**Perfil de carga:** Load — mesmo perfil do `getAllProducts.js`  
**Dependências:** Nenhuma  
**Relatório gerado:** `results/store-report.html`

---

### 4.3 `productProcess.js` — CRUD de Produtos

**Fluxo coberto:** Ciclo completo de vida de um produto — criação, consulta, atualização e remoção.

**Endpoints e ordem de execução:**
```
POST   /products          → cria produto, captura ID
GET    /products/:id      → consulta produto criado
PUT    /products/:id      → atualiza produto
DELETE /products/:id      → remove produto
```

**Checks validados por grupo:**

| Grupo | Checks |
|---|---|
| POST | Status 201, resposta < 750ms, `id` retornado |
| GET | Status 200, resposta < 550ms |
| PUT | Status 200, resposta < 500ms, `title` atualizado |
| DELETE | Status 200, resposta < 400ms |

**Perfil de carga:** Load — 20 VUs com ramp-up gradual  
**Dependência interna:** O `id` retornado pelo POST é usado nos grupos GET, PUT e DELETE. Se o POST falhar, os demais grupos usam ID fixo como fallback (`productId || 1`)  
**Relatório gerado:** `results/product-process-report.html`

---

### 4.4 `usersProcess.js` — CRUD de Usuários

**Fluxo coberto:** Ciclo completo de vida de um usuário sob carga de stress.

**Endpoints e ordem de execução:**
```
GET    /users             → lista todos os usuários
POST   /users             → cria usuário, captura ID
GET    /users/:id         → consulta usuário criado
PUT    /users/:id         → atualiza usuário
DELETE /users/:id         → remove usuário
```

**Checks validados por grupo:**

| Grupo | Checks |
|---|---|
| GET /users | Status 200, resposta < 500ms, array não vazio |
| POST | Status 201, resposta < 700ms, `id` retornado |
| GET /:id | Status 200, resposta < 500ms, `username` presente |
| PUT | Status 200, resposta < 700ms, `username` atualizado |
| DELETE | Status 200, resposta < 500ms |

**Perfil de carga:** Stress — ramp-up até 150 VUs simultâneos  
**Dependência interna:** Mesmo padrão do productProcess — fallback para `userId || 1` se o POST não retornar ID  
**Relatório gerado:** `results/user-stress-report.html`

---

### 4.5 `authProcess.js` — Autenticação

**Fluxo coberto:** Login de usuário existente e validação do token retornado.

**Endpoints:**
```
POST /auth/login
```

**Checks validados:**
- Status 200
- Resposta abaixo de 600ms
- Campo `token` presente no response

**Perfil de carga:** Load — mesmo perfil do `getAllProducts.js`  
**Dependências:** Requer credenciais válidas configuradas em `settings.json > AUTH.loginPayload`  
**Relatório gerado:** `results/auth-report.html`

---

### 4.6 `smoke.js` — Smoke Geral *(planejado)*

**Fluxo coberto:** Verificação rápida de disponibilidade de todos os endpoints principais.

**Endpoints planejados:**
```
GET  /products
GET  /users
POST /auth/login
GET  /
```

**Perfil de carga:** 1–2 VUs, 30 segundos, sem ramp-up  
**Quando rodar:** Antes de qualquer outra suite; primeiro step no CI  
**Dependências:** Nenhuma  
**Relatório gerado:** `results/smoke-report.html`

---

### 4.7 `authSpike.js` — Spike em Autenticação *(planejado)*

**Fluxo coberto:** Simula pico repentino de logins simultâneos (ex: Black Friday, lançamento de campanha).

**Perfil de carga planejado:**
```
10s → 5 VUs    (baseline)
10s → 200 VUs  (spike brusco)
10s → 5 VUs    (queda)
10s → 0 VUs    (ramp-down)
```

**Dependências:** `authProcess.js` já validado em load test

---

### 4.8 `cartProcess.js` — CRUD de Carrinhos *(planejado)*

**Fluxo coberto:** Ciclo completo de carrinho de compras.

**Endpoints planejados:**
```
GET    /carts
POST   /carts
GET    /carts/:id
PUT    /carts/:id
DELETE /carts/:id
```

**Dependências:** Requer `userId` e `productId` válidos — possível dependência com `productProcess.js`

---

## 5. Dependências entre Scripts

```
smoke.js                   ← pré-requisito para todos os outros
    │
    ├── getAllProducts.js   ← independente
    ├── getAllStore.js      ← independente
    ├── authProcess.js     ← depende de credentials em settings.json
    │       │
    │       └── authSpike.js   ← depende de authProcess validado
    │
    ├── productProcess.js  ← depende internamente do POST retornar ID
    │       │
    │       └── cartProcess.js ← depende de productId válido (planejado)
    │
    └── usersProcess.js    ← depende internamente do POST retornar ID
```

> **Nota:** A Fake Store API não persiste dados reais. Nenhum script depende de dados criados por *outro* script — cada um é autossuficiente. As dependências internas (POST → GET → PUT → DELETE) são gerenciadas dentro do próprio `default()` com fallback para IDs fixos.

---

## 6. Cronograma do Workshop (o workshop vai até a fase 2 , porém escolhi continuar enriquecendo o projeto)

### Fase 1 — Fundamentos e Estrutura ✅
> Configuração do projeto, primeiros scripts, arquitetura de pastas

| Entrega | Descrição | Status |
|---|---|---|
| Estrutura de pastas | `__test__/`, `env/`, `.github/workflows/` | ✅ Concluído |
| `settings.json` | URL base, headers, payloads centralizados | ✅ Concluído |
| `config.load.json` | Perfil de carga para listagens | ✅ Concluído |
| `getAllProducts.js` | Primeiro script de load test | ✅ Concluído |
| `getAllStore.js` | Load test na raiz da API | ✅ Concluído |
| CI/CD | Pipeline no GitHub Actions | ✅ Concluído |

---

### Fase 2 — Fluxos de Processo ✅
> Scripts com CRUD completo, thresholds por endpoint, cenários de stress

| Entrega | Descrição | Status |
|---|---|---|
| `config.product-process.json` | Perfil para testes de processo | ✅ Concluído |
| `productProcess.js` | CRUD completo de produtos com groups e tags | ✅ Concluído |
| `config.stress.json` | Perfil stress com `ramping-vus` | ✅ Concluído |
| `usersProcess.js` | CRUD de usuários sob stress | ✅ Concluído |
| `authProcess.js` | Teste de autenticação | ✅ Concluído |

---

### Fase 3 — Qualidade e Cobertura *(futura)*
> Smoke test, spike test, cobertura de carrinhos, documentação completa

| Entrega | Descrição | Status |
|---|---|---|
| `smoke.js` + `config.smoke.json` | Verificação rápida antes de qualquer suite | 🔲 Pendente |
| `authSpike.js` + `config.spike.json` | Spike test em autenticação | 🔲 Pendente |
| `cartProcess.js` | CRUD de carrinhos | 🔲 Pendente |
| `docs/test-results-template.md` | Template de registro de execuções | ✅ Concluído |

---

### Fase 4 — Observabilidade *(futura)*
> Dashboards, métricas em tempo real, integração com ferramentas de monitoramento

| Entrega | Descrição | Status |
|---|---|---|
| Grafana + InfluxDB | Dashboard de métricas em tempo real | 🔮 Planejado |
| Parametrização de ambientes | Via variáveis de ambiente no CI (`K6_BASE_URL`) | 🔮 Planejado |
| Alertas de regressão | Comparação automática com baseline | 🔮 Planejado |

---

## 7. Ordem de Execução no CI/CD

```
Step 1: smoke.js              ← valida que a API está viva          (planejado)
Step 2: getAllProducts.js      ← load em listagem de produtos
Step 3: getAllStore.js         ← load na raiz
Step 4: authProcess.js        ← load em autenticação
Step 5: productProcess.js     ← processo CRUD de produtos
Step 6: usersProcess.js       ← stress em CRUD de usuários
Step 7: cartProcess.js        ← processo CRUD de carrinhos          (planejado)
Step 8: Upload de artefatos   ← relatórios HTML disponibilizados
```

> Todos os steps rodam com `continue-on-error: true` — a falha de um não bloqueia os seguintes, garantindo coleta completa de evidências.

---

## 8. Relatórios Gerados

| Script | Arquivo de Relatório |
|---|---|
| `getAllProducts.js` | `results/performance-report.html` |
| `getAllStore.js` | `results/store-report.html` |
| `authProcess.js` | `results/auth-report.html` |
| `productProcess.js` | `results/product-process-report.html` |
| `usersProcess.js` | `results/user-stress-report.html` |
| `smoke.js` *(planejado)* | `results/smoke-report.html` |
| `cartProcess.js` *(planejado)* | `results/cart-process-report.html` |

---

*Este documento deve ser atualizado sempre que um novo script for adicionado ou uma fase do workshop for concluída.*