import { Calendar, Bot, Wallet, Gamepad2, MessagesSquare, CandlestickChart } from 'lucide-react';

export interface Project {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  /** Repositório do código, quando o link principal é o produto no ar. */
  repo?: string;
  /** Tem versão jogável no site (abre o FlappyGame). */
  game?: boolean;
  /** Selo no canto da imagem, ex.: "Novo". */
  badge?: string;
  tags: string[];
  image?: string;
  video?: string;
  poster?: string;
}

export const projects: Project[] = [
  {
    title: 'Meta-Bot - Escritório de trading com IA',
    description:
      'Um escritório de trading em pixel-art onde 8 agentes de IA trabalham juntos: a Nina lê as notícias, a Rita vigia o risco, a Estela testa estratégias, o Gustavo gerencia o plano e o Caio executa as ordens no MetaTrader 5. Eles conversam entre si, fazem reunião diária às 19h e aprendem com os próprios resultados. São 18 estratégias, backtest honesto (com slippage e comissão), conta simulada com preços reais e app PWA para acompanhar pelo celular.',
    icon: CandlestickChart,
    link: 'https://github.com/dhqdev/meta-bot',
    tags: ['Python', 'FastAPI', 'React', 'Agentes de IA', 'MetaTrader 5'],
    image: '/media/projects/meta-bot.webp',
    badge: 'Novo',
  },
  {
    title: 'Tekvosoft Chat - Atendimento via WhatsApp',
    description:
      'Plataforma de atendimento com CRM e helpdesk: vários atendentes no mesmo número de WhatsApp, filas, chatbot com pipeline de IA, kanban, campanhas e agendamentos, tudo em tempo real. É multiempresa, roda em Docker e já está em produção.',
    icon: MessagesSquare,
    link: 'https://chat.tekvosoft.com/',
    repo: 'https://github.com/tekvosoft-chat/tekvosoft',
    tags: ['Node.js', 'TypeScript', 'React', 'WhatsApp', 'Socket.IO'],
    image: '/media/projects/tekvosoft-chat.webp',
    badge: 'Em produção',
  },
  {
    title: 'Flappy Bird IA',
    description:
      '🤖 Ensinei uma IA a zerar o Flappy Bird — e ela aprendeu sozinha! Criei um experimento em Python onde 50 passarinhos-IA jogam Flappy Bird ao mesmo tempo. Eles evoluem, cruzam genes, sofrem mutação e ficam cada vez mais inteligentes. Depois de algumas gerações, começam a dominar o jogo com uma precisão absurda. Usei Algoritmo Genético, Rede Neural (4-5-1), Python + Pygame + NumPy. Resultado? Aprendizado 100% autônomo, zero jogadas humanas.',
    icon: Gamepad2,
    link: 'https://github.com/dhqdev/Projeto_FlappyBird',
    tags: ['Python', 'IA', 'Algoritmo Genético', 'Rede Neural'],
    video: '/media/flappy-bird-ai.mp4',
    poster: '/media/flappy-bird-poster.webp',
    game: true,
  },
  {
    title: 'Planejai - Gestão financeira',
    description:
      'Um software SaaS de gestão financeira desenvolvido para todo tipo de cliente que deseja ter um maior controle sobre o que gasta.',
    icon: Wallet,
    link: 'https://planejai.tekvosoft.com/',
    tags: ['SaaS', 'Gestão Financeira', 'Web App'],
    image: '/media/projects/planejai.webp',
  },
  {
    title: 'Encontro com Deus',
    description:
      'Site oficial do retiro espiritual Encontro com Deus - Um ministério de transformação dedicado a promover experiências profundas de renovação espiritual, cura e reconexão com Deus. TypeScript e React, com inteligência artificial que conversa e aconselha a pessoa.',
    icon: Calendar,
    link: 'https://encontro-com-deus.vercel.app/',
    tags: ['React', 'TypeScript', 'IA'],
    image: '/media/projects/encontro-com-deus.webp',
  },
  {
    title: 'BCI-ON1 - Automação Servopa',
    description:
      'O BCI-ON1 é um sistema de automação desenvolvido para simplificar e automatizar processos de licitação no portal Servopa. O sistema realiza login automático, extrai protocolos do Todoist, envia lances e notifica clientes via WhatsApp nos dias 8 e 16 de cada mês.',
    icon: Bot,
    link: 'https://github.com/dhqdev/bci-on1?tab=readme-ov-file',
    tags: ['Automação', 'Python', 'Selenium'],
    image: '/media/projects/bci-on1.webp',
  },
];
