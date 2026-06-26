import { ImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/import-plan.input';
import { isSousAction } from '@tet/backend/plans/plans/import-plan-aggregate/schemas/import-action.input';
import { validateImportPlanInput } from '@tet/backend/plans/plans/import-plan-aggregate/validators/plan.rules';
import { describe, expect, it } from 'vitest';
import {
  ExtractedAction,
  ExtractedSousAction,
} from '../models/extracted-action';
import {
  capExtractedActionTitles,
  countOverlongTitles,
  dedupeExtractedActions,
  extractedActionToImportActions,
  MAX_FICHE_TITLE_LENGTH,
  normalizeExtractedActions,
} from './extracted-action-to-import-action';

const toSousAction = (
  overrides: Partial<ExtractedSousAction> = {}
): ExtractedSousAction => ({
  titre: 'Déployer des lignes de covoiturage',
  description: null,
  personnePilote: null,
  statut: null,
  dateDebut: null,
  dateFin: null,
  ...overrides,
});

const toAction = (
  overrides: Partial<ExtractedAction> = {}
): ExtractedAction => ({
  axe: 'Mobilité',
  sousAxe: 'Covoiturage',
  titre: 'Réduire l autosolisme',
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
  ...overrides,
});

describe('extractedActionToImportActions', () => {
  it('mappe une action (axisPath, statut, budget, pilote)', () => {
    const [action] = extractedActionToImportActions(
      toAction({
        statut: 'A discuter',
        budget: 24000,
        personnePilote: 'Jean Dupont',
        structurePilote: 'DDT',
        directionServicePilote: 'Service mobilité',
      })
    );

    expect(isSousAction(action)).toBe(false);
    expect(action).toMatchObject({
      axisPath: ['Mobilité', 'Covoiturage'],
      titre: 'Réduire l autosolisme',
      status: 'A discuter',
      budget: 24000,
      pilotes: ['Jean Dupont'],
      structures: ['DDT'],
      services: ['Service mobilité'],
    });
  });

  it('mappe une sous-action imbriquée qui hérite des axes de son action parente', () => {
    const [, sousAction] = extractedActionToImportActions(
      toAction({
        sousActions: [
          toSousAction({ dateDebut: '2025-01-01', statut: 'En cours' }),
        ],
      })
    );

    expect(isSousAction(sousAction)).toBe(true);
    if (isSousAction(sousAction)) {
      expect(sousAction).toMatchObject({
        axisPath: ['Mobilité', 'Covoiturage'],
        parentActionTitre: 'Réduire l autosolisme',
        titre: 'Déployer des lignes de covoiturage',
        status: 'En cours',
        dateDebut: new Date('2025-01-01'),
      });
    }
  });

  it('déplie une action en 1 action + N sous-actions partageant axisPath et parent', () => {
    const result = extractedActionToImportActions(
      toAction({
        sousActions: [
          toSousAction({ titre: 'Sous-action A' }),
          toSousAction({ titre: 'Sous-action B' }),
        ],
      })
    );

    expect(result).toHaveLength(3);
    const sousActions = result.filter(isSousAction);
    expect(sousActions).toHaveLength(2);
    expect(sousActions.map((sousAction) => sousAction.titre)).toEqual([
      'Sous-action A',
      'Sous-action B',
    ]);
    sousActions.forEach((sousAction) => {
      expect(sousAction.axisPath).toEqual(['Mobilité', 'Covoiturage']);
      expect(sousAction.parentActionTitre).toBe('Réduire l autosolisme');
    });
  });

  it('mappe statut null vers status undefined', () => {
    const [action] = extractedActionToImportActions(toAction());
    expect(action.status).toBeUndefined();
  });

  it('round-trip : un draft mappé passe validateImportPlanInput', () => {
    const planInput: ImportPlanInput = {
      nom: 'Plan importé',
      actions: [toAction({ sousActions: [toSousAction()] })].flatMap(
        extractedActionToImportActions
      ),
    };

    const result = validateImportPlanInput(planInput);
    expect(result.success).toBe(true);
  });
});

describe('dedupeExtractedActions', () => {
  it('supprime les actions de même axe, sous-axe et titre en gardant la première', () => {
    const result = dedupeExtractedActions([
      toAction({ description: 'première' }),
      toAction({ description: 'doublon' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('première');
  });

  it('conserve un même titre sous des sous-axes différents', () => {
    const result = dedupeExtractedActions([
      toAction({ sousAxe: 'Covoiturage' }),
      toAction({ sousAxe: 'Vélo' }),
    ]);

    expect(result).toHaveLength(2);
  });

  it('traite les espaces de bordure comme un même axe (parité avec la validation)', () => {
    const result = dedupeExtractedActions([
      toAction({ axe: 'Mobilité' }),
      toAction({ axe: '  Mobilité  ' }),
    ]);

    expect(result).toHaveLength(1);
  });

  it('laisse des actions distinctes intactes', () => {
    const result = dedupeExtractedActions([
      toAction({ titre: 'Action A' }),
      toAction({ titre: 'Action B' }),
    ]);

    expect(result).toHaveLength(2);
  });
});

describe('capExtractedActionTitles', () => {
  const longTitre = 'A'.repeat(MAX_FICHE_TITLE_LENGTH + 50);

  it('tronque un titre d action trop long à la limite de la colonne', () => {
    const [capped] = capExtractedActionTitles([toAction({ titre: longTitre })]);

    expect(capped.titre).toHaveLength(MAX_FICHE_TITLE_LENGTH);
    expect(capped.titre.endsWith('...')).toBe(true);
  });

  it('tronque aussi les titres de sous-actions', () => {
    const [capped] = capExtractedActionTitles([
      toAction({ sousActions: [toSousAction({ titre: longTitre })] }),
    ]);

    expect(capped.sousActions[0].titre).toHaveLength(MAX_FICHE_TITLE_LENGTH);
  });

  it('laisse intact un titre dans la limite', () => {
    const [capped] = capExtractedActionTitles([
      toAction({ titre: 'Titre court' }),
    ]);

    expect(capped.titre).toBe('Titre court');
  });
});

describe('countOverlongTitles', () => {
  const longTitre = 'A'.repeat(MAX_FICHE_TITLE_LENGTH + 1);

  it('compte les titres d actions et de sous-actions au-delà de la limite', () => {
    const count = countOverlongTitles([
      toAction({ titre: longTitre }),
      toAction({
        titre: 'Court',
        sousActions: [
          toSousAction({ titre: longTitre }),
          toSousAction({ titre: 'Court' }),
        ],
      }),
    ]);

    expect(count).toBe(2);
  });

  it('renvoie 0 quand tous les titres sont dans la limite', () => {
    expect(countOverlongTitles([toAction()])).toBe(0);
  });
});

describe('normalizeExtractedActions', () => {
  it('plafonne, déduplique et renvoie les compteurs en un seul passage', () => {
    const longTitre = 'A'.repeat(MAX_FICHE_TITLE_LENGTH + 10);
    const result = normalizeExtractedActions([
      toAction({ titre: 'Action 1' }),
      toAction({ titre: 'Action 1' }),
      toAction({ titre: longTitre, sousAxe: 'Autre' }),
    ]);

    expect(result.duplicateCount).toBe(1);
    expect(result.truncatedCount).toBe(1);
    expect(result.actions).toHaveLength(2);
    expect(
      result.actions.every(
        (action) => action.titre.length <= MAX_FICHE_TITLE_LENGTH
      )
    ).toBe(true);
  });

  it('ne signale ni doublon ni troncature sur des actions propres', () => {
    const result = normalizeExtractedActions([
      toAction({ titre: 'Action A' }),
      toAction({ titre: 'Action B' }),
    ]);

    expect(result).toMatchObject({ truncatedCount: 0, duplicateCount: 0 });
    expect(result.actions).toHaveLength(2);
  });
});
