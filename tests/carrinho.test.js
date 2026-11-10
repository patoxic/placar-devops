const test = require('node:test');
const assert = require('node:assert/strict');
const { total, aplicarDesconto } = require('../app/carrinho');

test('total soma preço x quantidade', () => {
  assert.equal(total([{ preco: 10, qtd: 2 }, { preco: 5.5, qtd: 1 }]), 25.5);
});

test('desconto válido', () => {
  assert.equal(aplicarDesconto(200, 10), 180);
});

test('desconto inválido', () => {
  assert.throws(() => aplicarDesconto(100, 150), RangeError);
});
