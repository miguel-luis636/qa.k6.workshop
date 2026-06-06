# 📊 Test Results — Execução #001

**Data:** Junho 2026  
**Ambiente:** Local / CI (GitHub Actions)  
**API Under Test:** Fake Store API (`https://fakestoreapi.com`)  
**Ferramenta:** k6 + k6-reporter v3.0.4  
**Executado por:** Miguel Luis  
**Branch/Commit:** `main`

---

## Sumário Executivo

| Suite | Requests | Erros HTTP | Thresholds Quebrados | Checks Falhando | Resultado |
|---|---|---|---|---|---|
| `getAllProducts` | 1.980 | 0 | 2 | 202 (10,2%) | ⚠️ Parcial |
| `productProcess` | 4.640 | 0 | 5 | 244 (2,1%) | ⚠️ Parcial |
| `authProcess` | 1.904 | 0 | 0 | 25 (0,4%) | ✅ Passou |
| `usersProcess` | 15.752 | 0 | 6 | 6.486 (14,7%) | ❌ Falhou |
| **TOTAL** | **24.276** | **0** | **13** | **6.957** | **⚠️ Atenção** |

> **Ponto positivo:** Taxa de erro HTTP zerada em todas as suites — a API respondeu em todas as requisições.  
> **Ponto de atenção:** Thresholds de tempo foram violados, especialmente no stress test de usuários sob alta carga (150 VUs).

---

## 1. getAllProducts — Load Test

**Script:** `getAllProducts.js` | **Config:** `config.load.json`  
**Perfil:** 30s → 20 VUs → 1m → 40 VUs → 30s → 0

### Métricas de Tempo (ms)

| Métrica | Avg | Min | Med | Max | p(90) | p(95) |
|---|---|---|---|---|---|---|
| `http_req_duration` | 366,11 | 214,55 | 239,02 | 6206,01 | 627,09 | **996,23** |
| `http_req_waiting` | 305,27 | 213,13 | 232,03 | 6205,33 | 301,08 | 581,87 |
| `http_req_blocked` | 1,24 | 0,00 | 0,00 | 110,06 | 0,00 | 0,00 |
| `http_req_connecting` | 0,52 | 0,00 | 0,00 | 71,60 | 0,00 | 0,00 |
| `iteration_duration` | 1368,50 | 1215,53 | 1245,50 | 7206,77 | 1627,98 | 1997,18 |

### Métricas Gerais

| Métrica | Valor |
|---|---|
| Total de requests | 1.980 |
| Taxa de requests | 16,36 req/s |
| VUs (min / max) | 1 / 40 |
| Total de iterações | 1.980 |
| Dados recebidos | 22,07 MB |
| Dados enviados | 0,24 MB |
| `http_req_failed` | 0,00% ✅ |

### Thresholds

| Threshold | Valor Definido | Resultado Medido | Status |
|---|---|---|---|
| `http_req_duration` p(95) | < 600ms | 996,23ms | ❌ Quebrado |
| `http_req_failed` | < 1% | 0,00% | ✅ OK |
| `http_req_connecting` p(95) | < 100ms | 0,00ms | ✅ OK |
| `checks` | > 99% | 96,59% | ❌ Quebrado |

### Checks

| Check | Passou | Falhou | % Sucesso |
|---|---|---|---|
| `status 200` | 1.980 | 0 | 100,00% ✅ |
| `response < 600ms` | 1.778 | 202 | **89,80%** ⚠️ |
| `payload valido` | 1.980 | 0 | 100,00% ✅ |

### Análise

O p(95) de `996ms` ultrapassou o threshold de `600ms` — quase o dobro do esperado. A mediana de `239ms` indica que a maioria das requisições foi rápida, mas um subconjunto de requests com resposta acima de `6200ms` (provável spike de latência da API pública) puxou o p(95) para cima. O check de tempo (`response < 600ms`) falhou em **202 iterações (10,2%)**, correlacionado com esses picos.

---

## 2. productProcess — Load Test (CRUD)

**Script:** `productProcess.js` | **Config:** `config.product-process.json`  
**Perfil:** 30s → 10 VUs → 1m → 20 VUs → 30s → 5 VUs → 20s → 0

### Métricas de Tempo (ms)

| Métrica | Avg | Min | Med | Max | p(90) | p(95) |
|---|---|---|---|---|---|---|
| `http_req_duration` (global) | 339,35 | 220,25 | 262,54 | 32.377,57 | 417,57 | **519,70** |
| `endpoint: add-product` | 349,03 | 220,25 | 265,13 | 24.072,70 | 443,75 | **525,62** |
| `endpoint: get-product` | 360,67 | 220,73 | 245,07 | 32.377,57 | 360,67 | **452,85** |
| `endpoint: update-product` | 344,21 | 221,94 | 263,44 | 18.682,61 | 442,23 | **567,54** |
| `endpoint: delete-product` | 303,48 | 221,10 | 241,60 | 15.519,06 | 361,18 | **476,82** |
| `http_req_waiting` | 332,80 | 219,87 | 252,42 | 32.377,57 | 395,30 | 480,57 |
| `iteration_duration` | 2360,14 | 1894,93 | 2072,39 | 34.122,17 | 2576,83 | 2798,72 |

### Métricas Gerais

| Métrica | Valor |
|---|---|
| Total de requests | 4.640 |
| Taxa de requests | 38,01 req/s |
| VUs (min / max) | 1 / 40 |
| Total de iterações | 1.160 |
| Dados recebidos | 2,14 MB |
| Dados enviados | 0,65 MB |
| `http_req_failed` | 0,00% ✅ |

### Thresholds

| Threshold | Valor Definido | Resultado Medido | Status |
|---|---|---|---|
| `http_req_duration` p(95) global | < 750ms | 519,70ms | ✅ OK |
| `http_req_failed` | < 1% | 0,00% | ✅ OK |
| `checks` | > 99% | 97,91% | ❌ Quebrado |
| `endpoint: add-product` p(95) | < 500ms | 525,62ms | ❌ Quebrado |
| `endpoint: get-product` p(95) | < 400ms | 452,85ms | ❌ Quebrado |
| `endpoint: update-product` p(95) | < 400ms | 567,54ms | ❌ Quebrado |
| `endpoint: delete-product` p(95) | < 350ms | 476,82ms | ❌ Quebrado |

### Checks por Grupo

| Grupo | Check | Passou | Falhou | % Sucesso |
|---|---|---|---|---|
| POST /products | `status 201` | 1.160 | 0 | 100,00% ✅ |
| POST /products | `response < 750ms` | 1.137 | 23 | 98,02% ⚠️ |
| POST /products | `product criado` | 1.160 | 0 | 100,00% ✅ |
| GET /products/:id | `status 200` | 1.160 | 0 | 100,00% ✅ |
| GET /products/:id | `response < 550ms` | 1.128 | 32 | 97,24% ⚠️ |
| PUT /products/:id | `status 200` | 1.160 | 0 | 100,00% ✅ |
| PUT /products/:id | `response < 500ms` | 1.077 | 83 | 92,84% ⚠️ |
| PUT /products/:id | `product atualizado` | 1.160 | 0 | 100,00% ✅ |
| DELETE /products/:id | `status 200` | 1.160 | 0 | 100,00% ✅ |
| DELETE /products/:id | `response < 400ms` | 1.054 | 106 | **90,86%** ⚠️ |

### Análise

O threshold global (p95 < 750ms) foi respeitado com folga (`519ms`). Porém todos os thresholds granulares por endpoint foram violados — os valores definidos no JSON (`350–500ms`) estão mais restritivos do que a API consegue entregar consistentemente. O endpoint com mais falhas de tempo foi **DELETE** (106 falhas), seguido de **PUT** (83 falhas). A mediana abaixo de `270ms` para todos os endpoints indica que o problema são os outliers, não o comportamento médio.

**Recomendação:** Revisar os thresholds por endpoint — ou relaxar para `p(95) < 600ms` para todos, alinhando com a realidade da API pública, ou manter os valores e aceitar que serão violados por picos isolados.

---

## 3. authProcess — Load Test

**Script:** `authProcess.js` | **Config:** `config.load.json`  
**Perfil:** 30s → 20 VUs → 1m → 40 VUs → 30s → 0

### Métricas de Tempo (ms)

| Métrica | Avg | Min | Med | Max | p(90) | p(95) |
|---|---|---|---|---|---|---|
| `http_req_duration` | 422,89 | 354,70 | 399,20 | 6341,36 | 422,18 | **439,10** |
| `http_req_waiting` | 422,19 | 354,19 | 398,67 | 6340,77 | 421,52 | 438,58 |
| `http_req_blocked` | 1,34 | 0,00 | 0,00 | 137,42 | 0,00 | 0,00 |
| `http_req_connecting` | 0,58 | 0,00 | 0,00 | 105,08 | 0,00 | 0,00 |
| `iteration_duration` | 1425,36 | 1355,93 | 1400,49 | 7342,48 | 1428,41 | 1455,22 |

### Métricas Gerais

| Métrica | Valor |
|---|---|
| Total de requests | 1.904 |
| Taxa de requests | 15,71 req/s |
| VUs (min / max) | 1 / 40 |
| Total de iterações | 1.904 |
| Dados recebidos | 1,28 MB |
| Dados enviados | 0,29 MB |
| `http_req_failed` | 0,00% ✅ |

### Thresholds

| Threshold | Valor Definido | Resultado Medido | Status |
|---|---|---|---|
| `http_req_duration` p(95) | < 600ms | 439,10ms | ✅ OK |
| `http_req_failed` | < 1% | 0,00% | ✅ OK |
| `http_req_connecting` p(95) | < 100ms | 0,00ms | ✅ OK |
| `checks` | > 99% | 99,56% | ✅ OK |

### Checks

| Check | Passou | Falhou | % Sucesso |
|---|---|---|---|
| `POST LOGIN status 200` | 1.904 | 0 | 100,00% ✅ |
| `POST LOGIN response < 600ms` | 1.879 | 25 | **98,69%** ⚠️ |
| `POST LOGIN token retornado` | 1.904 | 0 | 100,00% ✅ |

### Análise

**Suite mais saudável da execução.** Todos os thresholds respeitados. O p(95) de `439ms` ficou bem abaixo do limite de `600ms`. As 25 falhas de tempo são outliers isolados (max de `6341ms`) que não impactaram o p(95). O endpoint de login demonstrou comportamento estável e previsível sob carga de 40 VUs.

---

## 4. usersProcess — Stress Test (CRUD)

**Script:** `usersProcess.js` | **Config:** `config.stress.json`  
**Perfil:** 20s → 20 VUs → 40s → 80 VUs → 1m → 150 VUs → 30s → 0

### Métricas de Tempo (ms)

| Métrica | Avg | Min | Med | Max | p(90) | p(95) |
|---|---|---|---|---|---|---|
| `http_req_duration` (global) | 535,54 | 218,77 | 378,48 | 33.189,73 | 985,31 | **1002,97** |
| `endpoint: get-users` | 560,65 | 319,82 | 371,13 | 21.785,32 | 992,94 | **1004,10** |
| `endpoint: add-user` | 706,68 | 366,36 | 652,31 | 24.583,20 | 1001,61 | **1011,55** |
| `endpoint: get-user-id` | 577,09 | 321,86 | 368,49 | 33.189,73 | 999,47 | **1008,49** |
| `endpoint: update-user` | 283,23 | 218,77 | 234,61 | 32.573,78 | 268,91 | **272,69** |
| `endpoint: delete-user` | 549,97 | 321,03 | 438,52 | 20.188,85 | 776,92 | **863,95** |
| `http_req_waiting` | 531,78 | 218,24 | 377,20 | 33.189,73 | 973,90 | 999,98 |
| `iteration_duration` | 3683,81 | 2594,13 | 3202,49 | 36.905,15 | 4912,80 | 5017,02 |

### Métricas Gerais

| Métrica | Valor |
|---|---|
| Total de requests | 15.752 |
| Taxa de requests | 100,39 req/s |
| VUs (min / max) | 1 / 150 |
| Total de iterações | 3.150 |
| Dados recebidos | 17,64 MB |
| Dados enviados | 1,57 MB |
| `http_req_failed` | 0,00% ✅ |

### Thresholds

| Threshold | Valor Definido | Resultado Medido | Status |
|---|---|---|---|
| `http_req_duration` p(95) global | < 900ms | 1002,97ms | ❌ Quebrado |
| `http_req_failed` | < 1% | 0,00% | ✅ OK |
| `checks` | > 99% | 85,31% | ❌ Quebrado |
| `endpoint: get-users` p(95) | < 500ms | 1004,10ms | ❌ Quebrado |
| `endpoint: add-user` p(95) | < 700ms | 1011,55ms | ❌ Quebrado |
| `endpoint: get-user-id` p(95) | < 500ms | 1008,49ms | ❌ Quebrado |
| `endpoint: update-user` p(95) | < 700ms | 272,69ms | ✅ OK |
| `endpoint: delete-user` p(95) | < 500ms | 863,95ms | ❌ Quebrado |

### Checks por Grupo

| Grupo | Check | Passou | Falhou | % Sucesso |
|---|---|---|---|---|
| GET /users | `status 200` | 3.151 | 0 | 100,00% ✅ |
| GET /users | `response < 500ms` | 2.068 | 1.083 | **65,63%** ❌ |
| GET /users | `payload valido` | 3.151 | 0 | 100,00% ✅ |
| POST /users | `status 201` | 3.151 | 0 | 100,00% ✅ |
| POST /users | `response < 700ms` | 1.983 | 1.168 | **62,93%** ❌ |
| POST /users | `id retornado` | 3.151 | 0 | 100,00% ✅ |
| GET /users/:id | `status 200` | 3.150 | 0 | 100,00% ✅ |
| GET /users/:id | `response < 500ms` | 2.003 | 1.147 | **63,59%** ❌ |
| GET /users/:id | `tem username` | 1.417 | 1.733 | **44,98%** ❌ |
| PUT /users/:id | `status 200` | 3.150 | 0 | 100,00% ✅ |
| PUT /users/:id | `response < 700ms` | 3.128 | 22 | 99,30% ✅ |
| PUT /users/:id | `username atualizado` | 3.150 | 0 | 100,00% ✅ |
| DELETE /users/:id | `status 200` | 3.150 | 0 | 100,00% ✅ |
| DELETE /users/:id | `response < 500ms` | 1.817 | 1.333 | **57,68%** ❌ |

### Análise

**Comportamento esperado em stress test — a API chegou ao seu limite sob 150 VUs.** O p(95) global convergiu para ~1000ms em quase todos os endpoints (exceto PUT, que foi surpreendentemente rápido com p95 de `272ms`). Isso sugere que a API tem um **timeout/throttle implícito próximo de 1 segundo** sob alta carga — as respostas não ficam mais lentas que isso, mas também não ficam mais rápidas.

**Destaque positivo:** `update-user` (PUT) foi o endpoint mais performático sob stress — p(95) de apenas `272ms`, muito abaixo do threshold de `700ms`. Pode indicar que o PUT tem tratamento diferenciado no servidor.

**Ponto crítico:** O check `GET USER ID tem username` falhou em **44,98%** das iterações. Isso ocorre porque o ID retornado pelo POST não persiste na API — ao buscar `/users/undefined` ou um ID inválido, a resposta não contém `username`. Esse comportamento está documentado no [ADR-007](./adr/ADR-007-fallback-id-fixo.md) e em `known-issues.md`.

---

## 5. Consolidação e Ações

### Thresholds violados por suite

| Suite | Thresholds Quebrados |
|---|---|
| `getAllProducts` | `http_req_duration` p(95), `checks` rate |
| `productProcess` | `checks` rate, todos os 4 endpoints individuais |
| `authProcess` | Nenhum ✅ |
| `usersProcess` | `http_req_duration` p(95) global, `checks` rate, 4 endpoints |

### Itens de ação

| Prioridade | Ação | Responsável |
|---|---|---|
| 🔴 Alta | Investigar spike de latência no `getAllProducts` (max 6206ms) | — |
| 🔴 Alta | Revisar threshold do `endpoint: delete-product` (476ms vs limite 350ms) — muito restritivo | — |
| 🟡 Média | Ajustar thresholds dos endpoints de produto para refletir a realidade da API pública | — |
| 🟡 Média | Corrigir fallback do `GET /users/:id` para garantir que `username` esteja sempre presente | — |
| 🟢 Baixa | Registrar este resultado em `baseline.md` como linha de base da Execução #001 | — |
| 🟢 Baixa | Investigar por que PUT /users é tão mais rápido que os demais endpoints sob stress | — |

---

## 6. Comparação com Baseline

> ⚠️ Esta é a **primeira execução registrada** — não há baseline anterior para comparação.  
> Os resultados desta execução **serão o baseline** a ser registrado em `docs/baseline.md`.

---

## Histórico de Execuções

| # | Data | Branch | getAllProducts | productProcess | authProcess | usersProcess |
|---|---|---|---|---|---|---|
| 001 | Jun 2026 | main | ⚠️ 2 thresholds | ⚠️ 5 thresholds | ✅ | ❌ 6 thresholds |

---

*Próxima execução: após ajuste dos thresholds por endpoint e correção do fallback de `GET /users/:id`.*