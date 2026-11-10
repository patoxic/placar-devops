// Guarda pontos, conquistas e ranking em um JSON (docs/ranking.json).
const fs = require('node:fs');
const path = require('node:path');
const { CONQUISTAS, PONTOS, aplicarTeto } = require('./regras');

function vazio() {
  return { eventos: [], pessoas: {}, equipes: {} };
}

function carregar(caminho) {
  if (!fs.existsSync(caminho)) return vazio();
  return JSON.parse(fs.readFileSync(caminho, 'utf-8'));
}

function ordenar(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

function salvar(dados, caminho) {
  fs.mkdirSync(path.dirname(caminho), { recursive: true });
  const saida = {
    equipes: ordenar(dados.equipes),
    eventos: dados.eventos,
    pessoas: ordenar(dados.pessoas),
  };
  fs.writeFileSync(caminho, JSON.stringify(saida, null, 2) + '\n', 'utf-8');
}

// Aplica as regras cumpridas. Ignora evento repetido. Devolve um resumo do que foi concedido.
function registrar(dados, eventoId, login, equipe, regras, dia) {
  const repetido = dados.eventos.includes(eventoId);
  if (repetido || regras.length === 0) {
    return { concedidos: 0, bruto: 0, novasConquistas: [], repetido };
  }

  if (!dados.pessoas[login]) {
    dados.pessoas[login] = { equipe, total: 0, por_dia: {}, contadores: {}, conquistas: [] };
  }
  const pessoa = dados.pessoas[login];

  const bruto = regras.reduce((acc, r) => acc + PONTOS[r], 0);
  const concedidos = aplicarTeto(pessoa.por_dia[dia] || 0, bruto);

  pessoa.total += concedidos;
  pessoa.por_dia[dia] = (pessoa.por_dia[dia] || 0) + concedidos;
  for (const r of regras) pessoa.contadores[r] = (pessoa.contadores[r] || 0) + 1;
  dados.equipes[equipe] = (dados.equipes[equipe] || 0) + concedidos;
  dados.eventos.push(eventoId);

  const novasConquistas = [];
  for (const [nome, { contador, qtd }] of Object.entries(CONQUISTAS)) {
    if (!pessoa.conquistas.includes(nome) && (pessoa.contadores[contador] || 0) >= qtd) {
      pessoa.conquistas.push(nome);
      novasConquistas.push(nome);
    }
  }
  return { concedidos, bruto, novasConquistas, repetido: false };
}

module.exports = { vazio, carregar, salvar, registrar };
