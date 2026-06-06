# ADR-007 — Fallback para ID fixo em APIs sem persistência real

**Status:** ✅ Aceita  
**Data:** Junho 2026  
**Autor:** Miguel Luis

---

## Contexto

A Fake Store API simula operações de escrita (POST, PUT, DELETE) sem persistir os dados realmente. O `POST /products` retorna um `id` na resposta, mas esse ID não existe no banco — um `GET /products/:id` com esse ID retornará 404.

Scripts de processo (CRUD) dependem de um ID válido para encadear as operações:
```
POST /products → captura id → GET /products/:id → PUT /products/:id → DELETE /products/:id
```

Se o ID retornado pelo POST não existe, os grupos GET, PUT e DELETE falharão com 404, inflando a taxa de erro artificialmente e tornando os resultados inválidos.

---

## Decisão

Usar o ID retornado pelo POST quando disponível, com **fallback para um ID fixo conhecido** quando o POST não retornar um ID utilizável:

```js
// productProcess.js
group('POST /products', () => {
  const res = http.post(...);
  check(res, { 'POST status 201': (r) => r.status === 201 });
  productId = res.json('id');  // captura o ID simulado
});

group('GET /products/:id', () => {
  const targetId = productId || 1;  // fallback para ID 1 (existe no banco real)
  const res = http.get(`${BASE_URL}/products/${targetId}`, ...);
});
```

O ID de fallback escolhido é `1` — um registro que existe no banco real da Fake Store API em todos os domínios (produtos, usuários, carrinhos).

---

## Alternativas consideradas

### Usar apenas o ID retornado pelo POST, sem fallback
**Descartado:** Quando `productId` é `undefined` (o que ocorre frequentemente pela falta de persistência), a URL fica `/products/undefined`, retornando 404. Todos os grupos seguintes falham, a taxa de erro explode e os thresholds de tempo ficam distorcidos por responses de erro.

---

### Buscar um ID válido via GET antes do fluxo
```js
// Antes do grupo POST, faz um GET /products e pega o primeiro ID
const listRes = http.get(`${BASE_URL}/products`);
const existingId = listRes.json()[0].id;
```
**Considerado mas descartado:** Adiciona uma requisição extra por VU fora dos grupos definidos, distorcendo as métricas. Também cria dependência entre o grupo de listagem e os grupos de CRUD.

---

### Separar scripts de listagem e CRUD
Usar o ID fixo diretamente, sem nem tentar capturar o ID do POST.

**Considerado mas descartado parcialmente:** Perderia a validação de que o POST retorna um ID no response — um check de corretude relevante mesmo que o ID não persista.

---

## Por que manter o POST mesmo sabendo que não persiste

O POST ainda valida:
- Que o endpoint aceita o payload corretamente (status 201)
- Que o tempo de resposta está dentro do threshold
- Que o response contém o campo `id`

São três checks de corretude funcional válidos sob carga, independente da persistência.

---

## Consequências

**Positivas:**
- Fluxo completo executado sem erros artificiais de 404
- Checks do POST ainda validam corretude funcional
- Métricas de tempo e taxa de erro refletem o comportamento real da API
- Solução simples — uma linha por grupo

**Negativas:**
- Os grupos GET, PUT e DELETE após o POST não estão testando o dado recém-criado — estão testando um dado pré-existente
- A limitação está documentada em `docs/known-issues.md` para evitar confusão na interpretação dos resultados
- Se o ID de fallback (`1`) for deletado do banco da API (improvável mas possível), todos os testes falhariam

**Decisão de documentação:**
Essa limitação é registrada em `docs/known-issues.md` e nos comentários dos próprios scripts, para que qualquer pessoa que leia os resultados entenda por que o GET está acessando o ID 1 em vez do ID retornado pelo POST.

---

## Referências

- [Fake Store API — Comportamento de escrita](https://fakestoreapi.com/docs)
- [`productProcess.js`](../__test__/fakestoreAPI/productProcess.js)
- [`usersProcess.js`](../__test__/fakestoreAPI/usersProcess.js)
- [ADR-001 — Limitações da Fake Store API](./ADR-001-fake-store-api.md)
