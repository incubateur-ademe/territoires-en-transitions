import { TagEnum } from '@/backend/collectivites/tags/tag.table-base';
import { FicheImport } from '@/backend/plans/fiches/import/import-plan.dto';
import {
  ciblesEnumValues,
  participationCitoyenneEnumValues,
  prioriteEnumValues,
  statutsEnumValues,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { getFuse } from '@/backend/utils/fuse/fuse.utils';
import { z } from 'zod';

// Regex patterns from ImportPlanCleanService
const regexEspace = /\\t|\\r|\\n/;
const regexSplit = /,(?![^()]*\))(?=(?:(?:[^"]*"){2})*[^"]*$)(?![^«]*»)/;
const regexOrderedList = /^ *(\d+\.) *(.*)$/gm;
const regexBulletsList = /^( *)- *(.*)$/gm;

// Priority level synonyms
const niveauxPrioritesSynonyme: Record<string, string> = {
  Bas: 'Bas',
  Moyen: 'Moyen',
  Eleve: 'Élevé',
};

// Helper to clean text exactly like ImportPlanCleanService
const cleanText = (
  text: string | null | undefined,
  title = false
): string | undefined => {
  if (!text) return undefined;
  return String(
    title
      ? String(text).replace(regexEspace, ' ')
      : String(text)
          .replaceAll(regexOrderedList, '$1 $2')
          .replaceAll(regexBulletsList, '$1- $2')
  ).trim();
};

// Helper for fuzzy matching enums
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

const textSchema = z.string().transform((val) => cleanText(val, true));

const optionalTextSchema = textSchema.optional();
// Number schema with exact cleaning from ImportPlanCleanService
const numberSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    const num = parseInt(val);
    if (isNaN(num)) {
      throw new Error(
        `Le montant "${val}" est incorrect, les montants ne doivent contenir que des chiffres.`
      );
    }
    return num;
  });

// Boolean schema matching ImportPlanCleanService
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

// Date schema matching ImportPlanCleanService
const dateSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    let d = new Date(val);
    if (d.toString() === 'Invalid Date') {
      const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = val.match(regex);
      if (match) {
        const [, day, month, year] = match;
        const invertedDate = `${month}/${day}/${year}`;
        d = new Date(invertedDate);
      }
    }
    if (d.toString() === 'Invalid Date') {
      throw new Error(`La date "${val}" n'est pas valide.`);
    }
    const isoString = d.toISOString();
    if (isoString.substring(0, 10) === '1970-01-01') {
      return undefined;
    }
    return isoString;
  });

// List schema with complex separator from ImportPlanCleanService
const listSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    return String(val)
      .split(regexSplit)
      .map((item) => item.trim())
      .filter(Boolean);
  });

// Tag schema
export const tagSchema = z.object({
  nom: z.string(),
  type: z.nativeEnum(TagEnum),
  id: z.number().optional(),
});

// Person schema
export const personSchema = z.object({
  userId: z.string().optional(),
  tag: tagSchema.optional(),
});

// Financeur schema
export const financeurSchema = z.object({
  tag: tagSchema,
  montant: z.number(),
});

// Base schema for all imports
export const importSchema = z.object({
  // Text fields with proper cleaning
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

  // Numbers with strict validation
  budget: numberSchema,

  // Booleans with French variants
  ameliorationContinue: booleanSchema,

  // Dates with multiple formats
  dateDebut: dateSchema,
  dateFin: dateSchema,

  // Lists with tag creation/reuse
  structures: listSchema.transform((items) => {
    if (!items) return [];
    const tags: z.infer<typeof tagSchema>[] = [];

    for (const item of items) {
      const cleaned = cleanText(item, true);
      if (cleaned) {
        tags.push({
          nom: cleaned,
          type: TagEnum.Structure,
        });
      }
    }
    return tags;
  }),

  partenaires: listSchema.transform((items) => {
    if (!items) return [];
    const tags: z.infer<typeof tagSchema>[] = [];

    for (const item of items) {
      const cleaned = cleanText(item, true);
      if (cleaned) {
        tags.push({
          nom: cleaned,
          type: TagEnum.Partenaire,
        });
      }
    }
    return tags;
  }),

  services: listSchema.transform((items) => {
    if (!items) return [];
    const tags: z.infer<typeof tagSchema>[] = [];

    for (const item of items) {
      const cleaned = cleanText(item, true);
      if (cleaned) {
        tags.push({
          nom: cleaned,
          type: TagEnum.Service,
        });
      }
    }
    return tags;
  }),

  // Enums with fuzzy matching
  statut: z
    .string()
    .optional()
    .transform(async (val) => {
      return await fuzzyMatchEnum(val, statutsEnumValues);
    }),

  priorite: z
    .string()
    .optional()
    .transform(async (val) => {
      const result = await fuzzyMatchEnum(
        val,
        prioriteEnumValues,
        niveauxPrioritesSynonyme
      );
      return result as 'Élevé' | 'Moyen' | 'Bas' | undefined;
    }),

  participation: z
    .string()
    .optional()
    .transform(async (val) => {
      return await fuzzyMatchEnum(val, participationCitoyenneEnumValues);
    }),

  cible: z
    .string()
    .optional()
    .transform(async (val) => {
      return await fuzzyMatchEnum(val, ciblesEnumValues);
    }),

  // Complex fields with member lookup and fuzzy matching
  pilotes: listSchema.transform((items) => {
    if (!items) return [];
    const persons: z.infer<typeof personSchema>[] = [];

    for (const item of items) {
      const cleaned = cleanText(item);
      if (cleaned && !cleaned.match(regexSplit)) {
        persons.push({
          tag: {
            nom: cleaned,
            type: TagEnum.Personne,
          },
        });
      }
    }
    return persons;
  }),

  referents: listSchema.transform((items) => {
    if (!items) return [];
    const persons: z.infer<typeof personSchema>[] = [];

    for (const item of items) {
      const cleaned = cleanText(item);
      if (cleaned && !cleaned.match(regexSplit)) {
        persons.push({
          tag: {
            nom: cleaned,
            type: TagEnum.Personne,
          },
        });
      }
    }
    return persons;
  }),

  financeurs: z.array(financeurSchema).default([]),

  // Not handled in import
  indicateurs: z.undefined(),
  actions: z.undefined(),
  fiches: z.undefined(),
  notesSuivi: z.undefined(),
  etapes: z.undefined(),
  annexes: z.undefined(),
});

// Type inference
export type ImportSchema = z.infer<typeof importSchema>;

// Helper function to parse raw data
export const parseImportData = async (data: unknown): Promise<FicheImport> => {
  const result = await importSchema.safeParseAsync(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    throw new Error(
      `Validation failed:\n${errors
        .map((e) => `${e.path}: ${e.message}`)
        .join('\n')}`
    );
  }

  return result.data;
};
