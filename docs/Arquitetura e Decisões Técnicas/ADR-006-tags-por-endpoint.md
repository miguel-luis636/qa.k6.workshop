# ADR-006 — Tags por endpoint para thresholds granulares

**Status:** ✅ Aceita  
**Data:** Junho 2026  
**Autor:** Miguel Luis

---

## Contexto

Scripts de processo (CRUD) executam múltiplos endpoints em sequência dentro de um único VU. Com um threshold global de `http_req_duration`, é impossível distinguir qual endpoint causou uma regressão — um `DELETE` lento e um `POST` lento impactam a mesma métrica.

A pergunta que precisamos responder quando um threshold falha: *"qual endpoint degradou?"*

---

## Decisão

Adicionar **tags customizadas por endpoint** em todas as requisições de scripts de processo, e definir thresholds específicos por tag no JSON de configuração.

```js
// No script — tag na requisição
http.post(`${BASE_URL}/products`, payload, {
  ...PARAMS,
  tags: { endpoint: 'add-product' },
});
```

```json
// No JSON de config — threshold por tag
"http_req_duration{endpoint:add-product}":    ["p(95)<500"],
"http_req_duration{endpoint:get-product}":    ["p(95)<400"],
"http_req_duration{endpoint:update-product}": ["p(95)<400"],
"http_req_duration{endpoint:delete-product}": ["p(95)<350"]
```

---

## Alternativas consideradas

### Apenas threshold global
```json
"http_req_duration": ["p(95)<750"]
```
**Descartado para scripts de processo:** Não identifica qual endpoint degradou. Se o p95 geral subir para 800ms, não há como saber se foi o POST (esperado ser mais lento) ou o DELETE (que deveria ser rápido).

---

### `group()` sem tags
O k6 registra métricas por group automaticamente (`http_req_duration{group: POST /products}`).

**Considerado mas não suficiente:** A sintaxe de threshold por group é mais verbosa e menos legível. Tags customizadas permitem nomes semânticos (`add-product`) em vez de nomes técnicos (`::POST /products`), e são mais flexíveis para agrupar endpoints que cruzam grupos.

---

### Script separado por endpoint
Um script `.js` para cada endpoint individualmente.

**Descartado:** Perde a capacidade de testar o fluxo encadeado (POST → GET → PUT → DELETE) sob carga, que é onde os problemas de concorrência aparecem.

---

## Por que thresholds diferentes por operação

Os valores refletem a expectativa natural de cada tipo de operação HTTP:

| Operação | Threshold | Justificativa |
|---|---|---|
| DELETE | Menor (350ms) | Não retorna payload — apenas confirmação |
| GET /:id | Baixo (400ms) | Busca por chave primária — operação mais simples |
| PUT | Médio (400–500ms) | Escrita com payload pequeno |
| POST | Maior (500–700ms) | Criação com validação e escrita completa |
| GET (listagem) | Variável | Depende do volume de dados retornado |

---

## Consequências

**Positivas:**
- Identifica precisamente qual endpoint degradou em uma falha de threshold
- Permite SLOs diferenciados por operação — alinhado com expectativas reais de produção
- Visível no relatório HTML como métricas separadas por tag
- Sem impacto na lógica de teste — apenas metadado adicionado à requisição

**Negativas:**
- Aumenta o número de thresholds no JSON de configuração
- Requer disciplina para manter consistência nos nomes de tags entre scripts
- Tags incorretas (typo) criam métricas órfãs sem threshold — o erro passa silencioso

**Convenção adotada para nomes de tags:**
```
{verbo}-{recurso}
add-product, get-product, update-product, delete-product
add-user, get-users, get-user-id, update-user, delete-user
```

---

## Referências

- [k6 Tags — Documentação oficial](https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/)
- [k6 Thresholds por tag](https://grafana.com/docs/k6/latest/using-k6/thresholds/#threshold-on-tags)
- [`config.product-process.json`](../env/config.product-process.json)
- [`config.stress.json`](../env/config.stress.json)
