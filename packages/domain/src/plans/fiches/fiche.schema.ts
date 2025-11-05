import { z } from 'zod';
import { cibleEnumValues } from './cible.enum.schema';
import { participationCitoyenneEnumValues } from './participation-citoyenne.enum.schema';
import { piliersEciEnumSchema } from './pilier-eci.enum.schema';
import { prioriteEnumValues } from './priorite.enum.schema';
import { statutEnumValues } from './statut.enum.schema';

export const ficheSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  titre: z.string().nullable().describe('Titre'),
  description: z.string().nullable().describe('Description'),
  piliersEci: z.array(piliersEciEnumSchema).nullable().describe('Piliers ECI'),
  objectifs: z.string().nullable().describe('Objectifs'),
  cibles: z.array(z.enum(cibleEnumValues)).nullable().describe('Cibles'),
  ressources: z.string().nullable().describe('Ressources'),
  financements: z.string().nullable().describe('Financements'),
  // numeric mapped as string in most drivers
  budgetPrevisionnel: z
    .string()
    .nullable()
    .describe('Budget prévisionnel total'),
  statut: z.enum(statutEnumValues).nullable().describe('Statut'),
  priorite: z.enum(prioriteEnumValues).nullable().describe('Priorité'),
  dateDebut: z.string().nullable().describe('Date de début'),
  dateFin: z.string().nullable().describe('Date de fin prévisionnelle'),
  ameliorationContinue: z
    .boolean()
    .nullable()
    .describe('Action se répète tous les ans'),
  calendrier: z.string().nullable().describe('Calendrier'),
  notesComplementaires: z.string().nullable().describe('Notes complémentaires'),
  instanceGouvernance: z
    .string()
    .nullable()
    .describe('Instance de gouvernance'),
  participationCitoyenne: z
    .string()
    .nullable()
    .describe('Participation citoyenne'),
  participationCitoyenneType: z
    .enum(participationCitoyenneEnumValues)
    .nullable()
    .describe('Participation citoyenne'),
  tempsDeMiseEnOeuvre: z.number().nullable(),
  majTermine: z.boolean().nullable(),
  createdAt: z.iso.datetime().describe('Date de création'),
  createdBy: z.string().nullable(),
  modifiedAt: z.string().describe('Date de modification'),
  modifiedBy: z.string().nullable(),
  restreint: z.boolean().nullable().describe('Confidentialité'),
});

export type Fiche = z.infer<typeof ficheSchema>;

export const ficheSchemaCreate = z.object({
  ...ficheSchema.partial().shape,
  collectiviteId: z.number(),
});

export type FicheCreate = z.infer<typeof ficheSchemaCreate>;

export const ficheSchemaUpdate = ficheSchemaCreate
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    modifiedAt: true,
    modifiedBy: true,
    tempsDeMiseEnOeuvre: true,
  })
  .partial();
