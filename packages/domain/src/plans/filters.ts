import { z } from 'zod';
import { modifiedSinceSchema } from '../utils/modified-since.enum';
import { cibleEnumSchema } from './fiches/cible.enum.schema';
import { prioriteEnumSchema } from './fiches/priorite.enum.schema';
import { statutEnumSchema } from './fiches/statut.enum.schema';

export const typePeriodeEnumValues = [
  'creation',
  'modification',
  'debut',
  'fin',
] as const;
export type TypePeriodeEnum = (typeof typePeriodeEnumValues)[number];

export const typePeriodeEnumSchema = z.enum(typePeriodeEnumValues);

export const notesOptionValues = [
  'WITH',
  'WITHOUT',
  'WITH_RECENT',
  'WITHOUT_RECENT',
] as const;

export type NotesOption = (typeof notesOptionValues)[number];

export const listFichesRequestFiltersSchema = z
  .object({
    noPilote: z.coerce
      .boolean()
      .optional()
      .describe(
        `Aucun utilisateur ou personne pilote n'est associé à l'action`
      ),
    hasBudgetPrevisionnel: z.coerce
      .boolean()
      .optional()
      .describe(`A un budget prévisionnel`),
    hasIndicateurLies: z.coerce
      .boolean()
      .optional()
      .describe(`A indicateur(s) associé(s)`),
    indicateurIds: z.array(z.coerce.number()).optional(),
    hasMesuresLiees: z.coerce
      .boolean()
      .optional()
      .describe(`A mesure(s) des référentiels associée(s)`),
    hasBudget: z.coerce.boolean().optional().describe(`A un budget renseigné`),
    doesBelongToSeveralPlans: z.coerce
      .boolean()
      .optional()
      .describe(`Actions mutualisées dans plusieurs plans`),
    hasDateDeFinPrevisionnelle: z.coerce
      .boolean()
      .optional()
      .describe(`A une date de fin prévisionnelle`),
    ameliorationContinue: z.coerce
      .boolean()
      .optional()
      .describe(`Est en amélioration continue`),
    restreint: z.coerce.boolean().optional().describe(`Action en mode privé`),
    noServicePilote: z.coerce
      .boolean()
      .optional()
      .describe(`Aucune direction ou service pilote n'est associée à l'action`),
    sharedWithCollectivites: z
      .boolean()
      .optional()
      .describe(`Action mutualisée avec d'autres collectivités`),
    noStatut: z.coerce.boolean().optional().describe(`Aucun statut`),
    noTag: z.coerce.boolean().optional().describe(`Aucun tag personnalisés`),
    statuts: z
      .array(statutEnumSchema)
      .optional()
      .describe('Liste des statuts séparés par des virgules'),

    noPriorite: z.coerce.boolean().optional().describe(`Aucune priorité`),
    priorites: z
      .array(prioriteEnumSchema)
      .optional()
      .describe('Liste des priorités séparés par des virgules'),
    cibles: z
      .array(cibleEnumSchema)
      .optional()
      .describe('Liste des cibles séparées par des virgules'),

    notes: z
      .enum(notesOptionValues)
      .optional()
      .describe(
        `A une note (WITH), n'a pas de note (WITHOUT), a une note récente < 1 an (WITH_RECENT), ou pas de note récente > 1 an (WITHOUT_RECENT)`
      ),
    anneesNotes: z
      .array(z.coerce.string())
      .optional()
      .describe('Années des notes séparées par des virgules'),

    ficheIds: z
      .array(z.coerce.number())
      .optional()
      .describe('Liste des identifiants des fiches séparés par des virgules'),
    partenaireIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags de partenaires séparés par des virgules'
      ),
    financeurIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags de financeur séparés par des virgules'
      ),
    thematiqueIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de thématiques séparés par des virgules'
      ),
    sousThematiqueIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de sous-thématiques séparés par des virgules'
      ),
    personnePiloteIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurPiloteIds: z
      .array(z.string())
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    libreTagsIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants des tags libres séparées par des virgules'
      ),

    noReferent: z.coerce.boolean().optional(),
    personneReferenteIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurReferentIds: z
      .array(z.string())
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    servicePiloteIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags de services séparés par des virgules'
      ),
    structurePiloteIds: z
      .array(z.coerce.number())
      .optional()
      .describe('Liste des identifiants de structure séparés par des virgules'),

    noPlan: z.coerce.boolean().optional().describe(`Aucun plan`),
    planActionIds: z
      .array(z.coerce.number())
      .optional()
      .describe('Liste des identifiants des plans séparés par des virgules'),
    mesureIds: z
      .array(z.string())
      .optional()
      .describe(
        'Liste des identifiants des mesures du référentiel séparés par des virgules'
      ),
    linkedFicheIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants des actions liées séparés par des virgules'
      ),
    modifiedAfter: z.iso
      .datetime()
      .optional()
      .describe('Uniquement les actions modifiées après cette date'),
    typePeriode: typePeriodeEnumSchema.optional(),
    debutPeriode: z.iso.datetime().optional(),
    finPeriode: z.iso.datetime().optional(),
    modifiedSince: modifiedSinceSchema
      .optional()
      .describe(
        'Filtre sur la date de modification en utilisant des valeurs prédéfinies'
      ),
    texteNomOuDescription: z.string().optional(),
    axesId: z.array(z.coerce.number()).optional(),
    hasAtLeastBeginningOrEndDate: z.coerce.boolean().optional(),
    noTitre: z.coerce.boolean().optional().describe(`Aucun titre`),
    noDescription: z.coerce.boolean().optional().describe(`Aucune description`),
    noObjectif: z.coerce.boolean().optional().describe(`Aucun objectif`),
    parentsId: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste uniquement les sous-actions associées aux actions parentes spécifiées. Exclut automatiquement les actions parentes et les autres sous-actions. Mutuellement exclusif avec `withChildren`.'
      ),
    withChildren: z.coerce
      .boolean()
      .optional()
      .describe(
        'Inclut les sous-actions dans les résultats. Par défaut, les sous-actions sont exclues. Mutuellement exclusif avec `parentsId`.'
      ),
    withAxesAncestors: z.coerce
      .boolean()
      .optional()
      .describe(
        'Inclut dans le champs `axes` les axes auxquels la fiche est rattachée et tous leurs antécédents. Par défaut seulement les axes auxquels la fiche est rattachée sont remontés.'
      ),
  })
  .refine((data) => !(data.parentsId && data.withChildren), {
    message:
      'Les filtres `parentsId` et `withChildren` sont mutuellement exclusifs et ne peuvent pas être utilisés simultanément.',
    path: ['parentsId', 'withChildren'],
  })
  .describe('Filtre de récupération des actions');

export type ListFichesRequestFilters = z.output<
  typeof listFichesRequestFiltersSchema
>;
export type ListFichesRequestFiltersKeys = keyof ListFichesRequestFilters;

export const isListFichesRequestFiltersKeys = (
  filters: string
): filters is ListFichesRequestFiltersKeys => {
  return Object.keys(listFichesRequestFiltersSchema.shape).includes(filters);
};
