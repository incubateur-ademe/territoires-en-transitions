import { z } from 'zod';

/**
 * Objets proposés par le formulaire du site.
 * Doit rester aligné sur `apps/site/app/contact/data.ts`.
 */
export const contactObjets = ['programme', 'plateforme', 'autre'] as const;
export type ContactObjet = (typeof contactObjets)[number];

export const sendContactMessageInputSchema = z.object({
  objet: z.enum(contactObjets),
  prenom: z.string().trim().min(1).max(100),
  nom: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  tel: z.string().trim().max(30).default(''),
  message: z.string().trim().min(1).max(5000),
  /**
   * Piège à robots : champ masqué en CSS côté site, qu'un humain ne voit ni ne
   * remplit. Volontairement permissif — on ne rejette pas la requête, le
   * service l'ignore en silence pour ne pas apprendre aux robots à le
   * contourner.
   */
  website: z.string().max(200).optional(),
});

export type SendContactMessageInput = z.infer<
  typeof sendContactMessageInputSchema
>;
