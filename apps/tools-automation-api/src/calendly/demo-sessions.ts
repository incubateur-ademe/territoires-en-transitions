// Correspondances entre les id calendly et la colonne "source" de la table

import { keyBy } from "es-toolkit";

// Feedback dans Airtable
export const DemoSessions = [
  { slug: 'session-accueil', source: 'Démo Accueil' },
  {
    slug: 'demo-fonctionnalite-plans-d-action',
    source: 'Démo Pilotage (Calendly)',
  },
  {
    slug: 'session-demo-nouvelles-fonctionnalites',
    source: 'Démo Nouvelles Fonctionnalités',
  },
  {
    slug: 'territoires-en-transitions-webinaire-de-presentation',
    source: 'Démo pilotage (collective)',
  },
  { slug: 'entretien-support-plan-d-action', source: 'Support (Calendly)' },
];

export const DemoSessionSlugs = DemoSessions.map((s) => s.slug);
export const DemoSessionBySlug = keyBy(DemoSessions, ds => ds.slug);
