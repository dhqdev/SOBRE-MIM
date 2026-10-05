/** A trajetória do currículo. Usada na seção Trajetória e no mundo 3D. */
export type Kind = 'trabalho' | 'estudo' | 'evento' | 'inicio';

export interface Milestone {
  date: string;
  title: string;
  place: string;
  text: string;
  kind: Kind;
  current?: boolean;
}

/** A trajetória do currículo, da mais antiga para a mais recente. */
export const milestones: Milestone[] = [
  {
    date: 'Fev 2022',
    title: 'Jovem Aprendiz em Infraestrutura',
    place: 'BRF-PET',
    text: 'Primeiro emprego, pelo programa do CIEE. Foi onde coloquei em prática o que eu já fazia em projetos pessoais.',
    kind: 'inicio',
  },
  {
    date: 'Ago 2022',
    title: 'Ciência da Computação',
    place: 'Unimetrocamp · Wyden',
    text: 'Comecei a graduação enquanto trabalhava. Teoria de dia, servidor e rede na prática.',
    kind: 'estudo',
  },
  {
    date: 'Set 2022',
    title: 'Estagiário em Infraestrutura',
    place: 'BRF-PET',
    text: 'Protheus, Datasul, Active Directory, Power BI e rede Cisco Meraki. Automatizei a instalação de impressoras no domínio e ajudei nos relatórios da auditoria SOX.',
    kind: 'trabalho',
  },
  {
    date: 'Nov 2024',
    title: 'Desenvolvedor Full-Stack Trainee',
    place: 'GRV Software',
    text: 'Virei a chave para o desenvolvimento: ERP em Frappe, o módulo financeiro do NXlite e o Aponta-Web, que aumentou em 80% a visibilidade dos dados operacionais.',
    kind: 'trabalho',
  },
  {
    date: 'Mai 2025',
    title: 'EXPOMAFE',
    place: 'Feira de tecnologia',
    text: 'Um dia inteiro conversando com empresas e saindo da caixinha com um monte de ideias novas.',
    kind: 'evento',
  },
  {
    date: 'Ago 2025',
    title: 'Palestra no Nubank',
    place: 'Escritório do Nubank',
    text: 'Ciência de Dados e Engenharia de Software com o time que faz o "jeitinho NU".',
    kind: 'evento',
  },
  {
    date: 'Fev 2026',
    title: 'Software Engineer · P&D',
    place: 'GRV Software',
    text: 'Lidero o módulo financeiro do ERP: contas a pagar e receber, faturamento, fluxo de caixa e conciliação bancária, além de integrações com pagamentos e WhatsApp.',
    kind: 'trabalho',
    current: true,
  },
  {
    date: 'Jul 2026',
    title: 'Bacharel em Ciência da Computação',
    place: 'Unimetrocamp · Wyden',
    text: 'Diploma na mão depois de quatro anos conciliando faculdade e trabalho.',
    kind: 'estudo',
  },
  {
    date: 'Ago 2026',
    title: 'Pós-graduação em Agentes de IA',
    place: 'FIAP',
    text: 'O próximo capítulo: agentes que pensam, conversam e trabalham juntos, como no Meta-Bot.',
    kind: 'estudo',
    current: true,
  },
];
