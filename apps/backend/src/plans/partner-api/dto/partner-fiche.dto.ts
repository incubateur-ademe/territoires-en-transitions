import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationResponseSchema } from './partner-query.dto';

const tagSchema = z.object({
  id: z.number().describe("Identifiant"),
  nom: z.string().describe('Libellé'),
});

const piloteSchema = z
  .object({
    nom: z.string().nullable().describe('Nom du pilote'),
    prenom: z.string().nullable().optional().describe('Prénom du pilote'),
  })
  .describe('Pilote ou référent de la fiche');

const financeurSchema = z
  .object({
    id: z.number().describe('Identifiant du financeur'),
    nom: z.string().describe('Nom du financeur'),
    montantTtc: z
      .number()
      .nullable()
      .describe('Montant TTC du financement (en euros)'),
  })
  .describe("Financeur associé à la fiche");

const indicateurSchema = z
  .object({
    id: z.number().describe("Identifiant de l'indicateur"),
    nom: z.string().nullable().describe("Nom de l'indicateur"),
    unite: z.string().nullable().describe("Unité de mesure"),
  })
  .describe('Indicateur associé à la fiche');

const planRefSchema = z
  .object({
    id: z.number().describe("Identifiant du plan"),
    nom: z.string().nullable().describe("Nom du plan"),
  })
  .describe("Référence à un plan d'action");

const axeRefSchema = z
  .object({
    id: z.number().describe("Identifiant de l'axe"),
    nom: z.string().nullable().describe("Nom de l'axe"),
    planId: z.number().nullable().describe('Identifiant du plan parent'),
  })
  .describe("Référence à un axe d'un plan");

const ficheSummarySchema = z
  .object({
    id: z.number().describe('Identifiant de la fiche action'),
    titre: z.string().nullable().describe('Titre de la fiche'),
    description: z.string().nullable().describe('Description de la fiche'),
    statut: z
      .string()
      .nullable()
      .describe(
        'Statut de la fiche (ex: "En cours", "Réalisé", "À venir", "En pause", "Abandonné")'
      ),
    priorite: z
      .string()
      .nullable()
      .describe('Niveau de priorité (ex: "Fort", "Moyen", "Bas")'),
    dateDebut: z
      .string()
      .nullable()
      .describe('Date de début prévue (format YYYY-MM-DD)'),
    dateFin: z
      .string()
      .nullable()
      .describe('Date de fin prévue (format YYYY-MM-DD)'),
    budgetPrevisionnel: z
      .number()
      .nullable()
      .describe('Budget prévisionnel global (en euros)'),
    ameliorationContinue: z
      .boolean()
      .nullable()
      .describe("Fiche en amélioration continue (sans date de fin)"),
    thematiques: z.array(tagSchema).describe('Thématiques associées'),
    sousThematiques: z.array(tagSchema).describe('Sous-thématiques associées'),
    pilotes: z.array(piloteSchema).describe('Pilotes de la fiche'),
    structures: z.array(tagSchema).describe('Structures pilotes'),
    plans: z.array(planRefSchema).describe("Plans d'action de rattachement"),
    axes: z.array(axeRefSchema).describe('Axes de rattachement'),
    effetsAttendus: z.array(tagSchema).describe('Effets attendus'),
    financeurs: z.array(financeurSchema).describe('Financeurs'),
    indicateurs: z.array(indicateurSchema).describe('Indicateurs de suivi'),
    createdAt: z.string().datetime().describe('Date de création (ISO 8601)'),
    modifiedAt: z.string().datetime().describe('Date de dernière modification (ISO 8601)'),
  })
  .describe('Résumé d\'une fiche action');

export const listFichesResponseSchema = z
  .object({
    data: z.array(ficheSummarySchema).describe('Liste des fiches action'),
    pagination: paginationResponseSchema,
  })
  .describe('Réponse paginée de la liste des fiches action');

export class ListFichesResponseDto extends createZodDto(
  listFichesResponseSchema
) {}

const etapeSchema = z
  .object({
    id: z.number().describe("Identifiant de l'étape"),
    nom: z.string().nullable().describe("Nom de l'étape"),
    realise: z.boolean().describe("Étape réalisée ou non"),
    ordre: z.number().describe("Ordre d'affichage"),
  })
  .describe("Étape de mise en œuvre");

const budgetSchema = z
  .object({
    id: z.number().describe('Identifiant du budget'),
    type: z.string().describe('Type de budget (ex: "investissement", "fonctionnement")'),
    unite: z.string().describe('Unité monétaire'),
    annee: z.number().nullable().describe("Année budgétaire"),
    budgetPrevisionnel: z.number().nullable().describe('Budget prévisionnel (en euros)'),
    budgetReel: z.number().nullable().describe('Budget réel (en euros)'),
    estEtale: z.boolean().describe("Budget étalé sur plusieurs années"),
  })
  .describe('Ligne budgétaire annuelle');

const mesureSchema = z
  .object({
    id: z.string().describe("Identifiant de l'action du référentiel (ex: \"cae_1.1.1\")"),
  })
  .describe('Action du référentiel liée à la fiche');

const ficheLieeSchema = z
  .object({
    id: z.number().describe('Identifiant de la fiche liée'),
    titre: z.string().nullable().describe('Titre de la fiche liée'),
  })
  .describe('Référence à une fiche action liée');

export const getFicheResponseSchema = ficheSummarySchema
  .extend({
    objectifs: z.string().nullable().describe('Objectifs de la fiche'),
    ressources: z.string().nullable().describe('Ressources nécessaires'),
    calendrier: z.string().nullable().describe('Calendrier de mise en œuvre'),
    cibles: z
      .array(z.string())
      .nullable()
      .describe('Publics cibles (ex: "Grand public", "Entreprises")'),
    piliersEci: z
      .array(z.string())
      .nullable()
      .describe("Piliers de l'économie circulaire concernés"),
    participationCitoyenne: z
      .string()
      .nullable()
      .describe('Description de la participation citoyenne'),
    participationCitoyenneType: z
      .string()
      .nullable()
      .describe('Type de participation citoyenne'),
    tempsDeMiseEnOeuvre: z
      .string()
      .nullable()
      .describe('Temps de mise en œuvre estimé (ex: "Moins de 1 an")'),
    etapes: z.array(etapeSchema).describe('Étapes de mise en œuvre'),
    mesures: z
      .array(mesureSchema)
      .describe('Actions du référentiel liées'),
    budgets: z.array(budgetSchema).describe('Détail budgétaire par année'),
    partenaires: z.array(tagSchema).describe('Partenaires'),
    services: z.array(tagSchema).describe('Services de la collectivité'),
    referents: z.array(piloteSchema).describe('Référents de la fiche'),
    fichesLiees: z
      .array(ficheLieeSchema)
      .describe('Fiches action liées (non-restreintes uniquement)'),
  })
  .describe("Détail complet d'une fiche action avec toutes ses relations");

export class GetFicheResponseDto extends createZodDto(
  getFicheResponseSchema
) {}
