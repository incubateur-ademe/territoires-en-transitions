import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { collectiviteRoleEnumValues } from '@tet/domain/users';
import { z } from 'zod';

/**
 * Une ligne du fichier de correspondants, tel que le métier le fournit.
 *
 * Un seul en-tête sert les six familles de services : les colonnes de clé sont
 * toutes déclarées, et le `type` dit laquelle fait foi (cf. `resolve-service.rules`).
 * Les colonnes absentes du fichier valent chaîne vide.
 */
export const correspondantCsvSchema = z.object({
  type: z.enum(collectiviteTypeEnum),
  region_code: z.string().trim().prefault(''),
  departement_code: z.string().trim().prefault(''),
  siret: z
    .string()
    .trim()
    .transform((siret) => siret.replace(/\s/g, ''))
    .prefault(''),
  /** Colonne de contrôle : relue et comparée au nom en base, jamais une clé. */
  nom: z.string().trim().prefault(''),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.email({
        pattern: z.regexes.unicodeEmail,
        error: 'Adresse électronique invalide',
      })
    ),
  /** Vide vaut `admin` : la liste est réputée certifiée (TETH-4). */
  role: z
    .string()
    .trim()
    .prefault('')
    .transform((role) => (role === '' ? undefined : role))
    .pipe(z.enum(collectiviteRoleEnumValues).optional()),
});

export type CorrespondantCsv = z.infer<typeof correspondantCsvSchema>;

export const CORRESPONDANT_CSV_PARSE_OPTIONS = {
  delimiter: ';',
  columns: true,
  skip_empty_lines: true,
  trim: true,
  /** Porte le numéro de ligne physique, seul repère utile dans un rapport. */
  info: true,
} as const;

export type LigneCsvBrute = {
  record: Record<string, string>;
  info: { lines: number };
};
