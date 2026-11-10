// Cliente mínimo da API do GitHub (fetch nativo do Node, sem dependências).
const API = 'https://api.github.com';

async function chamar(caminho, { params, metodo = 'GET', corpo } = {}) {
  const url = new URL(API + caminho);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);

  const resp = await fetch(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (!resp.ok) {
    throw new Error(`GitHub API ${metodo} ${caminho} -> ${resp.status}`);
  }
  const texto = await resp.text();
  return texto ? JSON.parse(texto) : null;
}

function comentar(repo, numero, texto) {
  return chamar(`/repos/${repo}/issues/${numero}/comments`, {
    metodo: 'POST',
    corpo: { body: texto },
  });
}

module.exports = { chamar, comentar };
