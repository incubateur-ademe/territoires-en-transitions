import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TagEnum } from '@tet/domain/collectivites';
import {
  cibleEnumValues,
  participationCitoyenneEnumValues,
  Priorite,
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

const fuzzyMatchEnum = <T extends string>(
  value: string | undefined,
  enumValues: readonly T[],
  synonyms?: Record<string, T>
): T | undefined => {
  if (!value) return undefined;
  const cleaned = cleanText(value);
  if (!cleaned) return undefined;

  const fuse = new Fuse(enumValues);
  const found = fuse.search(cleaned)?.[0]?.item;

  if (!found) return undefined;
  return (synonyms?.[found] ?? found) as T;
};

const titleSchema = z
  .preprocess(
    richTextPreprocessor,
    z.string({ message: 'Un texte est attendu' })
  )
  .transform((val) => cleanTitle(val));

const optionalTextSchema = z
  .preprocess(
    richTextPreprocessor,
    z.union([z.string(), z.null(), z.undefined()])
  )
  .optional()
  .transform((val) => (val ? cleanText(val) : undefined));

const numberSchema = z.coerce
  .number({ message: 'Un nombre est attendu' })
  .optional();

const dateSchema = z.coerce.date().optional();

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
  montant: z.number(),
});

export const importFicheInputSchema = z.object({
  id: z.number().optional(),
  axisPath: z.array(z.string()).optional(),
  titre: titleSchema.pipe(
    z.string().min(1, { message: 'Le titre est obligatoire' })
  ),
  description: optionalTextSchema,
  gouvernance: optionalTextSchema,
  objectifs: optionalTextSchema,
  resources: optionalTextSchema,
  financements: optionalTextSchema,
  calendrier: optionalTextSchema,
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
    .transform((val) => fuzzyMatchEnum<Priorite>(val, prioriteEnumValues)),

  participation: z
    .string()
    .optional()
    .transform((val) => fuzzyMatchEnum(val, participationCitoyenneEnumValues)),

  cible: z
    .string()
    .optional()
    .transform((val) => fuzzyMatchEnum(val, cibleEnumValues)),
  status: z
    .string()
    .optional()
    .transform((val) => fuzzyMatchEnum(val, statutEnumValues)),
  pilotes: listSchema,
  referents: listSchema,
  financeurs: z.array(financeurSchema).default([]),
  indicateurs: z.any(),
});

export type ImportFicheInput = z.infer<typeof importFicheInputSchema>;

export const parseImportedFiche = async (
  data: ParsedRow
): Promise<Result<ImportFicheInput, string>> => {
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

  const result = await importFicheInputSchema.safeParseAsync({
    ...data,
    financeurs: validFinanceurs,
    axisPath: hasAxes ? axisPath : undefined,
  });

  if (result.success) {
    return success(result.data);
  }

  const errors = result.error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return failure(
    errors.map((e) => `Colonne ${e.path}: ${e.message}`).join('\n')
  );
};
