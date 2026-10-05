/**
 * Dados públicos do GitHub do David, buscados no navegador de quem visita.
 * Assim a seção fica sempre atualizada sem precisar de deploy. As respostas
 * ficam em cache no localStorage por 30 minutos, porque a API pública do
 * GitHub permite só 60 requisições por hora por IP.
 */

export const GITHUB_USER = 'dhqdev';
export const GITHUB_URL = `https://github.com/${GITHUB_USER}`;

const API = 'https://api.github.com';
const CONTRIBUTIONS_API = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`;
const CACHE_KEY = 'github-cache-v2';
const CACHE_TTL_MS = 30 * 60 * 1000;

/** Repositórios que já aparecem na seção de projetos. */
const FEATURED_REPOS = ['meta-bot', 'projeto_flappybird', 'bci-on1'];

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  url: string;
  pushedAt: string;
}

export interface GitHubCommit {
  repo: string;
  message: string;
  sha: string;
  url: string;
  date: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Contributions {
  total: number;
  days: ContributionDay[];
}

export interface GitHubData {
  profile: GitHubProfile;
  /** Repositórios que não estão entre os projetos em destaque. */
  repos: GitHubRepo[];
  /** Todos os repositórios próprios (inclusive os em destaque), para o grafo. */
  allRepos: GitHubRepo[];
  commits: GitHubCommit[];
  contributions: Contributions | null;
}

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`${response.status} em ${url}`);
  return response.json() as Promise<T>;
};

const readCache = (): GitHubData | null => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: GitHubData };
    return Date.now() - at < CACHE_TTL_MS ? data : null;
  } catch {
    return null;
  }
};

const writeCache = (data: GitHubData) => {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Sem storage (aba anônima, cota cheia): só não guarda.
  }
};

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

interface ApiContributions {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

const fetchContributions = async (): Promise<Contributions | null> => {
  try {
    const data = await getJson<ApiContributions>(CONTRIBUTIONS_API);
    const total = data.total.lastYear ?? Object.values(data.total).reduce((sum, n) => sum + n, 0);
    return { total, days: data.contributions };
  } catch {
    // Serviço de terceiros: se cair, a seção só esconde o gráfico.
    return null;
  }
};

const toRepo = (repo: ApiRepo): GitHubRepo => ({
  name: repo.name,
  description: repo.description,
  language: repo.language,
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  url: repo.html_url,
  pushedAt: repo.pushed_at,
});

let inFlight: Promise<GitHubData> | null = null;

/**
 * O hero e a seção do GitHub pedem os dados ao mesmo tempo; os dois recebem a
 * mesma promessa, então a API é chamada uma vez só.
 */
export const fetchGitHubData = (): Promise<GitHubData> => {
  if (!inFlight) {
    inFlight = loadGitHubData().catch((error) => {
      inFlight = null;
      throw error;
    });
  }
  return inFlight;
};

const loadGitHubData = async (): Promise<GitHubData> => {
  const cached = readCache();
  if (cached) return cached;

  const [user, apiRepos, contributions] = await Promise.all([
    getJson<ApiUser>(`${API}/users/${GITHUB_USER}`),
    getJson<ApiRepo[]>(`${API}/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`),
    fetchContributions(),
  ]);

  const ownRepos = apiRepos.filter((repo) => !repo.fork && !repo.archived);

  // Commits recentes: os últimos de cada um dos 4 repositórios mexidos por último.
  const commitLists = await Promise.all(
    ownRepos.slice(0, 4).map(async (repo) => {
      try {
        const commits = await getJson<ApiCommit[]>(
          `${API}/repos/${GITHUB_USER}/${repo.name}/commits?per_page=4`
        );
        return commits.map<GitHubCommit>((commit) => ({
          repo: repo.name,
          // Só a primeira linha: o resto da mensagem é detalhe.
          message: commit.commit.message.split('\n')[0],
          sha: commit.sha.slice(0, 7),
          url: commit.html_url,
          date: commit.commit.author?.date ?? repo.pushed_at,
        }));
      } catch {
        return [];
      }
    })
  );

  const data: GitHubData = {
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
    contributions,
  };

  writeCache(data);
  return data;
};

const RELATIVE = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/** "há 3 dias", "ontem", "há 2 meses"… */
export const timeAgo = (iso: string) => {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return RELATIVE.format(Math.round(seconds / size), unit);
  }
  return 'agora mesmo';
};

/** Cores oficiais do GitHub para as linguagens mais comuns. */
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Go: '#00ADD8',
  PHP: '#4F5D95',
  'Jupyter Notebook': '#DA5B0B',
};
