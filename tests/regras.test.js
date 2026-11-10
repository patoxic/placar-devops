const test = require('node:test');
const assert = require('node:assert/strict');
const regras = require('../placar/regras');

const T0 = '2026-11-10T09:00:00Z';
const maisMin = (min) => new Date(new Date(T0).getTime() + min * 60000).toISOString();

test('PR pequeno, verde e com teste', () => {
  assert.deepEqual(regras.regrasDoPr(150, true, true), ['pr_pequeno', 'verde_primeira', 'teste_novo']);
});

test('PR grande sem nada', () => {
  assert.deepEqual(regras.regrasDoPr(900, false, false), []);
});

test('limite de linhas é inclusivo', () => {
  assert.ok(regras.regrasDoPr(200, false, false).includes('pr_pequeno'));
  assert.ok(!regras.regrasDoPr(201, false, false).includes('pr_pequeno'));
});

test('revisão rápida (até 4 horas)', () => {
  assert.ok(regras.revisaoRapida(T0, maisMin(239)));
  assert.ok(!regras.revisaoRapida(T0, maisMin(241)));
});

test('correção rápida (até 1 hora)', () => {
  assert.ok(regras.correcaoRapida(T0, maisMin(45)));
  assert.ok(!regras.correcaoRapida(T0, maisMin(120)));
});

test('teto diário', () => {
  assert.equal(regras.aplicarTeto(0, 30), 30);
  assert.equal(regras.aplicarTeto(40, 30), 10);
  assert.equal(regras.aplicarTeto(50, 30), 0);
});

test('reconhece arquivo de teste', () => {
  assert.ok(regras.ehArquivoDeTeste('tests/carrinho.test.js'));
  assert.ok(regras.ehArquivoDeTeste('app/x.spec.js'));
  assert.ok(!regras.ehArquivoDeTeste('app/carrinho.js'));
});
