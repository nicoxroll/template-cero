/**
 * Configuración central del sitio y de la marca para Template Cero.
 *
 * Para adaptar esta plantilla a cualquier cliente o empresa, modifica
 * los valores en este archivo. Todos los componentes de navegación,
 * pie de página, meta tags y contacto leen de aquí.
 */

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  contact: {
    email: string;
    phone: string;
    whatsapp: string; // Formato internacional solo dígitos para wa.me
    address: string;
    city: string;
    country: string;
    workingHours: string;
  };
  social: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
    youtube?: string;
  };
  legal: {
    companyName: string;
    taxId: string;
    taxIdLabel: string;
    registeredAddress: string;
    copyrightYear: number;
    disclaimers: {
      privacy: string;
      terms: string;
    };
  };
  navigation: Array<{
    label: string;
    href: string;
    isAnchor?: boolean;
  }>;
  features: {
    enableLiveCMS: boolean;
    enableSkinSwitcher: boolean;
    enableDarkMode: boolean;
    enableChatWidget: boolean;
    enableHeroScrub: boolean;
    enableNewsletter: boolean;
  };
}

export const siteConfig: SiteConfig = {
  name: 'Template Cero',
  shortName: 'Cero',
  tagline: 'Transformamos ideas en proyectos de alto valor y escala',
  description:
    'Plantilla web corporativa y showcase de alta fidelidad, construida con React 19, Tailwind CSS v4, GSAP, panel de administración desacoplado y arquitectura de datos resiliente.',
  url: 'https://template-cero.vercel.app',
  ogImage: '/hero-frames/f001.webp',

  contact: {
    email: 'contacto@templatecero.com',
    phone: '+54 9 11 1234-5678',
    whatsapp: '5491112345678',
    address: 'Av. Libertador 1234, Piso 10',
    city: 'Buenos Aires',
    country: 'Argentina',
    workingHours: 'Lunes a Viernes de 9:00 a 18:00 hs',
  },

  social: {
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://x.com',
    github: 'https://github.com',
  },

  legal: {
    companyName: 'Template Cero S.A.',
    taxId: '30-71234567-8',
    taxIdLabel: 'CUIT',
    registeredAddress: 'Av. Libertador 1234, CABA, Argentina',
    copyrightYear: 2026,
    disclaimers: {
      privacy:
        'La información provista en este sitio web es de carácter ilustrativo y se encuentra sujeta a modificaciones sin previo aviso.',
      terms:
        'Toda la documentación técnica y comercial exhibida es propiedad de la empresa o de sus respectivos titulares.',
    },
  },

  navigation: [
    { label: 'Inicio', href: '/' },
    { label: 'Quiénes somos', href: '/#quienes-somos', isAnchor: true },
    { label: 'Servicios', href: '/#servicios', isAnchor: true },
    { label: 'Proyectos', href: '/proyectos' },
    { label: 'Oportunidades', href: '/inversiones' },
    { label: 'Contacto', href: '/contacto' },
  ],

  features: {
    enableLiveCMS: true,
    enableSkinSwitcher: true,
    enableDarkMode: true,
    enableChatWidget: true,
    enableHeroScrub: true,
    enableNewsletter: true,
  },
};
