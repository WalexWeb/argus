export const NAV_ITEMS = [
  {
    href: '/',
    label: 'Дашборд',
    description: 'Сводка и KPI',
    icon: 'dashboard',
  },
  {
    href: '/events',
    label: 'События',
    description: 'Журнал и фильтры',
    icon: 'events',
  },
  {
    href: '/alerts',
    label: 'Алерты',
    description: 'Срабатывания правил',
    icon: 'alerts',
  },
  {
    href: '/correlation',
    label: 'Корреляция',
    description: 'Правила и связи',
    icon: 'correlation',
  },
  {
    href: '/sources',
    label: 'Источники',
    description: 'IP и системы',
    icon: 'sources',
  },
] as const;
