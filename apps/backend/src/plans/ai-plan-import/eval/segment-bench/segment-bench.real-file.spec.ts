import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { DOCX_MIME } from '../../enqueue-import/detect-source-mime-type';
import {
  type ActionLevel,
  type ImportChoice,
  proposedChoiceOf,
  type ThemeGrouping,
  toReadingChoices,
} from '../../models/import-question';
import { applyReadingChoices } from '../../pipeline/apply-reading-choices';
import {
  isMostlyUnreadable,
  measureReadingStats,
} from '../../pipeline/document/reading-stats';
import { readDocument } from '../../pipeline/read-document/read-document';
import {
  DEFAULT_SEGMENT_OPTIONS,
  detectReadingDoubts,
  segmentDocument,
} from '../../pipeline/segment-document/segment-document';
import {
  type ManualReference,
  referenceAtThemeGrouping,
} from '../eval-metrics';
import {
  scoreSegmentation,
  SegmentationDetail,
  SegmentationScore,
} from './score-segmentation';

/**
 * Banc de non-régression du découpage : ce que le code lit dans chaque
 * document du corpus, comparé à sa référence manuelle, sans aucun appel au
 * modèle (ni structuration, ni OCR : une page-image reste vide). Les documents
 * ne sont jamais commités : le banc ne tourne qu'avec le dossier du corpus,
 * `AI_IMPORT_CORPUS=… npx vitest run src/plans/ai-plan-import/eval/segment-bench`.
 *
 * Chaque référence déclare les questions que sa lecture doit poser, par leur
 * choix proposé : une question de plus ou de moins fait échouer le banc. Le
 * découpage se mesure avec ces choix appliqués, ce qu'obtient l'utilisateur
 * qui continue sans rien changer ; `niveaux` et `regroupements` mesurent
 * aussi l'autre réponse.
 *
 * Aucun score ne peut baisser sous le seuil enregistré. Un score qui monte se
 * fige avec `UPDATE_BASELINE=1`, et le seuil se commite avec le changement.
 */
const CORPUS = process.env.AI_IMPORT_CORPUS;
const UPDATE_BASELINE = process.env.UPDATE_BASELINE === '1';

const REFERENCES_DIR = join(__dirname, '../references');
const BASELINE_FILE = join(__dirname, 'segment-bench.baseline.json');
const REPORT_FILE = join(
  __dirname,
  '../../../../../eval-out/segment-bench.json'
);

const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': DOCX_MIME,
};

// Ce qui doit monter, et ce qui doit baisser.
const HIGHER_IS_BETTER = [
  'trouvees',
  'titresComplets',
  'numeros',
  'bonAxe',
  'bonChemin',
  'axesTrouves',
  'axesComplets',
] as const satisfies (keyof SegmentationScore)[];

type Baseline = Record<string, SegmentationScore>;

type BenchCase = {
  key: string;
  reference: ManualReference;
  actionLevel: ActionLevel;
  /** Absent quand le document ne pose pas la question des thèmes. */
  grouping?: ThemeGrouping;
};

// Synchrones : `it.for` veut ses cas à la collecte.
const readReferences = (): BenchCase[] =>
  readdirSync(REFERENCES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({
      file,
      reference: JSON.parse(
        readFileSync(join(REFERENCES_DIR, file), 'utf8')
      ) as ManualReference,
    }))
    .filter(
      ({ reference }) =>
        reference.fichier && extname(reference.fichier) in MIME_BY_EXTENSION
    )
    .flatMap(({ file, reference }) =>
      (reference.niveaux ?? [proposedActionLevelOf(reference)]).flatMap(
        (actionLevel) =>
          groupingsOf(reference).map((grouping) => ({
            key: [file.replace(/\.json$/u, ''), actionLevel, grouping]
              .filter(Boolean)
              .join(' · '),
            reference,
            actionLevel,
            grouping,
          }))
      )
    );

const proposedChoiceIn = <Kind extends ImportChoice['kind']>(
  reference: ManualReference,
  kind: Kind
): Extract<ImportChoice, { kind: Kind }> | undefined =>
  reference.questionsAttendues?.find(
    (choice): choice is Extract<ImportChoice, { kind: Kind }> =>
      choice.kind === kind
  );

const proposedActionLevelOf = (reference: ManualReference): ActionLevel =>
  proposedChoiceIn(reference, 'action-level')?.actionLevel ?? 'fiche';

const groupingsOf = (
  reference: ManualReference
): (ThemeGrouping | undefined)[] => {
  const proposed = proposedChoiceIn(reference, 'theme-grouping')?.grouping;
  return proposed ? reference.regroupements ?? [proposed] : [undefined];
};

/** « action-level etape » : la sorte, puis le choix ; triés par sorte. */
const describeChoices = (choices: ImportChoice[]): string[] =>
  choices
    .map(({ kind, ...choice }) => [kind, ...Object.values(choice)].join(' '))
    .sort();

const readBaseline = (): Baseline =>
  existsSync(BASELINE_FILE)
    ? (JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) as Baseline)
    : {};

const cases = readReferences();
const baseline = readBaseline();
const results: Record<
  string,
  {
    score: SegmentationScore;
    detail: SegmentationDetail;
    questions: string[];
  }
> = {};

describe.skipIf(!CORPUS)('Banc du découpage sur le corpus', () => {
  it.for(cases)('$key', async (benchCase, context) => {
    const { key, reference, actionLevel, grouping } = benchCase;
    const path = join(CORPUS ?? '', reference.fichier ?? '');
    if (!existsSync(path)) {
      context.skip(`absent du corpus : ${reference.fichier}`);
    }
    const read = await readDocument({
      buffer: await readFile(path),
      mimeType: MIME_BY_EXTENSION[extname(path)],
    });
    expect(read.success).toBe(true);
    if (!read.success) return;

    const doubts = detectReadingDoubts(read.data);
    const questions = describeChoices(doubts.map(proposedChoiceOf));
    const choices = doubts.map((doubt): ImportChoice => {
      switch (doubt.kind) {
        case 'action-level':
          return { kind: 'action-level', actionLevel };
        case 'theme-grouping':
          return {
            kind: 'theme-grouping',
            grouping: grouping ?? doubt.proposed,
          };
        case 'actions-without-fiche':
          // Les tableaux gardés ou non se décident au tri : le découpage
          // n'en dépend pas.
          return { kind: 'actions-without-fiche', actions: doubt.proposed };
      }
    });
    const units =
      applyReadingChoices(
        segmentDocument(read.data, { ...DEFAULT_SEGMENT_OPTIONS, actionLevel }),
        null,
        toReadingChoices(doubts, choices)
      ) ?? [];
    const { score, detail } = scoreSegmentation(
      units,
      referenceAtThemeGrouping(reference, grouping),
      actionLevel
    );
    results[key] = { score, detail, questions };

    expect(
      reference.questionsAttendues,
      `${key} : questionsAttendues à déclarer`
    ).toBeDefined();
    expect(questions, `${key} : questions posées`).toEqual(
      describeChoices(reference.questionsAttendues ?? [])
    );
    // Un plan lisible ne peut ni perdre ses questions ni être abandonné pour
    // texte illisible, quoi que dise le modèle.
    expect(
      isMostlyUnreadable(measureReadingStats(read.data)),
      `${key} : texte illisible`
    ).toBe(false);
    const withoutFiche = doubts.find(
      (doubt) => doubt.kind === 'actions-without-fiche'
    );
    if (withoutFiche?.kind === 'actions-without-fiche') {
      expect(withoutFiche.listed, `${key} : actions listées`).toBe(
        reference.actions.length
      );
      expect(withoutFiche.withoutFiche, `${key} : actions sans fiche`).toBe(
        reference.actionsSansFiche?.length
      );
    }
    const floor = baseline[key];
    if (UPDATE_BASELINE || !floor) return;
    for (const metric of HIGHER_IS_BETTER) {
      expect(score[metric], `${key} : ${metric}`).toBeGreaterThanOrEqual(
        floor[metric]
      );
    }
    expect(score.enTrop, `${key} : enTrop`).toBeLessThanOrEqual(floor.enTrop);
  });

  afterAll(async () => {
    const keys = Object.keys(results).sort();
    if (keys.length === 0) return;
    printTable(keys);
    await mkdir(join(REPORT_FILE, '..'), { recursive: true });
    await writeFile(REPORT_FILE, JSON.stringify(results, null, 2));
    if (UPDATE_BASELINE) {
      const updated = { ...baseline };
      for (const key of keys) {
        updated[key] = results[key].score;
      }
      await writeFile(
        BASELINE_FILE,
        `${JSON.stringify(sortKeys(updated), null, 2)}\n`
      );
    }
  });
});

const sortKeys = (baseline: Baseline): Baseline =>
  Object.fromEntries(
    Object.entries(baseline).sort(([a], [b]) => a.localeCompare(b))
  );

const printTable = (keys: string[]) => {
  const ratio = (value: number, total: number) => `${value}/${total}`;
  const rows = keys.map((key) => {
    const { score, questions } = results[key];
    const floor = baseline[key];
    const moved = floor
      ? HIGHER_IS_BETTER.some((metric) => score[metric] > floor[metric]) ||
        score.enTrop < floor.enTrop
      : true;
    return {
      document: key,
      trouvees: ratio(score.trouvees, score.attendues),
      titres: ratio(score.titresComplets, score.attendues),
      numeros: ratio(score.numeros, score.numerosAttendus),
      axe: ratio(score.bonAxe, score.attendues),
      chemin: ratio(score.bonChemin, score.attendues),
      enTrop: score.enTrop,
      axes: ratio(score.axesTrouves, score.axesAttendus),
      libellesAxes: ratio(score.axesComplets, score.axesAttendus),
      questions: questions.join(', '),
      seuil: floor ? (moved ? 'à relever' : '') : 'nouveau',
    };
  });
  console.table(rows);
};
