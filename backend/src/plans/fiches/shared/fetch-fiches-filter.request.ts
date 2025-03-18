import { modifiedSinceSchema } from '@/backend/utils/modified-since.enum';
import {
  getZodQueryEnum,
  zodQueryBoolean,
  zodQueryNumberArray,
  zodQueryStringArray,
} from '@/domain/utils';
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

export const fetchFichesFilterRequestSchema = z
  .object({
    noPilote: zodQueryBoolean
      .optional()
      .describe(
        `Aucun utilisateur ou personne pilote n'est associé à la fiche`
      ),
    budgetPrevisionnel: zodQueryBoolean
      .optional()
      .describe(`A un budget prévisionnel`),
    hasIndicateurLies: zodQueryBoolean
      .optional()
      .describe(`A indicateur(s) associé(s)`),
    ameliorationContinue: zodQueryBoolean
      .optional()
      .describe(`Est en amélioration continue`),
    restreint: zodQueryBoolean
      .optional()
      .describe(`Fiche action en mode privé`),
    noServicePilote: zodQueryBoolean
      .optional()
      .describe(`Aucune direction ou service pilote n'est associée à la fiche`),
    noStatut: zodQueryBoolean.optional().describe(`Aucun statut`),
    statuts: getZodQueryEnum(statutsEnumSchema)
      .optional()
      .describe('Liste des statuts séparés par des virgules'),
    noPriorite: zodQueryBoolean.optional().describe(`Aucune priorité`),
    priorites: getZodQueryEnum(prioriteEnumSchema)
      .optional()
      .describe('Liste des priorités séparés par des virgules'),
    cibles: getZodQueryEnum(ciblesEnumSchema)
      .optional()
      .describe('Liste des cibles séparées par des virgules'),
    partenaireIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants de tags de partenaires séparés par des virgules'
      ),
    financeurIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants de tags de financeur séparés par des virgules'
      ),
    thematiqueIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants de thématiques séparés par des virgules'
      ),
    sousThematiqueIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants de sous-thématiques séparés par des virgules'
      ),
    personnePiloteIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurPiloteIds: zodQueryStringArray
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    libreTagsIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants des tags libres séparées par des virgules'
      ),
    personneReferenteIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurReferentIds: zodQueryStringArray
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    servicePiloteIds: zodQueryNumberArray
      .optional()
      .describe(
        'Liste des identifiants de tags de services séparés par des virgules'
      ),
    structurePiloteIds: zodQueryNumberArray
      .optional()
      .describe('Liste des identifiants de structure séparés par des virgules'),
    planActionIds: zodQueryNumberArray
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
