# ADR-005 — Executor `ramping-vus` para testes de stress

**Status:** ✅ Aceita  
**Data:** Junho 2026  
**Autor:** Miguel Luis

---

## Contexto

O k6 oferece múltiplos executores para controlar como os usuários virtuais (VUs) são criados e encerrados durante um teste. Para o cenário de stress do `usersProcess.js`, a escolha do executor impacta diretamente:

- A visibilidade sobre em qual nível de carga a performance começa a degradar
- A naturalidade da curva de carga (gradual vs. imediata)
- A facilidade de interpretar os gráficos do relatório

---

## Decisão

Utilizar o executor **`ramping-vus`** para testes de stress, com `startVUs: 0` e `gracefulRampDown: 30s`.

```json
{
  "SCENARIOS": {
    "stress_users": {
      "executor": "ramping-vus",
      "startVUs": 0,
      "stages": [
        { "duration": "20s", "target": 20  },
        { "duration": "40s", "target": 80  },
        { "duration": "1m",  "target": 150 },
        { "duration": "30s", "target": 0   }
      ],
      "gracefulRampDown": "30s"
    }
  }
}
```

---

## Alternativas consideradas

### `constant-vus`
Mantém um número fixo de VUs durante toda a execução.

**Descartado para stress:** A carga começa no pico — não há como observar em qual ponto a performance começa a cair. Útil para smoke test e validações de carga fixa, mas não para identificar limites.

---

### `ramping-arrival-rate`
Controla o número de *iterações por segundo* (RPS), não o número de VUs.

**Considerado mas não adotado nesta fase:**
- Mais próximo de simular tráfego real (usuários chegando em taxa constante)
- Mais complexo de configurar — requer estimar `preAllocatedVUs` e `maxVUs`
- Para o propósito didático do workshop, `ramping-vus` é mais intuitivo e visual nos relatórios
- Evolução natural para fases avançadas do projeto

---

### `constant-arrival-rate`
RPS fixo durante toda a execução.

**Descartado:** Mesmo problema do `constant-vus` — sem visibilidade sobre degradação gradual.

---

## Por que `startVUs: 0`

Deixa explícito o ponto de partida. Sem essa configuração, o k6 pode iniciar com VUs residuais dependendo do contexto de execução. É uma boa prática de clareza, não uma exigência técnica.

---

## Por que `gracefulRampDown: 30s`

Quando o ramp-down começa (último stage → 0 VUs), VUs em execução recebem 30 segundos para completar o ciclo atual antes de serem encerrados.

Sem isso, VUs são interrompidos no meio do fluxo (POST → GET → PUT → DELETE), gerando:
- Erros de conexão forçada que inflam a taxa de falha artificialmente
- Checks incompletos que distorcem o relatório
- Dados de timing truncados

---

## Consequências

**Positivas:**
- Curva de carga gradual — visível nos gráficos de VUs do relatório HTML
- Permite identificar o ponto exato de degradação (ex: "a p95 começou a subir entre 80 e 150 VUs")
- `gracefulRampDown` garante integridade dos dados ao final do teste
- Configuração legível e intuitiva para fins didáticos

**Negativas:**
- Não simula chegada real de usuários (que seria melhor modelada com `arrival-rate`)
- Com muitos VUs simultâneos, o número de iterações por segundo varia — não é determinístico

---

## Referências

- [k6 Executors — Documentação oficial](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/)
- [`config.stress.json`](../env/config.stress.json)
- [`test-strategy.md` — Seção 4.3: Stress Test](../test-strategy.md)
