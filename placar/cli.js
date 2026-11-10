// Ponto de entrada: lê o evento do GitHub Actions e atualiza o ranking.
const fs = require('node:fs');
const github = require('./github');
const ranking = require('./ranking');
const tratadores = require('./tratadores');

const CAMINHO_DADOS = process.env.PLACAR_DADOS || 'docs/ranking.json';
const CAMINHO_EQUIPES = process.env.PLACAR_EQUIPES || 'placar/equipes.json';

const POR_EVENTO = {
  pull_request: tratadores.prMergeado,
  pull_request_review: tratadores.revisao,
  workflow_run: tratadores.ciConcluido,
};

async function main() {
  const tratador = POR_EVENTO[process.env.GITHUB_EVENT_NAME];
  if (!tratador) return;

  const evento = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf-8'));
  const equipes = JSON.parse(fs.readFileSync(CAMINHO_EQUIPES, 'utf-8'));
  const dados = ranking.carregar(CAMINHO_DADOS);

  await tratador({
    evento,
    repo: process.env.GITHUB_REPOSITORY,
    dados,
    equipes,
    github,
    ranking,
  });
  ranking.salvar(dados, CAMINHO_DADOS);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
