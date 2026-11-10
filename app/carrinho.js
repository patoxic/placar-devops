// Mini aplicação de exemplo: serve só pra pipeline ter algo pra testar.

function total(itens) {
  const soma = itens.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  return Math.round(soma * 100) / 100;
}

function aplicarDesconto(valor, percentual) {
  if (percentual < 0 || percentual > 100) {
    throw new RangeError('percentual deve estar entre 0 e 100');
  }
  return Math.round(valor * (1 - percentual / 100) * 100) / 100;
}

module.exports = { total, aplicarDesconto };
