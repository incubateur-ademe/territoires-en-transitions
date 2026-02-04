import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TagEnum } from '@tet/domain/collectivites';
import {
  cibleEnumValues,
  participationCitoyenneEnumValues,
  prioriteEnumValues,
  statutEnumValues,
} from '@tet/domain/plans';
import { isNil } from 'es-toolkit';
import Fuse from 'fuse.js';
import { z } from 'zod';
import { ParsedRow } from '../parsers/excel-parser';
import { deduplicateStrings } from '../utils/deduplication.utils';
import { richTextPreprocessor } from '../utils/rich-text.utils';

const regexEspace = /\\t|\\r|\\n/;

export const cleanTitle = (
  text: string | null | undefined
): string | undefined => {
  if (!text) return undefined;
  return String(text).replace(regexEspace, ' ').trim();
};
const cleanText = (text: string | null | undefined): string | undefined => {
  if (!text) return undefined;

  const regexOrderedList = /^ *(\d+\.) *(.*)$/gm;
  const regexBulletsList = /^( *)- *(.*)$/gm;

  return String(text)
    .replaceAll(regexOrderedList, '$1 $2')
    .replaceAll(regexBulletsList, '$1- $2')
    .replace(/[ \t]+/g, ' ') // Normalize multiple spaces/tabs to single space (preserve newlines)
    .trim();
};

const createFuzzyMatcher = <T extends string>(
  enumValues: readonly T[]
) => {
  const fuse = new Fuse(enumValues);
  return (value: string | undefined): T | undefined => {
    if (!value) return undefined;
    const cleaned = cleanText(value);
    if (!cleaned) return undefined;
    const found = fuse.search(cleaned)?.[0]?.item;
    return found ?? undefined;
  };
};

const matchPriorite = createFuzzyMatcher(prioriteEnumValues);
const matchParticipation = createFuzzyMatcher(participationCitoyenneEnumValues);
const matchCible = createFuzzyMatcher(cibleEnumValues);
const matchStatut = createFuzzyMatcher(statutEnumValues);

const titleSchema = z
  .preprocess(
    richTextPreprocessor,
    z.string({ message: 'Un texte est attendu' })
  )
  .transform((val) => cleanTitle(val));

const nullableTitleSchema = z
  .preprocess(
    richTextPreprocessor,
    z.union([z.string(), z.null(), z.undefined()])
  )
  .transform((val): string | null => {
    if (!val) return null;
    return cleanTitle(String(val)) || null;
  });

const optionalTextSchema = z
  .preprocess(
    richTextPreprocessor,
    z.union([z.string(), z.null(), z.undefined()])
  )
  .optional()
  .transform((val) => (val ? cleanText(val) : undefined));

const numberSchema = z
  .preprocess((val) => {
    if (val instanceof Date) return undefined;
    return val;
  }, z.coerce.number({ message: 'Un nombre est attendu' }))
  .optional();

/** Parses DD/MM/YYYY or DD-MM-YYYY (e.g. from Excel) to ISO YYYY-MM-DD so new Date() accepts it. */
const toISODateString = (val: unknown): unknown => {
  if (typeof val !== 'string' || !val.trim()) return val;
  const parts = val.trim().split(/[/-]/);
  if (parts.length !== 3) return val;
  const [d, m, y] = parts;
  if (d.length <= 2 && m.length <= 2 && y.length === 4) {
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return val;
};

const dateSchema = z
  .preprocess(
    toISODateString,
    z.coerce.date({ message: 'Une date est attendue' })
  )
  .optional();

const listSchema = z
  .preprocess(richTextPreprocessor, z.string())
  .default('')
  .transform((val) => {
    const regexSeparator =
      /,(?![^()]*\))(?=(?:(?:[^"]*"){2})*[^"]*$)(?![^«]*»)/;
    if (!val) return [];
    const items = String(val)
      .split(regexSeparator)
      .map((item) => cleanText(item))
      .filter((item): item is string => !!item);

    // Deduplicate by normalized value (case-insensitive, whitespace-normalized)
    // This prevents duplicates from Excel parsing before they reach the resolver
    return deduplicateStrings(items);
  });

export const tagSchema = z.object({
  nom: z.string(),
  type: z.enum(Object.values(TagEnum)),
  id: z.number().optional(),
});

export const financeurSchema = z.object({
  nom: z
    .string()
    .transform((val) => cleanText(val))
    .default(''),
  montant: z.number({ message: 'Un montant est attendu' }),
});

/**
 * Internal schema for parsing raw Excel data.
 * Includes sousTitreAction which is used to determine Action vs SousAction.
 */
const rawParseSchema = z.object({
  id: z.number().optional(),
  axisPath: z.array(z.string()).optional(),
  sousTitreAction: nullableTitleSchema,
  titre: titleSchema.pipe(
    z
      .string()
      .min(1, { message: 'Le titre est obligatoire' })
      .max(300, { message: 'Le titre ne peut pas dépasser 300 caractères' })
  ),
  description: optionalTextSchema,
  gouvernance: optionalTextSchema,
  objectifs: optionalTextSchema,
  resources: optionalTextSchema,
  financements: optionalTextSchema,
  notesComplementaire: optionalTextSchema,
  participationCitoyenne: optionalTextSchema,
  budget: numberSchema,
  instanceGouvernance: listSchema,

  dateDebut: dateSchema,
  dateFin: dateSchema,

  structures: listSchema,
  partenaires: listSchema,
  services: listSchema,
  priorite: z
    .string()
    .optional()
    .transform(matchPriorite),

  participation: z
    .string()
    .optional()
    .transform(matchParticipation),

  cible: z
    .string()
    .optional()
    .transform(matchCible),
  status: z
    .string()
    .optional()
    .transform(matchStatut),
  pilotes: listSchema,
  referents: listSchema,
  financeurs: z.array(financeurSchema).default([]),
  indicateurs: z.any(),
});

type RawParsedAction = z.infer<typeof rawParseSchema>;

export type ImportActionInput = Omit<RawParsedAction, 'sousTitreAction'>;

export type ImportSousActionInput = RawParsedAction & {
  parentActionTitre: string;
};

/** Discriminated union for the import pipeline. */
export type ImportActionOrSousAction =
  | ImportActionInput
  | ImportSousActionInput;

/** Type guard: checks if an action is a sous-action via presence of parentActionTitre. */
export const isSousAction = (
  input: ImportActionOrSousAction
): input is ImportSousActionInput => 'parentActionTitre' in input;

/**
 * Parses a raw Excel row into either an ImportActionInput or ImportSousActionInput.
 *
 * When sousTitreAction is present, the title swap happens here:
 * - titre becomes the sous-action's own title (from sousTitreAction column)
 * - parentActionTitre holds the parent action's title (from titre column)
 */
export const parseImportedAction = async (
  data: ParsedRow
): Promise<Result<ImportActionOrSousAction, string>> => {
  const validFinanceurs = [
    {
      nom: data.Financeur1,
      montant: data.Montant1,
    },
    {
      nom: data.Financeur2,
      montant: data.Montant2,
    },
    {
      nom: data.Financeur3,
      montant: data.Montant3,
    },
  ].filter((f) => f.nom && !isNil(f.montant));

  const axisPath = [data.Axe, data.SousAxe, data.SousSousAxe].filter(
    (a): a is string => !!a
  );

  const hasAxes = axisPath.length > 0;

  const result = await rawParseSchema.safeParseAsync({
    ...data,
    financeurs: validFinanceurs,
    axisPath: hasAxes ? axisPath : undefined,
  });

  if (result.success) {
    const parsed = result.data;
    const sousTitre = parsed.sousTitreAction;
    const { sousTitreAction: _, axisPath: parsedAxisPath, ...base } = parsed;

    if (sousTitre !== null && sousTitre.trim() !== '') {
      return success({
        ...base,
        titre: sousTitre,
        parentActionTitre: parsed.titre,
        axisPath: parsedAxisPath,
      });
    }

    return success({
      ...base,
      axisPath: parsedAxisPath,
    });
  }

  const errors = result.error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));
  return failure(
    errors
      .map(
        (e) =>
          `Action avec le titre "${data.titre}" : Colonne ${e.path}: ${e.message}`
      )
      .join('\n')
  );
};
