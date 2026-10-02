import SectionHeading from './SectionHeading';
import LogoLoop from './effects/LogoLoop';

const technologies = [
  { name: 'Python', icon: '/media/tech/python.svg', category: 'Backend' },
  { name: 'Java', icon: '/media/tech/java.svg', category: 'Backend' },
  { name: 'TypeScript', icon: '/media/tech/typescript.svg', category: 'Frontend' },
  { name: 'FastAPI', icon: '/media/tech/fastapi.svg', category: 'Backend' },
  { name: 'React', icon: '/media/tech/react.svg', category: 'Frontend' },
  { name: 'Vue.js', icon: '/media/tech/vuejs.svg', category: 'Frontend' },
  { name: 'Node.js', icon: '/media/tech/nodejs.svg', category: 'Backend' },
  { name: 'MySQL', icon: '/media/tech/mysql.svg', category: 'Database' },
  { name: 'Docker', icon: '/media/tech/docker.svg', category: 'DevOps' },
  { name: 'Git', icon: '/media/tech/git.svg', category: 'Tools' },
  { name: 'n8n', icon: '/media/tech/n8n.webp', category: 'Automation' },
  { name: 'Tailwind', icon: '/media/tech/tailwindcss.svg', category: 'Frontend' },
];

const half = Math.ceil(technologies.length / 2);

const TechStackSection = () => (
  <section id="tecnologias" className="relative scroll-mt-20 py-20 md:py-28">
    <div className="mx-auto max-w-5xl px-6">
      <SectionHeading
        index="03"
        eyebrow="Stack"
        title="Tecnologias que eu"
        highlight="domino."
        subtitle="A caixa de ferramentas que uso no dia a dia."
      />
    </div>

    {/* Lista legível para leitores de tela; as faixas abaixo são só visuais. */}
    <ul className="sr-only">
      {technologies.map((tech) => (
        <li key={tech.name}>
          {tech.name} ({tech.category})
        </li>
      ))}
    </ul>

    <div className="scroll-reveal mx-auto max-w-6xl space-y-4">
      <LogoLoop items={technologies.slice(0, half)} duration={60} />
      <LogoLoop items={technologies.slice(half)} duration={60} reverse />
    </div>

    <figure className="scroll-reveal mx-auto mt-20 max-w-5xl px-6">
      <blockquote className="text-xl text-muted-foreground md:text-2xl">
        “Clean code always looks like it was written by someone who cares.”
      </blockquote>
      <figcaption className="mt-3 text-sm text-muted-foreground/70">Robert C. Martin</figcaption>
    </figure>
  </section>
);

export default TechStackSection;
