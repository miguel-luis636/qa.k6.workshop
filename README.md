# ⚡ QA Flow — Workshop K6 Performance Testing

> Projeto de testes de performance com [k6](https://k6.io/) aplicado à [Fake Store API](https://fakestoreapi.com), desenvolvido durante o **Workshop de Testes de Performance com K6**.

![K6](https://img.shields.io/badge/K6-Performance_Testing-7D64FF?logo=k6)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
![QA](https://img.shields.io/badge/QA-Quality_Assurance-green)
![Workshop](https://img.shields.io/badge/Workshop-Em_Andamento-orange)

---

## 📖 Sobre o Projeto

Este repositório reúne cenários de testes de performance construídos com K6 para validar comportamento, estabilidade e limites da Fake Store API sob diferentes condições de carga.

A arquitetura foi desenhada para ser **escalável e desacoplada**: cada script de teste é independente, as configurações de carga ficam em arquivos JSON externos e os relatórios são gerados automaticamente após cada execução — tanto localmente quanto via CI/CD no GitHub Actions.

---

## 🎯 Objetivos

- Praticar fundamentos de testes de performance (smoke, load, stress, spike)
- Criar cenários de carga reutilizáveis com K6
- Separar configuração de execução via arquivos JSON externos
- Automatizar execução e coleta de relatórios via GitHub Actions
- Estruturar uma arquitetura de testes escalável e de fácil manutenção

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| [K6](https://k6.io/) | Engine de testes de performance |
| JavaScript (ES6+) | Linguagem dos scripts de teste |
| [k6-reporter](https://github.com/benc-uk/k6-reporter) | Geração de relatórios HTML |
| GitHub Actions | Pipeline de CI/CD |
| Node.js | Gerenciamento de dependências auxiliares |

---

## 📂 Estrutura do Projeto

```
qa-flow-workshop-k6/
│
├── 📂 __test__/
│   └── 📂 fakestoreAPI/
│       ├── 📂 results/                        # Relatórios HTML gerados após execução
│       │   ├── performance-report.html
│       │   └── product-process-report.html
│       │
│       ├── getAllProducts.js                   # Teste de carga: listagem de produtos
│       ├── getAllStore.js                      # Teste de carga: listagem geral da loja
│       ├── productProcess.js                  # Teste de processo: CRUD de produtos
│       └── usersProcess.js                    # Teste de processo: fluxo de usuários
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── k6-performance.yml                 # Pipeline CI/CD — execução automática no GitHub Actions
│
├── 📂 docs/                                   # Documentação complementar do projeto
│
├── 📂 env/
│   ├── config.load.json                       # Stages e thresholds: testes de carga (getAll)
│   ├── config.product-process.json            # Stages e thresholds: testes de processo (CRUD)
│   └── settings.json                          # Configurações globais (baseUrl, ambientes)
│
├── .gitattributes
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## 🏛️ Arquitetura

### Visão geral

O projeto segue o princípio de **separação de responsabilidades**: o script sabe *o que testar*, o JSON sabe *como carregar*. Isso permite alterar stages e thresholds sem tocar no código dos testes.

```
env/settings.json          →  onde está a API (baseUrl por ambiente)
env/config.*.json          →  como carregar (stages + thresholds por perfil)
__test__/**/*.js           →  o que testar (cenários, grupos, checks)
results/*.html             →  o que aconteceu (relatório após execução)
```

### Fluxo de execução

```
k6 run script.js
      │
      ├── open('env/settings.json')         lê a URL base
      ├── open('env/config.*.json')         lê stages e thresholds
      │
      ├── VUs sobem conforme STAGES
      │     └── cada VU executa default()
      │           ├── group() por endpoint
      │           ├── http.get / post / put / del
      │           └── check() valida status, tempo, payload
      │
      └── handleSummary()
            ├── results/*.html              salva relatório HTML
            └── stdout                      exibe resumo no terminal
```

### Configuração externalizada

Cada script carrega dois arquivos do diretório `env/`:

```js
const testConfig = JSON.parse(open('../../env/settings.json'));
const configLoad = JSON.parse(open('../../env/config.load.json'));

export const options = {
  stages:     configLoad.STAGES,
  thresholds: configLoad.THRESHOLDS,
};
```

Isso garante que **trocar de ambiente** (ex: staging → produção) ou **ajustar a carga** não exige alterar nenhum script — apenas os JSONs.

### Thresholds por endpoint

Scripts de processo (CRUD) usam **tags por endpoint** para thresholds granulares:

```js
http.post(`${BASE_URL}/products`, payload, {
  tags: { endpoint: 'add-product' }
});
```

```json
"http_req_duration{endpoint:add-product}": ["p(95)<500"],
"http_req_duration{endpoint:get-product}": ["p(95)<400"]
```

Isso permite identificar *qual endpoint* degradou, não apenas que o teste falhou.

---

## 🧪 Scripts de Teste

| Script | Tipo | Config de carga | Endpoints cobertos |
|---|---|---|---|
| `getAllProducts.js` | Carga | `config.load.json` | `GET /products` |
| `getAllStore.js` | Carga | `config.load.json` | `GET /` |
| `productProcess.js` | Processo | `config.product-process.json` | `POST /products`, `GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id` |
| `usersProcess.js` | Processo | — | Fluxo de usuários |

---

## 🚀 Tipos de Testes

### 🟢 Smoke Test
Validação mínima — garante que a aplicação responde antes de executar qualquer carga real. Poucos VUs, duração curta.

### 🔵 Load Test
Simula a carga esperada em produção. Avalia tempo de resposta e taxa de erro dentro dos limites normais de uso.

### 🔴 Stress Test
Aumenta a carga progressivamente além do esperado para identificar o ponto de degradação e os limites da aplicação.

### ⚡ Spike Test
Simula picos repentinos e intensos de acesso. Avalia recuperação e comportamento sob variações bruscas de tráfego.

---

## ⚙️ Arquivos de Configuração

### `env/settings.json`
```json
{
  "SETTINGS": {
    "baseUrl": "https://fakestoreapi.com"
  }
}
```

### `env/config.load.json`
Usado pelos testes de listagem (`getAll`):
```json
{
  "STAGES": [
    { "duration": "30s", "target": 20 },
    { "duration": "1m",  "target": 40 },
    { "duration": "30s", "target": 0  }
  ],
  "THRESHOLDS": {
    "http_req_duration":   ["p(95)<600"],
    "http_req_failed":     ["rate<0.01"],
    "http_req_connecting": ["p(95)<100"],
    "checks":              ["rate>0.99"]
  }
}
```

### `env/config.product-process.json`
Usado pelos testes de CRUD com thresholds por endpoint:
```json
{
  "STAGES": [
    { "duration": "30s", "target": 10 },
    { "duration": "1m",  "target": 20 },
    { "duration": "30s", "target": 5  },
    { "duration": "20s", "target": 0  }
  ],
  "THRESHOLDS": {
    "http_req_duration":   ["p(95)<750"],
    "http_req_failed":     ["rate<0.01"],
    "http_req_connecting": ["p(95)<100"],
    "checks":              ["rate>0.99"],
    "http_req_duration{endpoint:add-product}":    ["p(95)<500"],
    "http_req_duration{endpoint:get-product}":    ["p(95)<400"],
    "http_req_duration{endpoint:update-product}": ["p(95)<400"],
    "http_req_duration{endpoint:delete-product}": ["p(95)<350"]
  }
}
```

---

## 📊 Métricas Monitoradas

| Métrica | Descrição |
|---|---|
| `http_req_duration` | Tempo total da requisição (p95, p99) |
| `http_req_failed` | Taxa de requisições com erro |
| `http_req_connecting` | Tempo de estabelecimento de conexão TCP |
| `checks` | Taxa de sucesso dos checks definidos no script |
| `http_reqs` | Total de requisições por segundo (RPS/throughput) |
| `vus` | Usuários virtuais simultâneos ativos |
| `iterations` | Número de execuções completas do `default()` |

---

## ▶️ Executando Localmente

### 1. Instalar o K6

Siga a documentação oficial: [https://grafana.com/docs/k6/latest/set-up/install-k6/](https://grafana.com/docs/k6/latest/set-up/install-k6/)

### 2. Rodar os scripts

```bash
# Listagem de produtos
k6 run __test__/fakestoreAPI/getAllProducts.js

# Listagem geral da loja
k6 run __test__/fakestoreAPI/getAllStore.js

# CRUD de produtos
k6 run __test__/fakestoreAPI/productProcess.js

# Fluxo de usuários
k6 run __test__/fakestoreAPI/usersProcess.js
```

### 3. Ver os relatórios

Após a execução, os relatórios HTML são salvos em:
```
__test__/fakestoreAPI/results/
```

Abra qualquer `.html` no navegador para visualizar o relatório completo.

---

## 🔄 CI/CD — GitHub Actions

O pipeline em `.github/workflows/k6-performance.yml` executa todos os testes automaticamente a cada `push` ou `pull_request` nas branches `main` e `master`.

**Comportamento do pipeline:**
- Instala o k6 via repositório oficial
- Executa todos os scripts com `continue-on-error: true` — garante que todos rodem mesmo se um falhar
- Faz upload dos relatórios HTML como artefato na aba **Actions**

---

## 🔮 Próximos Passos

- [ ] Implementar cenários de smoke, stress e spike para todos os fluxos
- [ ] Adicionar testes para endpoints de autenticação (`/auth/login`)
- [ ] Dashboards de observabilidade com Grafana + InfluxDB
- [ ] Parametrização de ambientes via variáveis de ambiente no CI

---

## 👨‍💻 Autor

**Miguel Luis**  
Estudante e entusiasta de Qualidade de Software.

Contribuições, sugestões e feedbacks são sempre bem-vindos.