import { isEqual } from 'es-toolkit';
import { z } from 'zod';

/**
 * Le niveau du document qui devient l'action : la fiche (« Fiche action
 * n°1.2 »), ses étapes (« Action 1 – … ») devenant des sous-actions ; ou
 * l'étape, la fiche devenant un sous-axe.
 */
export const actionLevelValues = ['fiche', 'etape'] as const;
export const actionLevelSchema = z.enum(actionLevelValues);
export type ActionLevel = z.output<typeof actionLevelSchema>;

const documentLevelSchema = z.object({
  /** Un titre réel du document à ce niveau. */
  exampleTitle: z.string(),
  /** Page affichée, à partir de 1. */
  examplePage: z.number().int().positive(),
  count: z.number().int().nonnegative(),
});

/**
 * D'où viennent les étapes : titrées « Action 1 – … » dans une fiche nommée
 * (`fiche`, ou absent), ou énumérées « A – … » ou en puces sous le titre qui
 * les regroupe (`enumeration`, une mesure, un groupe d'actions).
 */
export const etapesFromValues = ['fiche', 'enumeration'] as const;
export type EtapesFrom = (typeof etapesFromValues)[number];

export const actionLevelDoubtSchema = z.object({
  kind: z.literal('action-level'),
  etapesFrom: z.enum(etapesFromValues).optional(),
  axes: documentLevelSchema.nullable(),
  fiches: documentLevelSchema,
  /** Les fiches qui détaillent des étapes : lues à l'étape, elles deviennent des sous-axes. */
  fichesWithEtapes: z.number().int().nonnegative(),
  etapes: documentLevelSchema,
  proposed: actionLevelSchema,
});

export type ActionLevelDoubt = z.output<typeof actionLevelDoubtSchema>;

/**
 * Les thèmes écrits au-dessus des fiches qu'une page de synthèse réunit : un
 * axe par thème de la synthèse (`grouped`), ou un par thème des fiches.
 */
export const themeGroupingValues = ['grouped', 'separate'] as const;
export const themeGroupingSchema = z.enum(themeGroupingValues);
export type ThemeGrouping = z.output<typeof themeGroupingSchema>;

const pageSchema = z.number().int().positive();

export const themeGroupSchema = z.object({
  /** Le libellé de la synthèse qui réunit les variantes, tel qu'écrit. */
  label: z.string(),
  labelPage: pageSchema,
  /** Dans l'ordre du document. */
  variants: z
    .array(
      z.object({
        /** Le thème tel qu'écrit au-dessus de ses fiches. */
        theme: z.string(),
        fiches: z.number().int().positive(),
        exampleTitle: z.string(),
        page: pageSchema,
      })
    )
    .min(2),
});

export type ThemeGroup = z.output<typeof themeGroupSchema>;

export const themeGroupingDoubtSchema = z.object({
  kind: z.literal('theme-grouping'),
  groups: z.array(themeGroupSchema).min(1),
  proposed: themeGroupingSchema,
});

export type ThemeGroupingDoubt = z.output<typeof themeGroupingDoubtSchema>;

/**
 * Les actions qu'un tableau récapitulatif liste sans fiche qui les détaille :
 * toutes créées, avec leur seul titre (`all`), ou seulement celles qui ont
 * une fiche.
 */
export const actionsWithoutFicheValues = ['all', 'with-fiche'] as const;
export const actionsWithoutFicheSchema = z.enum(actionsWithoutFicheValues);
export type ActionsWithoutFiche = z.output<typeof actionsWithoutFicheSchema>;

export const actionsWithoutFicheDoubtSchema = z.object({
  kind: z.literal('actions-without-fiche'),
  /** Les actions numérotées des récapitulatifs, chacune une fois. */
  listed: z.number().int().positive(),
  withFiche: z.number().int().nonnegative(),
  withoutFiche: z.number().int().positive(),
  /** Une action listée sans fiche, telle qu'écrite. */
  example: z.object({ title: z.string(), page: pageSchema }),
  tablePages: z.array(pageSchema).min(1),
  proposed: actionsWithoutFicheSchema,
});

export type ActionsWithoutFicheDoubt = z.output<
  typeof actionsWithoutFicheDoubtSchema
>;

/** Un doute relevé à la lecture : chaque sorte rejoint l'union. */
export const importDoubtSchema = z.discriminatedUnion('kind', [
  actionLevelDoubtSchema,
  themeGroupingDoubtSchema,
  actionsWithoutFicheDoubtSchema,
]);

export type ImportDoubt = z.output<typeof importDoubtSchema>;
export type ImportDoubtKind = ImportDoubt['kind'];

/** Le choix de l'utilisateur pour un doute, de la même sorte. */
export const importChoiceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('action-level'), actionLevel: actionLevelSchema }),
  z.object({
    kind: z.literal('theme-grouping'),
    grouping: themeGroupingSchema,
  }),
  z.object({
    kind: z.literal('actions-without-fiche'),
    actions: actionsWithoutFicheSchema,
  }),
]);

export type ImportChoice = z.output<typeof importChoiceSchema>;

const hasUniqueKinds = (items: { kind: string }[]): boolean =>
  new Set(items.map(({ kind }) => kind)).size === items.length;

export const importDoubtsSchema = z
  .array(importDoubtSchema)
  .min(1)
  .refine(hasUniqueKinds, { message: 'Un seul doute par sorte' });

export const importChoicesSchema = z
  .array(importChoiceSchema)
  .min(1)
  .refine(hasUniqueKinds, { message: 'Un seul choix par sorte' });

const currentImportQuestionSchema = z.object({
  doubts: importDoubtsSchema,
  answer: z
    .object({
      choices: importChoicesSchema,
      answeredBy: z.string(),
      answeredAt: z.string(),
    })
    .nullable(),
});

/** Les précisions demandées ensemble après la lecture, et la réponse à toutes. */
export type ImportQuestion = z.output<typeof currentImportQuestionSchema>;

// Les imports mis en attente avant les questions multiples gardent un seul
// doute, la réponse à plat : ils se lisent sous la forme actuelle.
const legacyImportQuestionSchema = actionLevelDoubtSchema
  .extend({
    answer: z
      .object({
        actionLevel: actionLevelSchema,
        answeredBy: z.string(),
        answeredAt: z.string(),
      })
      .nullable(),
  })
  .transform(
    ({ answer, ...doubt }): ImportQuestion => ({
      doubts: [doubt],
      answer: answer && {
        choices: [{ kind: 'action-level', actionLevel: answer.actionLevel }],
        answeredBy: answer.answeredBy,
        answeredAt: answer.answeredAt,
      },
    })
  );

export const importQuestionSchema = z.union([
  currentImportQuestionSchema,
  legacyImportQuestionSchema,
]);

/** La colonne telle qu'elle peut être en base, ancienne forme comprise. */
export type StoredImportQuestion = z.input<typeof importQuestionSchema>;

export const readImportQuestion = (stored: unknown): ImportQuestion | null => {
  const parsed = importQuestionSchema.safeParse(stored);
  return parsed.success ? parsed.data : null;
};

/** Une réponse tranche chaque doute posé, et lui seul. */
export const answersEveryDoubt = (
  doubts: ImportDoubt[],
  choices: ImportChoice[]
): boolean =>
  hasUniqueKinds(choices) &&
  choices.length === doubts.length &&
  doubts.every((doubt) => choices.some(({ kind }) => kind === doubt.kind));

/** Ce qu'obtient l'utilisateur qui continue sans rien changer. */
export const proposedChoiceOf = (doubt: ImportDoubt): ImportChoice => {
  switch (doubt.kind) {
    case 'action-level':
      return { kind: 'action-level', actionLevel: doubt.proposed };
    case 'theme-grouping':
      return { kind: 'theme-grouping', grouping: doubt.proposed };
    case 'actions-without-fiche':
      return { kind: 'actions-without-fiche', actions: doubt.proposed };
  }
};

/** Les sortes dont le choix s'écarte de celui proposé. */
export const changedKindsOf = (
  doubts: ImportDoubt[],
  choices: ImportChoice[]
): ImportDoubtKind[] =>
  choices
    .filter((choice) => {
      const doubt = doubts.find(({ kind }) => kind === choice.kind);
      return doubt !== undefined && !isEqual(proposedChoiceOf(doubt), choice);
    })
    .map(({ kind }) => kind);

/**
 * Les choix tels que la lecture et les consignes les appliquent. La consigne
 * du niveau de l'action dépend aussi de ce qui porte les étapes, et le
 * regroupement des thèmes de ses groupes : le doute les donne.
 */
export type ReadingChoices = {
  actionLevel?: ActionLevel;
  etapesFrom?: EtapesFrom;
  themeGrouping?: { grouping: ThemeGrouping; groups: ThemeGroup[] };
  actionsWithoutFiche?: ActionsWithoutFiche;
};

export const toReadingChoices = (
  doubts: ImportDoubt[],
  choices: ImportChoice[]
): ReadingChoices =>
  choices.reduce<ReadingChoices>((readingChoices, choice) => {
    switch (choice.kind) {
      case 'action-level': {
        const etapesFrom = doubts.find(
          (doubt) => doubt.kind === 'action-level'
        )?.etapesFrom;
        return {
          ...readingChoices,
          actionLevel: choice.actionLevel,
          ...(etapesFrom ? { etapesFrom } : {}),
        };
      }
      case 'theme-grouping': {
        const doubt = doubts.find(
          (doubt): doubt is ThemeGroupingDoubt =>
            doubt.kind === 'theme-grouping'
        );
        return doubt
          ? {
              ...readingChoices,
              themeGrouping: {
                grouping: choice.grouping,
                groups: doubt.groups,
              },
            }
          : readingChoices;
      }
      case 'actions-without-fiche':
        return { ...readingChoices, actionsWithoutFiche: choice.actions };
    }
  }, {});

/** Ce qu'obtient l'utilisateur qui continue sans rien changer. */
export const proposedReadingChoices = (doubts: ImportDoubt[]): ReadingChoices =>
  toReadingChoices(doubts, doubts.map(proposedChoiceOf));
