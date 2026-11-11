import { z } from 'zod';

const text = z.string().trim().min(1);
const id = z.number().int().positive();
const references = z
  .tuple([z.literal('L')])
  .rest(id)
  .nullable()
  .transform((value) => (value?.slice(1) ?? []) as number[]);

export const electrificationGristFields = {
  Axes: z.object({
    Numero: id,
    Titre: text,
    Code_signe: text,
    Parametre_signe: text,
  }),
  Sous_axes: z.object({ Numero: text, Titre: text, Axe: id }),
  Actions: z.object({
    Numero: text,
    Titre: text,
    Descriptif: z.string().nullable(),
    Axe: id,
    Sous_axe: z.number().int().nonnegative(),
    Sous_actions: references,
    Indicateurs: references,
    Ressources: references,
  }),
  Sous_actions: z.object({
    Titre: text,
    Description: z.string().trim().nullable(),
    Action: id,
    Ordre: z.number().int().nonnegative(),
  }),
  // Les définitions TeT publiées font autorité pour l'unité et la périodicité.
  Indicateurs: z.object({ Code: text }),
  Ressources: z.object({ Nom: text, Site_web: z.string().nullable() }),
};

export type ElectrificationGristTable = keyof typeof electrificationGristFields;
export type ElectrificationGristData = {
  [K in ElectrificationGristTable]: {
    id: number;
    fields: z.output<(typeof electrificationGristFields)[K]>;
  }[];
};

// Libellés présents dans l'export de l'annuaire ; aucune colonne TeT à ajouter.
export const electrificationLaureatGristFields = z.object({
  'Code territoire': text,
  'Identifiant public': z.string().trim().nullable(),
  'Nature du périmètre': z.enum([
    'Commune',
    'EPCI',
    'Groupement de collectivités',
  ]),
});

export type ElectrificationLaureatGrist = z.output<
  typeof electrificationLaureatGristFields
>;
