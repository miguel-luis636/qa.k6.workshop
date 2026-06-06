# ADR-003 — k6-reporter para geração de relatórios HTML

**Status:** ✅ Aceita  
**Data:** Junho 2026  
**Autor:** Miguel Luis

---

## Contexto

Após cada execução de teste, os resultados precisam ser comunicados de forma legível. O output padrão do k6 no terminal é suficiente para desenvolvimento local, mas não é adequado para compartilhamento de evidências, histórico de execuções ou revisão por pessoas que não executaram os testes.

A solução precisa:
- Funcionar sem infraestrutura adicional
- Ser gerada automaticamente ao final de cada execução
- Ser acessível via GitHub Actions como artefato
- Não exigir conta em serviços externos

---

## Decisão

Utilizar a biblioteca **[k6-reporter](https://github.com/benc-uk/k6-reporter)** via `handleSummary()` para gerar relatórios HTML ao final de cada execução, combinada com `textSummary` do jslib para manter o output no terminal.

```js
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export function handleSummary(data) {
  return {
    'results/performance-report.html': htmlReport(data, {
      title: 'Título do Relatório',
      debug: false,
    }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

---

## Alternativas consideradas

### Opção A — k6 Cloud
Plataforma oficial da Grafana para armazenamento e visualização de resultados k6.

**Descartado:**
- Requer conta no k6 Cloud e token de autenticação
- Tier gratuito tem limitações de retenção e número de execuções
- Adiciona dependência de serviço externo — participantes do workshop precisariam de conta
- Não alinhado com o objetivo do workshop de ambiente zero-config

---

### Opção B — Grafana + InfluxDB
Stack de observabilidade que recebe métricas do k6 em tempo real via `--out influxdb`.

**Descartado para esta fase:**
- Requer infraestrutura adicional (containers rodando Grafana e InfluxDB)
- Configuração significativa antes de qualquer teste
- Excelente para ambientes de produção e monitoramento contínuo — planejado para Fase 4 do workshop

---

### Opção C — Output JSON + script de parsing
```bash
k6 run script.js --out json=results/output.json
# script customizado para gerar HTML a partir do JSON
```
**Descartado:** Adiciona complexidade de manutenção de script customizado. O k6-reporter já resolve esse problema com qualidade comprovada pela comunidade.

---

### Opção D — Apenas output no terminal
Manter somente o `textSummary` no stdout sem gerar arquivo.

**Descartado:** Output do terminal não é persistido entre execuções; no CI/CD o log some após o job. Não há histórico comparável entre execuções.

---

## Consequências

**Positivas:**
- Relatório HTML gerado automaticamente sem infraestrutura adicional
- Disponibilizado como artefato no GitHub Actions — acessível após cada execução via UI
- Inclui gráficos de VUs ao longo do tempo, tabela de métricas, detalhamento de checks e thresholds
- Configuração mínima — uma função `handleSummary` padronizada por script
- Mantém o output no terminal em paralelo via `textSummary`

**Negativas:**
- Dependência de URL externa (`raw.githubusercontent.com`) — se o repositório do k6-reporter sair do ar, os testes quebram no import
- Biblioteca não oficial (mantida pela comunidade, não pela Grafana)
- Relatórios são snapshots estáticos — sem comparação automática entre execuções
- Um arquivo HTML por script — sem visão consolidada de todas as suites

**Mitigação da dependência externa:**
Quando o projeto amadurecer, o bundle pode ser baixado e commitado localmente:
```
__test__/lib/k6-reporter.bundle.js
```

---

## Referências

- [k6-reporter — GitHub](https://github.com/benc-uk/k6-reporter)
- [k6 `handleSummary` — Documentação oficial](https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/)
- [k6 jslib `textSummary`](https://jslib.k6.io/)
