const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ranking = require('../placar/ranking');

test('registrar soma pontos da pessoa e da equipe', () => {
  const d = ranking.vazio();
  const r = ranking.registrar(d, 'pr:1', 'ana', 'Alfa', ['pr_pequeno', 'teste_novo'], '2026-11-10');
  assert.equal(r.concedidos, 25);
  assert.equal(d.pessoas.ana.total, 25);
  assert.equal(d.equipes.Alfa, 25);
});

test('evento repetido não pontua duas vezes', () => {
  const d = ranking.vazio();
  ranking.registrar(d, 'pr:1', 'ana', 'Alfa', ['pr_pequeno'], '2026-11-10');
  const r = ranking.registrar(d, 'pr:1', 'ana', 'Alfa', ['pr_pequeno'], '2026-11-10');
  assert.ok(r.repetido);
  assert.equal(d.pessoas.ana.total, 10);
});

test('teto diário vale por pessoa', () => {
  const d = ranking.vazio();
  for (let n = 1; n <= 3; n++) {
    ranking.registrar(d, `pr:${n}`, 'ana', 'Alfa', ['pr_pequeno', 'verde_primeira', 'teste_novo'], '2026-11-10');
  }
  assert.equal(d.pessoas.ana.total, 50); // 30 + 20 (teto)
});

test('conquista Revisor Rápido', () => {
  const d = ranking.vazio();
  let r;
  for (let n = 0; n < 5; n++) {
    r = ranking.registrar(d, `revisao:${n}:bia`, 'bia', 'Beta', ['revisao_rapida'], `2026-11-1${n}`);
  }
  assert.deepEqual(r.novasConquistas, ['Revisor Rápido']);
});

test('salvar e carregar', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'placar-'));
  const caminho = path.join(pasta, 'r.json');
  const d = ranking.vazio();
  ranking.registrar(d, 'pr:1', 'ana', 'Alfa', ['pr_pequeno'], '2026-11-10');
  ranking.salvar(d, caminho);
  assert.deepEqual(ranking.carregar(caminho), d);
  assert.deepEqual(ranking.carregar(path.join(pasta, 'nao-existe.json')), ranking.vazio());
});
