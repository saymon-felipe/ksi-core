# ksi-core

Back-end Node/Express (pacote `ksi-core`). O `README.md` ainda descreve "agendaspro-core"; confirme o propósito antes de assumir.

Scripts: `start` (nodemon). Não há testes (`npm test` é um placeholder que falha).

## Regras comuns

- `.env*` nunca é lido, impresso nem commitado (nomes das variáveis: `.env.example`, quando existir).
- Sem `git push`/deploy sem pedido; commits com caminhos explícitos (nada de `git add .`).
- Os comandos citados vêm do `package.json` (quando o repo tem um) e **não foram executados** (`node`/`npm` fora do PATH nesta máquina). Confirme antes de afirmar que passam.
