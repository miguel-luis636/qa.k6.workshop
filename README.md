# QA Flow - Workshop K6 Performance Testing(em andamento)

## 📖 Sobre o Projeto

Este repositório foi criado durante o **Workshop de Testes de Performance com K6**, com o objetivo de praticar conceitos de testes de carga, performance e observabilidade em aplicações modernas.

O projeto segue uma estrutura organizada para facilitar a criação, manutenção e evolução dos cenários de testes, além de preparar o ambiente para integração com containers e futuras automações.

---

## 🎯 Objetivos

* Aprender os fundamentos de testes de performance.
* Criar cenários de carga utilizando K6.
* Estruturar uma arquitetura escalável para testes.
* Utilizar Docker para padronização do ambiente.
* Preparar a base para utilização de Test Containers.
* Coletar métricas e analisar resultados de execução.

---

## 🛠️ Tecnologias Utilizadas

* K6
* JavaScript (ES6+)
* Docker
* Docker Compose
* Node.js
* Git & GitHub

---

## 📂 Estrutura do Projeto

```text
qa-flow-workshop-k6/
│
├── tests/
│   ├── smoke/
│   ├── load/
│   ├── stress/
│   └── spike/
│
├── data/
│
├── configs/
│
├── docker/
│
├── reports/
│
├── scripts/
│
└── README.md
```

---

## 🚀 Tipos de Testes

### Smoke Test

Valida rapidamente se a aplicação está disponível e funcionando.

### Load Test

Avalia o comportamento da aplicação sob carga esperada.

### Stress Test

Identifica os limites da aplicação aumentando gradualmente a carga.

### Spike Test

Simula picos repentinos de acesso para avaliar a capacidade de resposta.

---

## 🐳 Executando com Docker(está parte está em construção)

### Build da imagem

```bash
docker build -t qa-flow-k6 .
```

### Executar os testes

```bash
docker run --rm qa-flow-k6
```

---

## ▶️ Executando Localmente

### Instalar o K6

```bash
https://grafana.com/docs/k6/latest/set-up/install-k6/
```

### Executar um teste

```bash
k6 run tests/load/load-test.js
```

### Executar com relatório

```bash
k6 run --out json=result.json tests/load/load-test.js
```

---

## 📊 Métricas Monitoradas

* Tempo médio de resposta
* Requisições por segundo (RPS)
* Percentil 95 (P95)
* Percentil 99 (P99)
* Taxa de erro
* Throughput
* Usuários virtuais simultâneos

---

## 📚 Aprendizados

Durante este workshop foram explorados conceitos importantes relacionados a:

* Performance Testing
* Engenharia de Qualidade (QA)
* Planejamento de cenários de carga
* Infraestrutura como código
* Containers e automação
* Boas práticas com K6

---

## 🔮 Próximos Passos

* Implementação de Test Containers
* Integração com CI/CD
* Geração automática de relatórios
* Dashboards de observabilidade
* Integração com Grafana e Prometheus

---

## 👨‍💻 Autor

Miguel Luis

Estudante e entusiasta de Qualidade de Software.

Contribuições, sugestões e feedbacks são sempre bem-vindos.

![K6](https://img.shields.io/badge/K6-Performance_Testing-7D64FF?logo=k6)
![Docker](https://img.shields.io/badge/Docker-Containerization-2496ED?logo=docker)
![QA](https://img.shields.io/badge/QA-Quality_Assurance-green)
![Workshop](https://img.shields.io/badge/Workshop-Learning-orange)
