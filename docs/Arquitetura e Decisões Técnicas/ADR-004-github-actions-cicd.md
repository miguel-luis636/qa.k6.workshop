# ADR-004 — GitHub Actions como plataforma de CI/CD

**Status:** ✅ Aceita  
**Data:** Junho 2026  
**Autor:** Miguel Luis

---

## Contexto

Os testes de performance precisam rodar automaticamente em eventos de integração (push, pull request), sem depender da máquina local de nenhum desenvolvedor. A plataforma de CI/CD precisa:

- Instalar e executar o k6
- Coletar e disponibilizar os relatórios HTML gerados
- Ser acessível sem custo adicional para um projeto de workshop
- Integrar nativamente com o repositório GitHub onde o código está hospedado

---

## Decisão

Utilizar **GitHub Actions** como plataforma de CI/CD, com workflow em `.github/workflows/k6-performance.yml`.

Configurações chave adotadas:

```yaml
- continue-on-error: true     # todos os scripts rodam mesmo se um falhar
- if: always()                # upload de artefatos ocorre independente de falhas
- if-no-files-found: warn     # não quebra o pipeline se results/ estiver vazia
```

---

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| **Jenkins** | Requer servidor próprio — infraestrutura adicional incompatível com workshop |
| **CircleCI** | Tier gratuito limitado; requer conta separada do GitHub |
| **GitLab CI** | Projeto hospedado no GitHub — migraria o repositório apenas pelo CI |
| **k6 Cloud CI** | Requer token e conta k6 Cloud — ver [ADR-003](./ADR-003-k6-reporter-html.md) |
| **Execução apenas local** | Sem rastreabilidade, sem histórico de execuções, sem evidências por PR |

---

## Consequências

**Positivas:**
- Integração nativa com GitHub — sem configuração de webhooks ou tokens externos
- Tier gratuito suficiente para o volume do workshop
- Relatórios HTML disponíveis como artefatos na aba Actions por 90 dias
- Histórico de execuções por commit e PR
- Instalação do k6 via repositório oficial APT — ambiente reproduzível

**Negativas:**
- Tempo de instalação do k6 a cada execução (~30–60s para apt-get)
- Artefatos expiram após 90 dias — sem histórico permanente
- Runner compartilhado (ubuntu-latest) pode ter variabilidade de performance — resultados do CI não devem ser usados como baseline definitivo


---

## Referências

- [`k6-performance.yml`](../.github/workflows/k6-performance.yml)
- [GitHub Actions — Documentação](https://docs.github.com/en/actions)
- [Instalar k6 no Ubuntu — Grafana](https://grafana.com/docs/k6/latest/set-up/install-k6/)
