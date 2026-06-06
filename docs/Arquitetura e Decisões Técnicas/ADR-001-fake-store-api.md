# ADR-001 — Escolha da Fake Store API como alvo dos testes

**Status:** ✅ Aceita  
**Data:** Junho 2026  
**Autor:** Miguel Luis

---

## Contexto

O workshop precisa de uma API real para os testes de performance. A API precisa ser:

- Publicamente acessível sem configuração de ambiente
- Estável o suficiente para ser usada em exemplos reproduzíveis
- Cobrir múltiplos domínios (produtos, usuários, autenticação) para permitir cenários variados
- Gratuita e sem limite de requisições que bloqueie os exercícios

---

## Decisão

Utilizar a **Fake Store API** (`https://fakestoreapi.com`) como API alvo de todos os testes de performance do workshop.

---

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|---|---|
| **JSONPlaceholder** | Cobre apenas posts/comments/todos — sem autenticação, sem fluxos de e-commerce |
| **ReqRes.in** | Limitada a usuários, sem produtos ou carrinho; não representa um fluxo de negócio completo |
| **API própria mockada** | Exigiria infraestrutura adicional (servidor, deploy), desviando o foco do workshop para k6 |
| **Petstore (Swagger)** | Instável em ambientes públicos; frequentemente fora do ar |
| **k6 Cloud demo API** | Requer conta no k6 Cloud; adiciona barreira de entrada ao workshop |

---

## Consequências

**Positivas:**
- Zero configuração de infraestrutura — qualquer participante executa os testes imediatamente
- Cobre quatro domínios (auth, produtos, usuários, loja) — viabiliza cenários diversificados
- Documentação disponível em `/docs` com spec OpenAPI

**Negativas e mitigações:**

| Consequência negativa | Mitigação adotada |
|---|---|
| API não persiste dados (POST/PUT/DELETE são simulados) | Fallback para IDs fixos existentes no banco — documentado em [ADR-007](./ADR-007-fallback-id-fixo.md) |
| Sem SLA garantido — latência variável por ser pública | Thresholds definidos com margem maior (600–900ms) em vez dos 200–400ms típicos de produção |
| Rate limiting implícito não documentado | Perfis de carga conservadores (máx 150 VUs) para evitar bloqueio |
| API pode ficar indisponível | CI/CD com `continue-on-error: true` evita que indisponibilidade quebre o pipeline completamente |

---

## Referências

- [Fake Store API — Documentação oficial](https://fakestoreapi.com/docs)
- [`test-strategy.md` — Seção 3: Ambiente](../test-strategy.md)
