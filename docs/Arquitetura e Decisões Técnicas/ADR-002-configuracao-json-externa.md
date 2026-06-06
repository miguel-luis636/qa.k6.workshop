# ADR-002 — Configuração externalizada em arquivos JSON

**Status:** ✅ Aceita  
**Data:** Junho 2026  
**Autor:** Miguel Luis

---

## Contexto

Os scripts k6 precisam de dois tipos de configuração:

1. **Onde testar** — URL base, headers, credenciais, payloads
2. **Como carregar** — stages de VUs, thresholds por métrica

A forma como essas configurações são armazenadas e acessadas impacta diretamente a manutenibilidade, a rastreabilidade das mudanças e a facilidade de trocar de ambiente.

---

## Decisão

Externalizar toda a configuração em arquivos JSON no diretório `env/`:

```
env/
├── settings.json                 # URL base, headers, payloads por domínio
├── config.load.json              # Stages e thresholds para testes de carga
├── config.product-process.json   # Stages e thresholds para CRUD de produtos
└── config.stress.json            # Stages e thresholds para testes de stress
```

Cada script carrega os arquivos via `open()` nativo do k6:

```js
const settings = JSON.parse(open('../../env/settings.json'));
const config   = JSON.parse(open('../../env/config.load.json'));

export const options = {
  stages:     config.STAGES,
  thresholds: config.THRESHOLDS,
};
```

---

## Alternativas consideradas

### Opção A — Hardcoded nos scripts
```js
export const options = {
  stages: [
    { duration: '30s', target: 20 },
  ],
  thresholds: { http_req_duration: ['p(95)<600'] },
};
```
**Descartado:** Trocar de ambiente ou ajustar um threshold exige editar cada script individualmente. Mudanças de configuração ficam misturadas com mudanças de lógica no histórico do Git.

---

### Opção B — Variáveis de ambiente (`__ENV`)
```js
const BASE_URL = __ENV.K6_BASE_URL || 'https://fakestoreapi.com';
```
**Descartado para configurações complexas:** Funciona bem para valores simples (URL, token), mas stages e thresholds são estruturas aninhadas que não cabem bem em variáveis de ambiente. Seriam necessárias múltiplas variáveis ou serialização manual. Passagem de arrays e objetos via `--env` é verbosa e propensa a erros.

> **Nota:** variáveis de ambiente continuam sendo a abordagem planejada para parametrizar a `baseUrl` no CI/CD (ex: `K6_BASE_URL` apontando para staging ou produção) — ver Próximos Passos no `test-plan.md`.

---

### Opção C — Arquivo `.env` com dotenv
Não suportado nativamente pelo k6. Exigiria dependências externas ou pré-processamento antes da execução.

---

### Opção D — Módulo JS compartilhado (`config.js`)
```js
// config.js
export const STAGES = { light: [...], standard: [...] };
export function makeOptions(profile) { ... }
```
**Considerado mas não adotado nesta fase:** Mais poderoso e type-safe, mas introduz acoplamento entre scripts via import. JSON é mais simples, legível por qualquer ferramenta (não exige entender k6/JS para editar um threshold) e pode ser validado por schema. A abordagem por módulo JS é a evolução natural caso o projeto cresça significativamente.

---

## Consequências

**Positivas:**
- **Separação de responsabilidades:** o script define *o que testar*; o JSON define *como carregar*
- **Rastreabilidade:** mudanças em thresholds ficam separadas de mudanças em lógica de teste no histórico do Git
- **Reutilização:** `config.load.json` é compartilhado por `getAllProducts.js`, `getAllStore.js` e `authProcess.js` sem duplicação
- **Legibilidade:** qualquer pessoa edita thresholds sem precisar entender JavaScript ou k6
- **Troca de ambiente:** alterar a `baseUrl` em `settings.json` afeta todos os scripts simultaneamente

**Negativas:**
- Dois arquivos a gerenciar por script (script + JSON de config)
- Sem type-checking — um typo no JSON causa erro em runtime, não em tempo de escrita
- `open()` do k6 usa caminho relativo ao script, exigindo atenção ao path (`../../env/`)

---

## Referências

- [k6 `open()` — Documentação oficial](https://grafana.com/docs/k6/latest/javascript-api/init-context/open/)
- [`test-strategy.md` — Seção 6: Configuração Externalizada](../test-strategy.md)
