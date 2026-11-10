// Regras de pontuação do Placar DevOps (funções puras, fáceis de testar).

const HORA = 60 * 60 * 1000;

const LIMITE_LINHAS_PR_PEQUENO = 200;
const LIMITE_REVISAO = 4 * HORA;
const LIMITE_CORRECAO = 1 * HORA;
const TETO_DIARIO = 50;

const PONTOS = {
  pr_pequeno: 10,
  verde_primeira: 5,
  teste_novo: 15,
  correcao_rapida: 20,
  revisao_rapida: 10,
};

const DESCRICAO = {
  pr_pequeno: 'PR pequeno (até 200 linhas)',
  verde_primeira: 'Pipeline verde na primeira tentativa',
  teste_novo: 'Teste novo cobrindo a mudança',
  correcao_rapida: 'Pipeline quebrada corrigida em até 1 hora',
  revisao_rapida: 'Revisão de PR em até 4 horas',
};

// conquista -> { contador, quantidade necessária }
const CONQUISTAS = {
  'Deploy Seguro': { contador: 'verde_primeira', qtd: 5 },
  'Caçador de Bugs': { contador: 'correcao_rapida', qtd: 3 },
  'Revisor Rápido': { contador: 'revisao_rapida', qtd: 5 },
};

// Quais regras um PR mergeado cumpriu.
function regrasDoPr(linhasAlteradas, verdePrimeira, temTeste) {
  const cumpridas = [];
  if (linhasAlteradas <= LIMITE_LINHAS_PR_PEQUENO) cumpridas.push('pr_pequeno');
  if (verdePrimeira) cumpridas.push('verde_primeira');
  if (temTeste) cumpridas.push('teste_novo');
  return cumpridas;
}

function revisaoRapida(prCriadoEm, revisadoEm) {
  const delta = new Date(revisadoEm) - new Date(prCriadoEm);
  return delta >= 0 && delta <= LIMITE_REVISAO;
}

function correcaoRapida(falhouEm, corrigiuEm) {
  const delta = new Date(corrigiuEm) - new Date(falhouEm);
  return delta >= 0 && delta <= LIMITE_CORRECAO;
}

// Limita os pontos de uma pessoa a TETO_DIARIO por dia (proteção contra manipulação).
function aplicarTeto(jaGanhosNoDia, novos) {
  return Math.max(0, Math.min(novos, TETO_DIARIO - jaGanhosNoDia));
}

function ehArquivoDeTeste(caminho) {
  const nome = caminho.split('/').pop();
  return caminho.startsWith('tests/') || /\.(test|spec)\.[cm]?[jt]s$/.test(nome);
}

module.exports = {
  LIMITE_LINHAS_PR_PEQUENO,
  TETO_DIARIO,
  PONTOS,
  DESCRICAO,
  CONQUISTAS,
  regrasDoPr,
  revisaoRapida,
  correcaoRapida,
  aplicarTeto,
  ehArquivoDeTeste,
};
