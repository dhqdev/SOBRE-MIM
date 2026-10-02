import { Code2, Database, Zap, BarChart3 } from 'lucide-react';
import SectionHeading from './SectionHeading';
import SpotlightCard from './effects/SpotlightCard';
import CircularText from './effects/CircularText';
import TiltedCard from './effects/TiltedCard';
import davidProfile from '@/assets/david-profile.webp';

const skills = [
  { icon: Code2, title: 'Frontend', items: ['Vue.js', 'React', 'TypeScript'] },
  { icon: Database, title: 'Backend', items: ['Python', 'Frappe', 'Node.js'] },
  { icon: Zap, title: 'Automação', items: ['n8n', 'Docker', 'APIs'] },
  { icon: BarChart3, title: 'Analytics', items: ['Dashboards', 'ERP', 'BI'] },
];

const focus = ['Frappe Framework & ERPNext', 'Automação de processos', 'Dashboards & Analytics'];

const AboutSection = () => (
  <section id="sobre" className="relative scroll-mt-20 py-20 md:py-28">
    <div className="mx-auto max-w-7xl px-6 lg:px-10">
      <SectionHeading
        index="02"
        eyebrow="Sobre mim"
        title="Conheça minha"
        highlight="jornada."
        subtitle="De onde eu venho, no que trabalho hoje e para onde estou indo."
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
        {/* História */}
        <div className="scroll-reveal space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            Sou desenvolvedor full-stack apaixonado por transformar desafios complexos em soluções
            elegantes. Com <span className="text-foreground">mais de 2 anos</span> de experiência,
            construí uma base sólida trabalhando com tecnologias modernas e frameworks empresariais.
          </p>
          <p>
            Atualmente na <span className="text-foreground">GRV Software</span>, atuo no
            desenvolvimento com o <span className="text-foreground">Frappe Framework</span>, criando
            integrações robustas e sistemas personalizados. Minha experiência inclui conhecimento
            profundo em <span className="text-foreground">ERP Protheus</span> da TOTVS, permitindo
            conectar diferentes mundos de tecnologia.
          </p>
          <p>
            Além do código, domino automação com{' '}
            <span className="text-foreground">Docker e n8n</span>, construção de dashboards
            analíticos e integração de APIs. Cada projeto é uma oportunidade de aprender algo novo e
            entregar valor real.
          </p>

          <figure className="!mt-12 border-l border-accent/60 pl-6">
            <blockquote className="text-xl leading-snug text-foreground md:text-2xl">
              “As pessoas loucas o suficiente para pensar que podem mudar o mundo são as que o
              fazem.”
            </blockquote>
            <figcaption className="mt-3 text-sm text-muted-foreground">Steve Jobs</figcaption>
          </figure>
        </div>

        {/* Foto + especialidades + foco */}
        <div className="scroll-reveal space-y-4">
          <div className="flex justify-center py-4 lg:justify-start lg:pl-4">
            <div className="relative grid h-[200px] w-[200px] place-items-center text-accent/80">
              <CircularText
                text="full-stack • automação • ia • disponível •"
                size={200}
                className="absolute inset-0"
              />
              <TiltedCard className="h-[136px] w-[136px] rounded-full" maxTilt={12}>
                <img
                  src={davidProfile}
                  alt="Foto de David Fernandes"
                  width={524}
                  height={530}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full rounded-full object-cover ring-1 ring-white/10"
                />
              </TiltedCard>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {skills.map((skill) => (
              <SpotlightCard key={skill.title} className="p-5">
                <skill.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-medium text-foreground">{skill.title}</h3>
                <ul className="mt-2 space-y-1 list-none p-0">
                  {skill.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            ))}
          </div>

          <SpotlightCard className="p-5">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-online" />
              </span>
              Foco atual
            </h3>
            <ul className="mt-4 divide-y divide-border list-none p-0">
              {focus.map((item) => (
                <li key={item} className="py-2.5 text-sm text-muted-foreground first:pt-0 last:pb-0">
                  {item}
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>
      </div>
    </div>
  </section>
);

export default AboutSection;
