import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, GitCommitHorizontal, GitFork, Github, Star } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SpotlightCard from './effects/SpotlightCard';
import CountUp from './effects/CountUp';
import AnimatedList from './effects/AnimatedList';
import TiltedCard from './effects/TiltedCard';
import VisitorWall from './VisitorWall';
import {
  GITHUB_URL,
  GITHUB_USER,
  LANGUAGE_COLORS,
  fetchGitHubData,
  timeAgo,
  type Contributions,
  type GitHubData,
} from '@/lib/github';

const REPOS_SHOWN = 6;

/** Intensidade do roxo para cada nível de contribuição (0 a 4). */
const LEVEL_COLORS = [
  'rgba(255,255,255,0.05)',
  'rgba(167,139,250,0.28)',
  'rgba(167,139,250,0.5)',
  'rgba(167,139,250,0.75)',
  'rgba(196,181,253,1)',
];

const ContributionGraph = ({ contributions }: { contributions: Contributions }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // No celular o gráfico não cabe: rola sozinho até as semanas mais recentes.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollLeft = element.scrollWidth;
  }, []);

  // Agrupa os dias em colunas de semana (domingo a sábado), como no GitHub.
  const weeks: Array<Array<(typeof contributions.days)[number] | null>> = [];
  const firstWeekday = contributions.days.length ? new Date(`${contributions.days[0].date}T12:00:00`).getDay() : 0;
  let week: Array<(typeof contributions.days)[number] | null> = Array(firstWeekday).fill(null);
  for (const day of contributions.days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);

  return (
    <div>
      <div ref={scrollRef} className="overflow-x-auto pb-2 [scrollbar-width:thin]">
        <div
          className="grid w-max grid-flow-col grid-rows-7 gap-[3px] md:w-full md:[grid-auto-columns:minmax(0,1fr)]"
          role="img"
          aria-label={`${contributions.total} contribuições no último ano`}
        >
          {weeks.flatMap((days, w) =>
            Array.from({ length: 7 }, (_, d) => {
              const day = days[d];
              return (
                <span
                  key={`${w}-${d}`}
                  title={day ? `${day.count} contribuições em ${day.date.split('-').reverse().join('/')}` : undefined}
                  className="h-[10px] w-[10px] rounded-[2px] md:aspect-square md:h-auto md:w-full"
                  style={{ background: day ? LEVEL_COLORS[day.level] : 'transparent' }}
                />
              );
            })
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        menos
        {LEVEL_COLORS.map((color) => (
          <span key={color} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: color }} />
        ))}
        mais
      </div>
    </div>
  );
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl border border-border bg-white/[0.03] ${className}`} />
);

const GitHubSection = () => {
  const [data, setData] = useState<GitHubData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchGitHubData()
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const memberSince = data ? new Date(data.profile.createdAt).getFullYear() : null;

  const stats = data
    ? [
        { label: 'repositórios públicos', value: data.profile.publicRepos },
        { label: 'seguidores', value: data.profile.followers },
        { label: 'seguindo', value: data.profile.following },
        ...(data.contributions
          ? [{ label: 'contribuições no último ano', value: data.contributions.total }]
          : []),
      ]
    : [];

  return (
    <section id="github" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          index="05"
          eyebrow="GitHub"
          title="Código aberto,"
          highlight="toda semana."
          subtitle="Direto da API do GitHub: o que eu ando publicando, repositório por repositório."
        />

        {failed && (
          <SpotlightCard className="p-8 text-center">
            <p className="text-muted-foreground">Não consegui carregar os dados do GitHub agora.</p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              Ver perfil no GitHub <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </SpotlightCard>
        )}

        {!data && !failed && (
          <div className="space-y-4" aria-busy="true" aria-label="Carregando dados do GitHub">
            <Skeleton className="h-44" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Perfil + números + gráfico */}
            <SpotlightCard className="p-6 md:p-8" spotlightColor="rgba(167, 139, 250, 0.08)">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <TiltedCard className="shrink-0 rounded-2xl">
                    <img
                      src={data.profile.avatarUrl}
                      alt={`Avatar de ${GITHUB_USER} no GitHub`}
                      width={64}
                      height={64}
                      loading="lazy"
                      className="h-16 w-16 rounded-2xl ring-1 ring-white/10"
                    />
                  </TiltedCard>
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      {data.profile.name ?? GITHUB_USER}
                    </p>
                    <p className="font-mono text-sm text-accent">@{data.profile.login}</p>
                    {(data.profile.bio || memberSince) && (
                      <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        {data.profile.bio ?? `No GitHub desde ${memberSince}`}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-white/10 px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.04] md:self-auto"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  Seguir no GitHub
                </a>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6 md:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col-reverse">
                    <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</dt>
                    <dd className="text-3xl font-semibold tracking-tight text-foreground">
                      <CountUp to={stat.value} />
                    </dd>
                  </div>
                ))}
              </dl>

              {data.contributions && data.contributions.days.length > 0 && (
                <div className="mt-8 border-t border-border pt-6">
                  <ContributionGraph contributions={data.contributions} />
                </div>
              )}
            </SpotlightCard>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Repositórios */}
              <div>
                <div className="mb-3 flex items-baseline justify-between px-1">
                  <h3 className="text-sm font-medium text-foreground">Outros repositórios</h3>
                  <a
                    href={`${GITHUB_URL}?tab=repositories`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Ver todos <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
                <AnimatedList className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.repos.slice(0, REPOS_SHOWN).map((repo) => (
                    <SpotlightCard key={repo.name} className="h-full" spotlightColor="rgba(167, 139, 250, 0.08)">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full flex-col p-5"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="break-all font-medium text-foreground">{repo.name}</span>
                          <ArrowUpRight
                            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {repo.description ?? 'Sem descrição.'}
                        </span>
                        <span className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
                          {repo.language && (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ background: LANGUAGE_COLORS[repo.language] ?? '#a78bfa' }}
                              />
                              {repo.language}
                            </span>
                          )}
                          {repo.stars > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3 w-3" aria-hidden="true" /> {repo.stars}
                            </span>
                          )}
                          {repo.forks > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <GitFork className="h-3 w-3" aria-hidden="true" /> {repo.forks}
                            </span>
                          )}
                          <span>{timeAgo(repo.pushedAt)}</span>
                        </span>
                      </a>
                    </SpotlightCard>
                  ))}
                </AnimatedList>
              </div>

              {/* Commits */}
              <div>
                <h3 className="mb-3 px-1 text-sm font-medium text-foreground">Commits recentes</h3>
                <SpotlightCard className="p-5" spotlightColor="rgba(167, 139, 250, 0.08)">
                  {data.commits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum commit público recente.</p>
                  ) : (
                    <AnimatedList className="relative space-y-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
                      {data.commits.map((commit) => (
                        <a
                          key={commit.url}
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex gap-3"
                        >
                          <span className="relative mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border border-accent/50 bg-background">
                            <GitCommitHorizontal className="h-2.5 w-2.5 text-accent" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="line-clamp-2 text-sm text-foreground transition-colors group-hover:text-accent">
                              {commit.message}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-x-2 font-mono text-[11px] text-muted-foreground">
                              <span>{commit.repo}</span>
                              <span aria-hidden="true">·</span>
                              <span>{commit.sha}</span>
                              <span aria-hidden="true">·</span>
                              <span>{timeAgo(commit.date)}</span>
                            </span>
                          </span>
                        </a>
                      ))}
                    </AnimatedList>
                  )}
                </SpotlightCard>
              </div>
            </div>
          </div>
        )}

        <VisitorWall />
      </div>
    </section>
  );
};

export default GitHubSection;
