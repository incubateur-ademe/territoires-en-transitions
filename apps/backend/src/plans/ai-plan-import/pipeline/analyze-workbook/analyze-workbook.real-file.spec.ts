import { isSousAction } from '@tet/backend/plans/plans/import-plan-aggregate/schemas/import-action.input';
import { success } from '@tet/backend/utils/result.type';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { normalizeExtractedActions } from '../../adapters/extracted-action-to-import-action';
import {
  compareWithManualReference,
  computeEvalMetrics,
  countAxisLevels,
  ManualReference,
} from '../../eval/eval-metrics';
import { draftToImportPlanInput } from '../../generate-import-draft/draft-to-import-plan-input';
import { axisPathOf, ExtractedAction } from '../../models/extracted-action';
import { readTestGrids } from '../__fixtures__/build-test-workbook';
import { readDocument } from '../read-document/read-document';
import { PipelineLlm, runImportPipeline } from '../run-import-pipeline';
import { analyzeWorkbook } from './analyze-workbook';
import { getCellValueAt, SheetGrid } from './sheet-grid';

/**
 * Le classeur réel d'un PCAET, jamais commité : la spec ne tourne qu'avec son
 * chemin, `CCPG_XLSX="…/Outil suivi_CCPG sc.xlsx" npx vitest run …`.
 */
const CCPG_XLSX = process.env.CCPG_XLSX;

const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const countByStatut = (statuts: (string | null | undefined)[]) =>
  Object.fromEntries(
    [...new Set(statuts.map((statut) => statut ?? null))].map((statut) => [
      String(statut),
      statuts.filter((other) => (other ?? null) === statut).length,
    ])
  );

const EXPECTED_SOUS_ACTION_STATUTS = {
  'À venir': 182,
  'En cours': 46,
  Réalisé: 36,
  Abandonné: 5,
  null: 155,
};

/** Le total que le classeur calcule lui-même : la formule `SUM` en P435. */
const readBudgetTotal = (grids: SheetGrid[]): number => {
  const suivi = grids.find(({ name }) => name === 'Suivi');
  if (!suivi) throw new Error('Onglet « Suivi » introuvable');
  return Number(getCellValueAt(suivi, 435, 16));
};

const sumBudgets = (budgets: (number | null | undefined)[]): number =>
  budgets.reduce<number>((total, budget) => total + (budget ?? 0), 0);

/** Ne répond qu'à la revue : tout autre appel fait lever. */
const reviewOnlyLlm = (
  strategy: PipelineLlm['capabilities']['strategy']
): PipelineLlm =>
  ({
    maxInputTokens: 900_000,
    capabilities: { ocr: false, strategy },
    generateStructured: vi.fn(async ({ prompt }: { prompt: string }) => {
      if (!prompt.includes('auditeur qualité')) {
        throw new Error('Appel inattendu au modèle');
      }
      return success({
        data: { avis: 'ok' },
        tokens: {
          promptTokens: 0,
          cachedTokens: 0,
          candidatesTokens: 0,
          thoughtsTokens: 0,
          totalTokens: 0,
        },
      });
    }),
  } as unknown as PipelineLlm);

describe.skipIf(!CCPG_XLSX)('analyzeWorkbook sur le classeur réel CCPG', () => {
  let buffer: Buffer;
  let grids: SheetGrid[];
  let reference: ManualReference;

  beforeAll(async () => {
    buffer = await readFile(CCPG_XLSX ?? '');
    grids = await readTestGrids(buffer);
    reference = JSON.parse(
      await readFile(
        join(__dirname, '../../eval/references/ccpg-suivi-2021.json'),
        'utf-8'
      )
    ) as ManualReference;
  });

  it('lit tout le plan sans le modèle', () => {
    const analysis = analyzeWorkbook(grids);

    const roles = Object.fromEntries(
      analysis.sheets.map(({ name, role }) => [name, role])
    );
    expect(roles).toMatchObject({
      Synthèse: 'synthese',
      Suivi: 'plan',
      Feuil2: 'liste',
    });
    expect(
      Object.values(roles).filter((role) => role === 'complement')
    ).toHaveLength(7);
    expect(analysis.modelPages).toEqual([]);

    // 34 objectifs opérationnels : le n°9 ne remonte qu'en aval
    // (dropRedundantSousAxes).
    expect(countAxisLevels(analysis.actions.map(axisPathOf))).toEqual([
      4, 15, 34,
    ]);
    expect(analysis.actions).toHaveLength(72);

    const sousActions = analysis.actions.flatMap(
      ({ sousActions }) => sousActions
    );
    expect(sousActions).toHaveLength(424);
    expect(countByStatut(sousActions.map(({ statut }) => statut))).toEqual(
      EXPECTED_SOUS_ACTION_STATUTS
    );

    const budgetTotal = readBudgetTotal(grids);
    expect(budgetTotal).toBe(5_759_682);
    expect(sumBudgets(analysis.actions.map(({ budget }) => budget))).toBe(
      budgetTotal
    );
    expect(analysis.warnings.some((w) => w.includes('diffère du total'))).toBe(
      false
    );
  });

  describe.each(['whole-document', 'segmented'] as const)(
    'pipeline complet (%s)',
    (strategy) => {
      let llm: PipelineLlm;
      let actions: ExtractedAction[];

      beforeAll(async () => {
        const read = await readDocument({ buffer, mimeType: XLSX_MIME_TYPE });
        if (!read.success) throw new Error(read.error.kind);
        llm = reviewOnlyLlm(strategy);
        const outcome = await runImportPipeline(llm, {
          document: read.data,
          instructions: '',
          disabledFields: [],
          currentDate: '2026-10-21',
          withVerifications: true,
          withSousActions: true,
          withSecteurs: false,
          effetsAttendus: [],
        });
        if (outcome.status !== 'done') {
          throw new Error(`Import en échec : ${outcome.failedStep}`);
        }
        actions = outcome.draft.actions;
      });

      it("n'appelle le modèle que pour la revue", () => {
        expect(llm.generateStructured).toHaveBeenCalledTimes(1);
      });

      it('rend 4 / 15 / 33 niveaux, 72 fiches et 424 sous-actions jusqu’à la création du plan', () => {
        const normalized = normalizeExtractedActions(actions);
        expect(normalized.duplicateCount).toBe(0);

        const { actions: inputs } = draftToImportPlanInput({
          actions: normalized.actions,
          planName: 'CCPG',
        });
        const fiches = inputs.filter((input) => !isSousAction(input));
        const sousActions = inputs.filter(isSousAction);

        expect(fiches).toHaveLength(72);
        expect(sousActions).toHaveLength(424);
        expect(fiches.every(({ axisPath }) => axisPath?.length)).toBe(true);
        expect(
          countAxisLevels(fiches.map(({ axisPath }) => axisPath ?? []))
        ).toEqual([4, 15, 33]);
        expect(countByStatut(sousActions.map(({ status }) => status))).toEqual(
          EXPECTED_SOUS_ACTION_STATUTS
        );
        expect(sumBudgets(fiches.map(({ budget }) => budget))).toBe(
          readBudgetTotal(grids)
        );
      });

      it('correspond à la référence d’éval, fiche par fiche', () => {
        const draft = {
          actions: normalizeExtractedActions(actions).actions,
          qualitativeReview: null,
        };
        const diff = compareWithManualReference(
          {
            draft,
            metrics: computeEvalMetrics({ draft, events: [], durationMs: 0 }),
          },
          reference
        );

        expect(diff.axisLevels).toEqual({
          expected: [4, 15, 33],
          actual: [4, 15, 33],
        });
        expect(diff.axes.missing).toEqual([]);
        expect(diff.actions.found).toBe(72);
        expect(diff.missingTitles).toEqual([]);
        expect(diff.extraTitles).toEqual([]);
        expect(diff.misplacedTitles).toEqual([]);
        expect(diff.misplacedPaths).toEqual([]);
      });
    }
  );
});
