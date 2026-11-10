// Testa os tratadores com um "github" falso (sem rede).
const test = require('node:test');
const assert = require('node:assert/strict');
const ranking = require('../placar/ranking');
const tratadores = require('../placar/tratadores');

function githubFalso({ arquivos = [], runs = [] } = {}) {
  const comentarios = [];
  return {
    comentarios,
    chamar: async (caminho) => (caminho.includes('/files') ? arquivos : { workflow_runs: runs }),
    comentar: async (repo, numero, texto) => comentarios.push({ numero, texto }),
  };
}

const eventoPr = (extra = {}) => ({
  action: 'closed',
  pull_request: {
    number: 7,
    merged: true,
    merged_at: '2026-11-10T12:00:00Z',
    additions: 80,
    deletions: 20,
    head: { sha: 'abc' },
    user: { login: 'ana' },
    ...extra,
  },
});

test('PR mergeado pequeno, com teste e CI verde pontua e comenta', async () => {
  const dados = ranking.vazio();
  const github = githubFalso({
    arquivos: [{ filename: 'app/x.js' }, { filename: 'tests/x.test.js' }],
    runs: [{ name: 'CI', created_at: '2026-11-10T10:00:00Z', conclusion: 'success' }],
  });
  await tratadores.prMergeado({ evento: eventoPr(), repo: 'o/r', dados, equipes: { ana: 'Alfa' }, github, ranking });
  assert.equal(dados.pessoas.ana.total, 30);
  assert.equal(github.comentarios.length, 1);
  assert.match(github.comentarios[0].texto, /@ana/);
});

test('PR fechado sem merge não pontua', async () => {
  const dados = ranking.vazio();
  const evento = eventoPr({ merged: false });
  await tratadores.prMergeado({ evento, repo: 'o/r', dados, equipes: {}, github: githubFalso(), ranking });
  assert.deepEqual(dados.pessoas, {});
});

test('revisão em até 4 horas pontua o revisor', async () => {
  const dados = ranking.vazio();
  const evento = {
    action: 'submitted',
    pull_request: { number: 7, created_at: '2026-11-10T09:00:00Z', user: { login: 'ana' } },
    review: { user: { login: 'bia' }, submitted_at: '2026-11-10T10:30:00Z' },
  };
  await tratadores.revisao({ evento, dados, equipes: { bia: 'Beta' }, ranking });
  assert.equal(dados.pessoas.bia.total, 10);
});

test('autor revisando o próprio PR não pontua', async () => {
  const dados = ranking.vazio();
  const evento = {
    action: 'submitted',
    pull_request: { number: 7, created_at: '2026-11-10T09:00:00Z', user: { login: 'ana' } },
    review: { user: { login: 'ana' }, submitted_at: '2026-11-10T09:10:00Z' },
  };
  await tratadores.revisao({ evento, dados, equipes: {}, ranking });
  assert.deepEqual(dados.pessoas, {});
});

test('CI corrigido em até 1 hora pontua quem corrigiu', async () => {
  const dados = ranking.vazio();
  const github = githubFalso({
    runs: [{ name: 'CI', created_at: '2026-11-10T09:00:00Z', conclusion: 'failure' }],
  });
  const evento = {
    workflow_run: {
      id: 99,
      name: 'CI',
      head_branch: 'main',
      conclusion: 'success',
      created_at: '2026-11-10T09:20:00Z',
      updated_at: '2026-11-10T09:30:00Z',
      triggering_actor: { login: 'ana' },
    },
  };
  await tratadores.ciConcluido({ evento, repo: 'o/r', dados, equipes: { ana: 'Alfa' }, github, ranking });
  assert.equal(dados.pessoas.ana.total, 20);
});
