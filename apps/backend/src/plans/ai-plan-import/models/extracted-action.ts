import { prioriteEnumValues, statutEnumValues } from '@tet/domain/plans';
import { secteursProposesSchema } from '@tet/backend/plans/fiches/fiche-secteurs/secteurs-proposes';
import { z } from 'zod';

export const actionConfidenceSchema = z.object({
  score: z.number().min(0).max(100),
  explication: z.string(),
  amelioree: z.boolean(),
});

const extractedSousActionSchema = z.object({
  titre: z.string(),
  description: z.string().nullable(),
  personnePilote: z.string().nullable(),
  statut: z.enum(statutEnumValues).nullable(),
  dateDebut: z.string().date().nullable(),
  dateFin: z.string().date().nullable(),
});

const sourceTableurSchema = z.object({
  onglet: z.string(),
  premiereLigne: z.number().int(),
  derniereLigne: z.number().int(),
  numero: z.string().optional(),
});

export const extractedActionSchema = z.object({
  axe: z.string(),
  sousAxe: z.string(),
  /**
   * Chemin d'axes complet quand le plan a plus de deux niveaux : il fait foi,
   * `axe` et `sousAxe` en reprennent les deux premiers segments.
   */
  cheminAxes: z.array(z.string()).optional(),
  /** Action construite depuis un tableur : épinglée, le modèle n'y touche pas. */
  sourceTableur: sourceTableurSchema.optional(),
  titre: z.string(),
  description: z.string().nullable(),
  objectifs: z.string().nullable(),
  structurePilote: z.string().nullable(),
  directionServicePilote: z.string().nullable(),
  personnePilote: z.string().nullable(),
  /** Partenaires et financeurs associés, séparés par ", " : jamais des pilotes. */
  partenaires: z.string().nullable(),
  budget: z.number().nullable(),
  /** Sources de financement et subventions, telles que la fiche les cite. */
  financements: z.string().nullable(),
  /** Moyens humains de la fiche (ETP, services mobilisés), tels quels. */
  moyensHumains: z.string().nullable(),
  priorite: z.enum(prioriteEnumValues).nullable(),
  dateDebut: z.string().date().nullable(),
  dateFin: z.string().date().nullable(),
  statut: z.enum(statutEnumValues).nullable(),
  confidence: actionConfidenceSchema.nullable(),
  sousActions: z.array(extractedSousActionSchema),
  /** Absent tant que l'étape des secteurs n'a pas classé l'action. */
  secteurs: secteursProposesSchema.optional(),
});

export type ActionConfidence = z.output<typeof actionConfidenceSchema>;
export type ExtractedSousAction = z.output<typeof extractedSousActionSchema>;
export type ExtractedAction = z.output<typeof extractedActionSchema>;

/** Le chemin d'axes de l'action, sans segment vide. */
export const axisPathOf = (
  action: Pick<ExtractedAction, 'axe' | 'sousAxe' | 'cheminAxes'>
): string[] => compactPath(action.cheminAxes ?? [action.axe, action.sousAxe]);

const compactPath = (path: string[]): string[] =>
  path.map((segment) => segment.trim()).filter((segment) => segment !== '');

/**
 * Les niveaux d'axe à leur position, vides compris : sans chemin complet, un
 * sous-axe sous un axe vide reste un sous-axe et ne se compare pas à un axe.
 */
export const axisSlotsOf = (
  action: Pick<ExtractedAction, 'axe' | 'sousAxe' | 'cheminAxes'>
): string[] => action.cheminAxes ?? [action.axe, action.sousAxe];

export const withAxisPath = (
  action: ExtractedAction,
  path: string[]
): ExtractedAction => {
  const cheminAxes = compactPath(path);
  return {
    ...action,
    cheminAxes,
    axe: cheminAxes[0] ?? '',
    sousAxe: cheminAxes[1] ?? '',
  };
};

/** Les niveaux sous l'axe, lus comme un seul sous-axe pour un rendu texte. */
export const sousAxeLabelOf = (action: ExtractedAction): string =>
  action.cheminAxes ? axisPathOf(action).slice(1).join(' > ') : action.sousAxe;

export const isPinnedAction = (action: ExtractedAction): boolean =>
  action.sourceTableur !== undefined;

export const createUnenrichedSousAction = (
  titre: string
): ExtractedSousAction => ({
  titre: titre.trim(),
  description: null,
  personnePilote: null,
  statut: null,
  dateDebut: null,
  dateFin: null,
});

/** Une action sans aucun champ rempli : base des conversions et des tests. */
export const createEmptyExtractedAction = (
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction => ({
  axe: '',
  sousAxe: '',
  titre: '',
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  partenaires: null,
  budget: null,
  financements: null,
  moyensHumains: null,
  priorite: null,
  dateDebut: null,
  dateFin: null,
  statut: null,
  confidence: null,
  sousActions: [],
  ...overrides,
});
