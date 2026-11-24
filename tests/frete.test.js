const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularFrete } = require('../app/frete');

test('frete grátis a partir de 100', () => assert.equal(calcularFrete(100), 0));
test('frete de 15 abaixo de 100', () => assert.equal(calcularFrete(99.9), 15));
