/**
 * Dados do GitHub do David para a seção GitHub, o terminal e o mapa do código.
 *
 * Antes cada visitante chamava a API pública direto do navegador, que só
 * aceita 60 requisições por hora por IP e falhava com facilidade. Aqui a
 * Vercel guarda a resposta na CDN por 30 minutos (s-maxage), então o GitHub é
 * consultado poucas vezes por hora, não importa quantas pessoas visitem.
 *
 * Se existir a variável GITHUB_TOKEN (um token sem permissão nenhuma já
 * serve), o limite sobe para 5.000 por hora. Sem ela também funciona.
 *
 *   GET /api/github -> GitHubData (mesmo formato de src/lib/github.ts)
 */

const USER = 'dhqdev';
const API = 'https://api.github.com';
const CONTRIBUTIONS_API = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;
/** Repositórios que já aparecem na seção de projetos (igual ao src/lib/github.ts). */
const FEATURED_REPOS = ['meta-bot', 'projeto_flappybird', 'bci-on1'];
const TOKEN = process.env.GITHUB_TOKEN;

interface ApiUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface ApiRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
}

interface ApiCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { date: string } | null };
}

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });

const github = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-dhqdev',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub respondeu ${response.status} em ${path}`);
  return response.json() as Promise<T>;
};

const contributions = async () => {
  try {
    const response = await fetch(CONTRIBUTIONS_API);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      total: Record<string, number>;
      contributions: { date: string; count: number; level: number }[];
    };
    const total = data.total.lastYear ?? Object.values(data.total).reduce((sum, n) => sum + n, 0);
    return { total, days: data.contributions };
  } catch {
    // Serviço de terceiros: se cair, a seção só esconde o gráfico.
    return null;
  }
};

const toRepo = (repo: ApiRepo) => ({
  name: repo.name,
  description: repo.description,
  language: repo.language,
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  url: repo.html_url,
  pushedAt: repo.pushed_at,
});

export async function GET() {
  try {
    const [user, apiRepos, graph] = await Promise.all([
      github<ApiUser>(`/users/${USER}`),
      github<ApiRepo[]>(`/users/${USER}/repos?per_page=100&sort=pushed`),
      contributions(),
    ]);
    const ownRepos = apiRepos.filter((repo) => !repo.fork && !repo.archived);

    // Commits recentes: os últimos de cada um dos 4 repositórios mexidos por último.
    const commitLists = await Promise.all(
      ownRepos.slice(0, 4).map(async (repo) => {
        try {
          const commits = await github<ApiCommit[]>(`/repos/${USER}/${repo.name}/commits?per_page=4`);
          return commits.map((commit) => ({
            repo: repo.name,
            message: commit.commit.message.split('\n')[0],
            sha: commit.sha.slice(0, 7),
            url: commit.html_url,
            date: commit.commit.author?.date ?? repo.pushed_at,
          }));
        } catch {
          return [];
        }
      }),
    );

    const data = {
      profile: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        createdAt: user.created_at,
      },
      repos: ownRepos.filter((repo) => !FEATURED_REPOS.includes(repo.name.toLowerCase())).map(toRepo),
      allRepos: ownRepos.slice(0, 40).map(toRepo),
      commits: commitLists
        .flat()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6),
      contributions: graph,
    };

    return json(data, 200, 'public, s-maxage=1800, stale-while-revalidate=86400');
  } catch (error) {
    // Erro fica em cache só por 1 minuto, pra não travar a seção por muito tempo.
    return json({ error: (error as Error).message }, 502, 'public, s-maxage=60');
  }
}
