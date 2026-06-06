# 📋 Test Strategy — QA Flow Workshop K6

**Projeto:** QA Flow Workshop K6  
**API Under Test:** Fake Store API (`https://fakestoreapi.com`)  
**Versão do documento:** 1.0  
**Status:** Em andamento  
**Última atualização:** Junho 2026  
**Autor:** Miguel Luis

---

## 1. Objetivo

Este documento define a estratégia de testes de performance adotada no projeto, incluindo os critérios que guiam cada decisão técnica: escolha de thresholds, perfis de carga, tipos de teste e ordem de execução.

Serve como referência única para responder perguntas como:
- *"Por que o threshold de `http_req_duration` é 600ms e não 500ms?"*
- *"Por que o stress test usa `ramping-vus` e não `constant-vus`?"*
- *"Por que o fluxo de autenticação usa perfil `load` e não `stress`?"*

---

## 2. Escopo

### 2.1 O que está coberto

| Domínio | Endpoints | Scripts |
|---|---|---|
| Produtos | `GET /products`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id` | `getAllProducts.js`, `productProcess.js` |
| Usuários | `GET /users`, `POST /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id` | `usersProcess.js` |
| Autenticação | `POST /auth/login` | `authProcess.js` |
| Loja | `GET /` | `getAllStore.js` |

### 2.2 O que está fora do escopo

- Testes de segurança (autenticação indevida, injeção)
- Testes de carga em ambiente de produção real
- Endpoints de categorias e carrinhos (não implementados nesta fase)
- Testes de contrato (schema validation)

---

## 3. Ambiente

### 3.1 Ambiente de teste

| Atributo | Valor |
|---|---|
| API | Fake Store API (pública, gratuita) |
| Base URL | `https://fakestoreapi.com` |
| Autenticação | Credenciais fixas fornecidas pela própria API |
| Persistência | Simulada — POST/PUT/DELETE não alteram o banco real |
| SLA da API | Não documentado pelo provedor |

### 3.2 Ambiente de execução dos testes

| Atributo | Valor |
|---|---|
| Local | Máquina do desenvolvedor + GitHub Actions (CI/CD) |
| CI/CD | GitHub Actions — Ubuntu Latest |
| Execução CI | A cada `push` ou `pull_request` em `main`/`master` |
| Relatórios | HTML via `k6-reporter`, disponíveis como artefatos no Actions |

### 3.3 Limitações conhecidas do ambiente

A Fake Store API é uma API pública de uso educacional com as seguintes limitações que impactam diretamente as decisões de threshold:

- **Latência variável:** por ser uma API externa sem SLA garantido, o tempo de resposta pode variar com tráfego de outros usuários no mundo
- **Sem persistência real:** `POST`, `PUT` e `DELETE` retornam respostas simuladas — o dado não é gravado, o que impede validações encadeadas reais
- **Rate limiting não documentado:** não há informação pública sobre limites de requisições por segundo

> **Impacto direto nos thresholds:** os valores de p95 foram definidos com margem mais generosa (600–900ms) do que seria aceitável em produção (200–400ms) para compensar a variabilidade da API pública e do ambiente compartilhado.

---

## 4. Tipos de Teste

### 4.1 Smoke Test *(planejado)*

**Objetivo:** Validar que a API está respondendo antes de qualquer execução de carga.

**Quando rodar:** Antes de qualquer suite de testes; pode ser inserido como primeiro step no CI.

**Perfil de carga:**
```
1–2 VUs | 30–60 segundos | sem ramp-up
```

**Critério de sucesso:** 100% das requisições com status esperado, sem erros.

---

### 4.2 Load Test *(implementado)*

**Objetivo:** Avaliar o comportamento da API sob carga típica de uso esperado.

**Scripts:** `getAllProducts.js`, `getAllStore.js`, `authProcess.js`

**Por que esses scripts usam load test:**  
Listagens e autenticação são os endpoints mais acessados em qualquer aplicação. O comportamento sob carga "normal" precisa ser estável antes de avançar para stress.

**Perfil de carga (`config.load.json`):**
```
30s → 20 VUs  (ramp-up)
1m  → 40 VUs  (carga sustentada)
30s → 0 VUs   (ramp-down)
```

**Por que 40 VUs como pico:**  
Representa um volume moderado compatível com o uso esperado de uma API de e-commerce de médio porte, sem ultrapassar os limites implícitos de uma API pública gratuita.

---

### 4.3 Stress Test *(implementado)*

**Objetivo:** Identificar como a API se comporta sob carga acima do normal e encontrar o ponto de degradação.

**Scripts:** `usersProcess.js`

**Por que o fluxo de usuários usa stress test:**  
Operações de CRUD em usuários envolvem múltiplos endpoints encadeados por VU. Sob alta carga, o comportamento de encadeamento (POST → GET → PUT → DELETE) revela gargalos que listagens simples não expõem.

**Perfil de carga (`config.stress.json`):**
```
20s → 20 VUs   (ramp-up inicial)
40s → 80 VUs   (aumento de carga)
1m  → 150 VUs  (pico de stress)
30s → 0 VUs    (ramp-down)
gracefulRampDown: 30s
```

**Por que `ramping-vus` e não `constant-vus`:**  
`ramping-vus` permite observar o comportamento gradual de degradação. Com `constant-vus` a carga começa no pico, perdendo a visibilidade sobre em qual nível a performance começa a cair.

**Por que `gracefulRampDown: 30s`:**  
Garante que VUs em execução completem o ciclo atual antes de serem encerrados, evitando falsos negativos no relatório causados por requisições interrompidas no meio do fluxo.

---

### 4.4 Spike Test *(planejado)*

**Objetivo:** Simular picos repentinos e intensos de acesso para avaliar recuperação.

**Perfil de carga previsto:**
```
10s → 5 VUs    (baseline)
10s → 200 VUs  (spike brusco)
10s → 5 VUs    (queda)
10s → 0 VUs    (ramp-down)
```

---

## 5. Thresholds — Decisões e Justificativas

### 5.1 Thresholds globais

| Métrica | Valor | Justificativa |
|---|---|---|
| `http_req_failed` | `rate < 0.01` | Menos de 1% de erros é o mínimo aceitável para qualquer API em produção |
| `http_req_connecting` | `p(95) < 100ms` | Tempo de handshake TCP acima de 100ms indica problema de infraestrutura ou rede |
| `checks` | `rate > 0.99` | 99% dos checks (status, payload, tempo) devem passar |

### 5.2 Thresholds por perfil

#### Load Test — `config.load.json`

| Métrica | Valor | Justificativa |
|---|---|---|
| `http_req_duration` | `p(95) < 600ms` | Endpoints de listagem devem ser rápidos. 600ms é o limite aceitável para uma API pública com variabilidade de latência; em produção interna esse valor seria 200–300ms |

#### Process Test — `config.product-process.json`

| Métrica | Valor | Justificativa |
|---|---|---|
| `http_req_duration` | `p(95) < 750ms` | Operações de escrita (POST, PUT) são naturalmente mais lentas que leituras |
| `endpoint: add-product` | `p(95) < 500ms` | POST deve ser mais rápido que o threshold global pois não envolve busca |
| `endpoint: get-product` | `p(95) < 400ms` | GET por ID é a operação mais simples — threshold mais restrito |
| `endpoint: update-product` | `p(95) < 400ms` | PUT com payload pequeno deve ter latência similar ao GET |
| `endpoint: delete-product` | `p(95) < 350ms` | DELETE não retorna payload — deve ser o mais rápido |

#### Stress Test — `config.stress.json` (usuários)

| Métrica | Valor | Justificativa |
|---|---|---|
| `http_req_duration` | `p(95) < 900ms` | Threshold mais permissivo no stress test — o objetivo é observar degradação, não reprovar o teste no início da carga |
| `endpoint: add-user` | `p(95) < 700ms` | POST de usuário tem payload maior que produto |
| `endpoint: get-users` | `p(95) < 500ms` | Listagem deve permanecer responsiva mesmo sob stress |
| `endpoint: delete-user` | `p(95) < 500ms` | Operação leve, sem payload de retorno |

---

## 6. Configuração Externalizada — Por que JSON?

Os stages e thresholds ficam em arquivos JSON no diretório `env/` em vez de hardcoded nos scripts. Essa decisão foi tomada pelos seguintes motivos:

1. **Separação de responsabilidades:** o script define *o que testar*; o JSON define *como carregar*
2. **Troca de ambiente sem alterar código:** mudar de staging para produção é só alterar `settings.json`
3. **Reutilização de perfis:** o `config.load.json` é compartilhado por múltiplos scripts sem duplicação
4. **Rastreabilidade:** mudanças em thresholds ficam visíveis no histórico do Git separadas das mudanças de lógica de teste

---

## 7. Critérios de Entrada e Saída

### 7.1 Critérios de entrada (para iniciar os testes)

- [ ] API disponível e respondendo ao smoke test
- [ ] Todos os scripts validados localmente antes do push
- [ ] Arquivo `settings.json` configurado com a URL correta do ambiente
- [ ] Pipeline CI/CD sem erros de configuração

### 7.2 Critérios de saída (para considerar os testes concluídos)

- [ ] Todos os thresholds definidos foram respeitados
- [ ] Taxa de erro abaixo de 1% em todos os cenários
- [ ] Relatórios HTML gerados e disponíveis como artefatos
- [ ] Resultados registrados no `baseline.md` (primeira execução) ou em `test-results-template.md` (execuções subsequentes)

### 7.3 Critérios de falha (que exigem investigação antes de continuar)

- Taxa de erro acima de 5% em qualquer endpoint
- p95 acima do dobro do threshold definido
- Timeout em mais de 10% das requisições
- Pipeline CI/CD falhando em todos os steps de teste

---

## 8. Ordem de Execução Recomendada

```
1. Smoke Test        → garante que a API está viva
2. Load Test         → valida comportamento sob carga normal
3. Stress Test       → identifica limites e pontos de degradação
4. Spike Test        → valida recuperação após pico brusco
```

> No CI/CD atual, todos os scripts rodam com `continue-on-error: true`, ou seja, a falha de um não bloqueia os demais. Isso garante coleta completa de evidências mesmo em cenários de regressão.

---

## 9. Métricas Monitoradas

| Métrica k6 | Descrição | Por que monitorar |
|---|---|---|
| `http_req_duration` | Tempo total da requisição | Principal indicador de performance percebida pelo usuário |
| `http_req_failed` | Taxa de requisições com erro HTTP | Mede confiabilidade |
| `http_req_connecting` | Tempo de estabelecimento de conexão TCP | Detecta problemas de infraestrutura/rede |
| `checks` | Taxa de sucesso dos assertions | Valida corretude funcional sob carga |
| `http_reqs` | Total de requisições por segundo (RPS) | Mede throughput real alcançado |
| `vus` | Usuários virtuais simultâneos ativos | Confirma que o perfil de carga foi executado corretamente |
| `iterations` | Execuções completas do `default()` | Mede quantos ciclos completos foram realizados |

---

## 10. Próximas Evoluções

- [ ] Implementar smoke test como step inicial no CI
- [ ] Criar `config.spike.json` e scripts de spike test
- [ ] Cobrir endpoints de carrinho (`/carts`)
- [ ] Adicionar dashboard de observabilidade com Grafana + InfluxDB
- [ ] Parametrizar ambiente via variáveis de ambiente do GitHub Actions (`K6_BASE_URL`)
- [ ] Criar `baseline.md` após primeira execução estável em CI

---

*Este documento deve ser atualizado sempre que um novo script for adicionado, um threshold for alterado ou uma decisão de arquitetura for tomada.*