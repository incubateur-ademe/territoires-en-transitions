import { modifiedSinceSchema } from '@/backend/utils/modified-since.enum';
import { z } from 'zod';
import {
  ciblesEnumSchema,
  prioriteEnumSchema,
  statutsEnumSchema,
} from './models/fiche-action.table';

export const typePeriodeEnumValues = [
  'creation',
  'modification',
  'debut',
  'fin',
] as const;
export type TypePeriodeEnumType = (typeof typePeriodeEnumValues)[number];

export const typePeriodeEnumSchema = z.enum(typePeriodeEnumValues);

/**
 * TODO
 * export const filtreSchema = filtreRessourceLieesSchema
  .pick({
    ficheActionIds: true,
    planActionIds: true,
    referentielActionIds: true,
    linkedFicheActionIds: true,
    utilisateurPiloteIds: true,
    personnePiloteIds: true,
    utilisateurReferentIds: true,
    partenaireIds: true,
    personneReferenteIds: true,
    structurePiloteIds: true,
    servicePiloteIds: true,
    thematiqueIds: true,
    financeurIds: true,
  })
  .merge(filtreSpecifiqueSchema);
 */

export const fetchFichesFilterRequestSchema = z
  .object({
    noPilote: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(
        `Aucun utilisateur ou personne pilote n'est associé à la fiche`
      ),
    budgetPrevisionnel: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`A un budget prévisionnel`),
    hasIndicateurLies: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`A indicateur(s) associé(s)`),
    ameliorationContinue: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`Est en amélioration continue`),
    restreint: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`Fiche action en mode privé`),
    noServicePilote: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`Aucune direction ou service pilote n'est associée à la fiche`),
    noStatut: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`Aucun statut`),
    statuts: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(statutsEnumSchema.array()),
        statutsEnumSchema.array(),
      ])
      .optional()
      .describe('Liste des statuts séparés par des virgules'),
    noPriorite: z
      .union([
        z.enum(['true', 'false']).transform((value) => value === 'true'),
        z.boolean(),
      ])
      .optional()
      .describe(`Aucune priorité`),
    priorites: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(prioriteEnumSchema.array()),
        prioriteEnumSchema.array(),
      ])
      .optional()
      .describe('Liste des priorités séparés par des virgules'),
    cibles: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(ciblesEnumSchema.array()),
        ciblesEnumSchema.array(),
      ])
      .optional()
      .describe('Liste des cibles séparées par des virgules'),
    partenaireIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants de tags de partenaires séparés par des virgules'
      ),
    financeurIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants de tags de financeur séparés par des virgules'
      ),
    thematiqueIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants de thématiques séparés par des virgules'
      ),
    sousThematiqueIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants de sous-thématiques séparés par des virgules'
      ),
    personnePiloteIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurPiloteIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          ),
        z.string().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    personneReferenteIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurReferentIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          ),
        z.string().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    servicePiloteIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        'Liste des identifiants de tags de services séparés par des virgules'
      ),
    structurePiloteIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe('Liste des identifiants de structure séparés par des virgules'),
    planActionIds: z
      .union([
        z
          .string()
          .transform((value) =>
            typeof value === 'string' ? value.split(',') : value
          )
          .pipe(z.coerce.number().array()),
        z.number().array(),
      ])
      .optional()
      .describe(
        "Liste des identifiants des plans d'action séparés par des virgules"
      ),
    modifiedAfter: z
      .string()
      .datetime()
      .optional()
      .describe('Uniquement les fiches modifiées après cette date'),
    typePeriode: typePeriodeEnumSchema.optional(),
    debutPeriode: z.string().datetime().optional(),
    finPeriode: z.string().datetime().optional(),
    modifiedSince: modifiedSinceSchema
      .optional()
      .describe(
        'Filtre sur la date de modification en utilisant des valeurs prédéfinies'
      ),
  })
  .describe('Filtre de récupération des fiches action');

export type GetFichesActionFilterRequestType = z.infer<
  typeof fetchFichesFilterRequestSchema
>;
