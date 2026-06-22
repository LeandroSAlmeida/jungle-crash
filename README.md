# Crash Game

Implementação do desafio full-stack da Jungle Gaming: um crash game multiplayer em tempo real, com backend em dois bounded contexts (Game e Wallet) comunicando via RabbitMQ, autenticação via Keycloak, e frontend em React conectado por REST + WebSocket. O enunciado original do desafio está em [DESAFIO.md](DESAFIO.md).

## Como rodar

Pré-requisitos: Bun >= 1.x, Docker e Docker Compose.

```bash
git clone git@github.com:LeandroSAlmeida/jungle-crash.git
cd jungle-crash
bun install
bun run docker:up
```

Isso sobe Postgres, RabbitMQ, Keycloak (com o realm `crash-game` já importado), Kong, os dois serviços de backend, o frontend e um job que semeia o usuário de teste com saldo — tudo sem nenhum passo manual.

- **Frontend:** http://localhost:3000
- **Usuário de teste:** `player` / `player123` (já com R$ 1.000,00 de saldo)
- **Kong (API Gateway):** http://localhost:8000
- **Keycloak Admin:** http://localhost:8080 (`admin` / `admin`)
- **RabbitMQ Management:** http://localhost:15672 (`admin` / `admin`)
- **Swagger — Games API:** http://localhost:4001/docs
- **Swagger — Wallets API:** http://localhost:4002/docs

```bash
bun run docker:down    # para os containers
bun run docker:prune   # remove containers, volumes e imagens
```

### Testes

```bash
cd services/games && bun run test
cd services/wallets && bun run test
cd services/games && bun run test:e2e      # requer docker:up rodando
cd services/wallets && bun run test:e2e     # requer docker:up rodando
cd frontend && bun run test
```

Os testes E2E do `games` rodam contra o container real — se o `games` da stack já estiver rodando, ele vai competir pela "rodada atual" com o teste. Pare o container antes (`docker compose stop games`) e suba de novo depois.

---

## Arquitetura

```
Frontend (React + Vite) ──HTTP/WS──> Kong ──> Game Service (NestJS)
                                       │              │
                                       │          RabbitMQ (saga)
                                       │              │
                                       └──────> Wallet Service (NestJS)

Keycloak (OIDC) — autenticação, fora do Kong
```

Dois bounded contexts, cada um com sua própria camada DDD (`domain` → `application` → `infrastructure` → `presentation`) e seu próprio banco Postgres:

- **Game Service** — ciclo de vida da rodada (`Round`), apostas (`Bet`), algoritmo provably fair, WebSocket.
- **Wallet Service** — saldo do jogador (`Wallet`), crédito/débito.

Os dois só se falam de forma assíncrona, via RabbitMQ — nenhum dos serviços chama o outro diretamente por HTTP.

### Saga de aposta (coreografada, com compensação)

```
1. Jogador → POST /games/bet
2. Game cria o Bet como PENDING e publica bet.placed
3. Wallet debita o saldo
     ├─ sucesso → publica bet.debited (informativo, sem consumidor hoje)
     └─ falha   → publica bet.debit_failed
4. Game escuta bet.debit_failed → marca o Bet como REJECTED (compensação)
```

Não existe orquestrador central — cada serviço reage a eventos e decide sua própria transição de estado. A compensação (rejeitar a aposta se o débito falhar) é o mecanismo que garante consistência entre os dois bancos sem transação distribuída.

O cashout segue o caminho inverso: `Game` marca a aposta como `CASHED_OUT` e publica `bet.cashed_out`; `Wallet` credita o valor de forma assíncrona. Isso abre uma janela real de inconsistência — se a publicação ou o consumo da mensagem falhar, o jogador vê "sacado" na UI antes do crédito efetivamente acontecer no `Wallet`. Resolver isso de verdade exigiria um outbox pattern (mensagem e mudança de estado na mesma transação local, com entrega garantida depois) — listado no desafio como bônus e não implementado aqui por tempo.

---

## Decisões de arquitetura e trade-offs

**`Bet` como agregado separado de `Round`, não aninhado.** Com várias apostas por rodada, se `Bet` vivesse dentro do agregado `Round` toda aposta nova ou cashout exigiria recarregar e salvar a rodada inteira — um ponto de contenção real com múltiplos jogadores apostando ao mesmo tempo. Separar os agregados custa um pouco de consistência imediata (uma aposta não vê a rodada "ao vivo" dentro da mesma transação), mas isso já é resolvido pelo fato de cada aposta referenciar a rodada só pelo `roundId`.

**`Money` duplicado entre `Game` e `Wallet`, não compartilhado num pacote comum.** Os dois serviços lidam com dinheiro, mas cada um tem suas próprias regras (`Wallet` debita/credita; `Game` calcula payout a partir de multiplicador). Compartilhar a classe criaria um acoplamento entre bounded contexts que deveriam evoluir de forma independente. O que é genuinamente técnico e sem lógica de negócio — validação de JWT (`@crash/auth`) e os contratos de evento do RabbitMQ (`@crash/contracts`) — esses sim ficam em pacotes compartilhados.

**MikroORM v6 com decorators, não a API funcional da v7.** A v7 trocou decorators por `defineEntity()`; optei pela v6 por familiaridade com o modelo de entidades anotadas (próximo de JPA).

**Provably fair: commit-reveal por rodada, com as seeds encadeadas entre rodadas.** Antes da fase de apostas, o servidor publica `hash = SHA256(serverSeed)`. Depois do crash, revela o `serverSeed` — qualquer jogador recalcula o hash e o crash point e confirma que bate. Além disso, a seed de cada rodada é derivada da seed da rodada anterior (`serverSeed_N = SHA256(serverSeed_{N-1})`), formando uma corrente verificável: dado o `serverSeed` de uma rodada antiga, é possível confirmar que a próxima realmente derivou dela, não foi escolhida depois. A primeira rodada do sistema ("genesis") usa uma seed aleatória, já que não há rodada anterior. Isso é uma simplificação deliberada do modelo usado por cassinos como Stake (que pré-publicam um hash "raiz" para um lote de milhares de rodadas futuras) — aqui o jogo roda continuamente, sem lotes pré-determinados, então o encadeamento incremental (rodada a rodada) é o que faz sentido. O multiplicador em si segue `multiplicador = e^(0.000062 × ms_desde_o_início)` — a mesma fórmula é exibida na tela do jogo, no canto do gráfico, pra transparência.

**Saga coreografada, não orquestrada.** Com só dois serviços e um fluxo linear (apostar → debitar → confirmar ou compensar), um orquestrador central seria complexidade sem benefício real. Cada serviço sabe reagir aos eventos que importam pra ele.

**`EventEmitter2` para pub/sub dentro do processo, RabbitMQ só entre serviços.** O WebSocket gateway do `Game` precisa saber quando uma rodada crasha ou uma aposta é colocada — isso é comunicação dentro do mesmo serviço, então usar RabbitMQ ali seria rodeio. `EventEmitter2` resolve isso localmente; RabbitMQ fica reservado pra comunicação que de fato cruza o limite do processo (Game ↔ Wallet).

**Kong só roteia os dois microsserviços, não o Keycloak.** Os endpoints de autenticação (`/realms/.../auth`, `/token`, etc.) são do próprio Keycloak, acessados diretamente — não fazem parte da API do produto, então não tem motivo para passar pelo gateway.

**Zustand para estado compartilhado no frontend, hooks locais para o resto.** Sessão (`authStore`) e saldo (`walletStore`) são lidos por múltiplos componentes ao mesmo tempo (header, controles de aposta) — Zustand evita buscar/duplicar esse estado em cada um. O estado da rodada em si (`useGameState`) fica num hook normal, porque só a página do jogo o usa.

---

## Testes

Cobertura obrigatória do desafio, mais alguns cenários que apareceram ao longo do desenvolvimento:

- **Unitários de domínio** (`services/*/tests/unit`): ciclo de vida de `Round` e `Bet`, `Wallet` (crédito/débito/saldo insuficiente), provably fair (determinismo, verificação, encadeamento entre rodadas).
- **E2E** (`services/*/tests/e2e`): fluxo completo apostar → multiplicador sobe → cashout → saldo atualizado; apostar → crash → aposta perdida; validações (saldo insuficiente, aposta dupla, aposta fora da fase de apostas).
- **Frontend** (`frontend/tests/unit`): lógica pura sem necessidade de testar componentes React inteiros — mapeamento de aposta da API pro estado da UI, cor do histórico por faixa de multiplicador, encoding base64url do PKCE.

## Limitações conhecidas

- **Sem outbox/inbox transacional** — publicação de evento e mudança de estado não são atômicas (ver seção de saga acima). Bônus listado no desafio, não implementado.
- **Evento `bet.debited`** — publicado pelo `Wallet` após um débito bem-sucedido, mas sem nenhum consumidor hoje (é informativo, pensado para uma futura tela de auditoria).
