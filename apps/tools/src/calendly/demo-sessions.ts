// Correspondances entre les id Calendly et les données à insérer dans Airtable

import { keyBy } from 'es-toolkit';
import { z } from 'zod';

export const demoSessionSchema = z.object({
  slug: z.string().min(1).describe("Slug de l'événement Calendly"),
  source: z
    .string()
    .min(1)
    .describe('Valeur à insérer dans la colonne Source dans Airtable'),
  origin: z
    .string()
    .min(1)
    .describe(
      `Valeur à insérer dans la colonne "Origine de l'échange" dans Airtable`
    ),
});

type DemoSession = z.infer<typeof demoSessionSchema>;

// Feedback dans Airtable
export const DemoSessions: DemoSession[] = [
  {
    slug: 'session-accueil',
    source: 'Démo Accueil',
    origin: 'Activation continue',
  },
  {
    slug: 'demo-fonctionnalite-plans-d-action',
    source: 'Démo Pilotage (Calendly)',
    origin: 'Activation continue',
  },
  {
    slug: 'session-demo-nouvelles-fonctionnalites',
    source: 'Démo Nouvelles Fonctionnalités',
    origin: 'Activation continue',
  },
  {
    slug: 'territoires-en-transitions-webinaire-de-presentation',
    source: 'Démo pilotage (collective)',
    origin: 'Activation continue',
  },
  {
    slug: 'entretien-support-plan-d-action',
    source: 'Support (Calendly)',
    origin: 'Support et REX',
  },
  {
    slug: 'demo-optimisation-pilotage-actions',
    source: 'Démo pilotage 2/2 (Calendly)',
    origin: 'Activation continue',
  },
  {
    slug: '30-pour-preparer-la-mise-en-ligne-de-votre-p-clone',
    source: 'Echange suivi',
    origin: 'Suivi utilisateurs PA',
  },
];

export const DemoSessionSlugs = DemoSessions.map((s) => s.slug);
export const DemoSessionBySlug = keyBy(DemoSessions, (ds) => ds.slug);
