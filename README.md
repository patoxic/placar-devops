# Placar DevOps

Protótipo do artigo **"Gamificação no DevOps: efeito de pontos e ranking sobre a qualidade e a frequência das entregas em uma equipe de software"** (N3, Gerenciamento de Software).

A pipeline de CI/CD dá pontos pra boas práticas (PR pequeno, teste novo, pipeline verde, correção e revisão rápidas) e publica um ranking **por equipe**. O cenário de empresa, equipes e números do artigo é **simulado**; este repositório é a prova técnica de que a ideia funciona.

Feito em **Node.js**, sem dependências externas (só `fetch` e `node:test` nativos).

## Como funciona

```
PR mergeado ──┐
Revisão ──────┼─► workflow "Placar" ─► node placar/cli.js ─► docs/ranking.json ─► página (GitHub Pages)
CI na main ───┘                                  └─► comentário no PR com os pontos
```

| Evento do GitHub | O que pontua |
|---|---|
| `pull_request` (fechado e mergeado) | PR pequeno, verde na primeira tentativa, teste novo |
| `pull_request_review` (enviada) | Revisão em até 4 horas |
| `workflow_run` (CI concluído na `main`) | Pipeline quebrada corrigida em até 1 hora |

Salvaguardas contra manipulação: teto de 50 pontos por pessoa por dia, ranking só por equipe, evento repetido não pontua duas vezes e sem pontos negativos.

## Estrutura

```
app/                  mini aplicação de exemplo (só pra pipeline ter o que testar)
placar/regras.js      regras de pontuação (funções puras)
placar/ranking.js     pontos, teto diário, conquistas e persistência
placar/tratadores.js  um tratador por evento (recebe github e ranking por parâmetro)
placar/github.js      cliente mínimo da API do GitHub
placar/cli.js         lê o evento do Actions e atualiza o ranking
placar/equipes.json   login do GitHub -> equipe
tests/                testes (node:test)
docs/                 página do ranking + ranking.json (GitHub Pages)
.github/workflows/    ci.yml (testes) e placar.yml (pontuação)
```

## Rodar os testes

Precisa de Node 20 ou mais novo.

```bash
npm test          # testes
npm run test:cov  # testes com cobertura
```

## Configurar no GitHub

1. Crie o repositório e envie o código (comandos abaixo).
2. Edite `placar/equipes.json` com os logins reais das pessoas e suas equipes.
3. **Settings → Pages**: fonte `Deploy from a branch`, branch `main`, pasta `/docs`.
4. **Settings → Actions → General → Workflow permissions**: marque `Read and write permissions`.
5. Se a `main` tiver proteção de branch, libere o push do bot, ou deixe sem proteção neste protótipo.

```bash
git init -b main
git add .
git commit -m "feat: protótipo do Placar DevOps"
gh repo create placar-devops --public --source=. --remote=origin --push
```

## Roteiro pra gerar as evidências do artigo

1. Abra um PR pequeno com teste novo, espere o **CI** ficar verde e peça revisão de outra conta.
2. Faça o merge e veja o comentário do Placar no PR (captura de tela).
3. Abra `https://<usuario>.github.io/placar-devops/` e capture o ranking.
4. Quebre o CI na `main` de propósito, corrija em menos de 1 hora e veja os pontos de correção.
5. Capture o histórico de **Actions** com os workflows `CI` e `Placar`.

## Limites do protótipo

- Usa só GitHub (Actions + JSON + Pages). O artigo cita Lambda e DynamoDB como versão de produção; aqui a persistência é o `docs/ranking.json`.
- Revisão rápida conta a partir da abertura do PR.
- Não há grupo de controle real: o Squad Beta do artigo é parte do cenário simulado.
