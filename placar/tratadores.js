// Um tratador por tipo de evento do GitHub Actions. Recebe as dependências por parâmetro
// (github, ranking) pra dar pra testar sem rede.
const regras = require('./regras');

const ehBot = (login) => login.endsWith('[bot]');
const dia = (iso) => new Date(iso).toISOString().slice(0, 10);

function textoComentario(login, cumpridas, resumo) {
  const linhas = [`### 🎮 Placar DevOps: @${login}`, ''];
  for (const r of cumpridas) {
    linhas.push(`- ${regras.DESCRICAO[r]}: **+${regras.PONTOS[r]}**`);
  }
  linhas.push('');
  linhas.push(
    `Total concedido: **${resumo.concedidos}** (bruto ${resumo.bruto}, teto diário de ${regras.TETO_DIARIO})`,
  );
  for (const c of resumo.novasConquistas) {
    linhas.push(`\n🏅 Conquista desbloqueada: **${c}**`);
  }
  return linhas.join('\n');
}

async function prMergeado({ evento, repo, dados, equipes, github, ranking }) {
  const pr = evento.pull_request;
  if (evento.action !== 'closed' || !pr.merged) return;
  const login = pr.user.login;
  if (ehBot(login)) return;

  const linhas = pr.additions + pr.deletions;
  const arquivos = await github.chamar(`/repos/${repo}/pulls/${pr.number}/files`, {
    params: { per_page: 100 },
  });
  const temTeste = arquivos.some((a) => regras.ehArquivoDeTeste(a.filename));

  const { workflow_runs: runs } = await github.chamar(`/repos/${repo}/actions/runs`, {
    params: { head_sha: pr.head.sha, event: 'pull_request', per_page: 50 },
  });
  const ci = runs
    .filter((r) => r.name === 'CI')
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const verde = ci.length > 0 && ci[0].conclusion === 'success';

  const cumpridas = regras.regrasDoPr(linhas, verde, temTeste);
  const resumo = ranking.registrar(
    dados,
    `pr:${pr.number}`,
    login,
    equipes[login] || 'Sem equipe',
    cumpridas,
    dia(pr.merged_at),
  );
  if (resumo.concedidos || resumo.novasConquistas.length) {
    await github.comentar(repo, pr.number, textoComentario(login, cumpridas, resumo));
  }
}

async function revisao({ evento, dados, equipes, ranking }) {
  if (evento.action !== 'submitted') return;
  const pr = evento.pull_request;
  const rev = evento.review;
  const revisor = rev.user.login;
  if (revisor === pr.user.login || ehBot(revisor)) return;
  if (!regras.revisaoRapida(pr.created_at, rev.submitted_at)) return;

  ranking.registrar(
    dados,
    `revisao:${pr.number}:${revisor}`,
    revisor,
    equipes[revisor] || 'Sem equipe',
    ['revisao_rapida'],
    dia(rev.submitted_at),
  );
}

async function ciConcluido({ evento, repo, dados, equipes, github, ranking }) {
  const wr = evento.workflow_run;
  if (wr.name !== 'CI' || wr.head_branch !== 'main' || wr.conclusion !== 'success') return;

  const { workflow_runs: runs } = await github.chamar(`/repos/${repo}/actions/runs`, {
    params: { branch: 'main', event: 'push', status: 'completed', per_page: 20 },
  });
  const anterior = runs
    .filter((r) => r.name === 'CI' && r.created_at < wr.created_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  if (!anterior || anterior.conclusion !== 'failure') return;
  if (!regras.correcaoRapida(anterior.created_at, wr.updated_at)) return;

  const login = wr.triggering_actor.login;
  if (ehBot(login)) return;

  ranking.registrar(
    dados,
    `correcao:${wr.id}`,
    login,
    equipes[login] || 'Sem equipe',
    ['correcao_rapida'],
    dia(wr.updated_at),
  );
}

module.exports = { textoComentario, prMergeado, revisao, ciConcluido };
