import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookIcon } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Bascorro',
    },
     links: [
      {
        icon: <BookIcon />,
        text: 'Quick Start',
        url: '/blog',
        // secondary items will be displayed differently on navbar
        secondary: false,
      },
    ],
  };
}
