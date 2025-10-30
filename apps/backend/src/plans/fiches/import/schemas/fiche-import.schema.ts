import { TagEnum } from '@/backend/collectivites/tags/tag.table-base';
import { ParsedRow } from '@/backend/plans/fiches/import/parsers/excel-parser';
import {
  ciblesEnumValues,
  participationCitoyenneEnumValues,
  Priorite,
  prioriteEnumValues,
  statutsEnumValues,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { failure, Result, success } from '@/backend/shared/types/result';
import { getFuse } from '@/backend/utils/fuse/fuse.utils';
import { z } from 'zod';

const cleanText = (
  text: string | null | undefined,
  title = false
): string | undefined => {
  if (!text) return undefined;
  const regexEspace = /\\t|\\r|\\n/;

  if (title) {
    return String(text).replace(regexEspace, ' ').trim();
  }

  const regexOrderedList = /^ *(\d+\.) *(.*)$/gm;
  const regexBulletsList = /^( *)- *(.*)$/gm;

  return String(text)
    .replaceAll(regexOrderedList, '$1 $2')
    .replaceAll(regexBulletsList, '$1- $2')
    .trim();
};

const fuzzyMatchEnum = async <T extends string>(
  value: string | undefined,
  enumValues: readonly T[],
  synonyms?: Record<string, T>
): Promise<T | undefined> => {
  if (!value) return undefined;
  const cleaned = cleanText(value);
  if (!cleaned) return undefined;

  const Fuse = await getFuse();
  const fuse = new Fuse(enumValues);
  const found = fuse.search(cleaned)?.[0]?.item;

  if (!found) return undefined;
  return (synonyms?.[found] ?? found) as T;
};

const textSchema = z
  .string({ invalid_type_error: 'Un texte est attendu' })
  .transform((val) => cleanText(val, true));

const optionalTextSchema = textSchema.optional();
const numberSchema = z.coerce
  .number({ invalid_type_error: 'Un nombre est attendu' })
  .optional();

const booleanSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const s = val.toLowerCase();
      if (s === 'true' || s === 'vrai') return true;
      if (s === 'false' || s === 'faux') return false;
    }
    return undefined;
  });

const dateSchema = z.coerce.date().optional();

const listSchema = z
  .string()
  .default('')
  .transform((val) => {
    const regexSeparator =
      /,(?![^()]*\))(?=(?:(?:[^"]*"){2})*[^"]*$)(?![^«]*»)/;
    if (!val) return [];
    return String(val)
      .split(regexSeparator)
      .map((item) => cleanText(item, true))
      .filter((item): item is string => !!item);
  });

export const tagSchema = z.object({
  nom: z.string(),
  type: z.nativeEnum(TagEnum),
  id: z.number().optional(),
});

export const financeurSchema = z.object({
  nom: z
    .string()
    .transform((val) => cleanText(val, true))
    .default(''),
  montant: z.number(),
});

export const ficheImportSchema = z.object({
  id: z.number().optional(),
  axisPath: z.string().array(),
  titre: textSchema.pipe(
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
  instanceGouvernance: optionalTextSchema,

  ameliorationContinue: booleanSchema,

  dateDebut: dateSchema,
  dateFin: dateSchema,

  structures: listSchema,
  partenaires: listSchema,
  services: listSchema,
  priorite: z
    .string()
    .optional()
    .transform((val) => {
      return fuzzyMatchEnum<Priorite>(val, prioriteEnumValues);
    }),

  participation: z
    .string()
    .optional()
    .transform((val) => {
      return fuzzyMatchEnum(val, participationCitoyenneEnumValues);
    }),

  cible: z
    .string()
    .optional()
    .transform((val) => {
      return fuzzyMatchEnum(val, ciblesEnumValues);
    }),
  status: z
    .string()
    .optional()
    .transform((val) => {
      return fuzzyMatchEnum(val, statutsEnumValues);
    }),
  pilotes: listSchema,
  referents: listSchema,
  financeurs: z.array(financeurSchema).default([]),

  // References
  thematiques: listSchema,
  sousThematiques: listSchema,
  effetsAttendus: listSchema,

  // Not handled in import
  indicateurs: z.any(),
  actions: z.any(),
  fiches: z.undefined(),
  notesSuivi: z.any(),
  etapes: z.any(),
  annexes: z.any(),
});

export type FicheImport = z.infer<typeof ficheImportSchema>;

export const parseImportedFiche = async (
  data: ParsedRow
): Promise<Result<FicheImport, string>> => {
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
  ].filter((f) => f.nom && f.montant);

  const axisPath = [data.Axe, data.SousAxe, data.SousSousAxe].filter(
    (a): a is string => !!a
  );
  const result = await ficheImportSchema.safeParseAsync({
    ...data,
    financeurs: validFinanceurs,
    axisPath,
  });

  if (result.success) {
    return success(result.data);
  }

  const errors = result.error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return failure(
    errors.map((e) => `Colonne ${e.path}: ${e.message}`).join('\n')
  );
};
