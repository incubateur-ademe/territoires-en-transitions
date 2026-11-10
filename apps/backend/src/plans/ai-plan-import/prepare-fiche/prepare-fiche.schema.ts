import { FicheImportFields, ficheImportFieldsSchema } from '@tet/domain/plans';
import { nonBlankTextSchema } from '@tet/domain/shared';
import { z } from 'zod';
import {
  ImportSource,
  importSourceSchema,
} from '../models/import-source.schema';

export const importReferenceSchema = z
  .string()
  .trim()
  .nullable()
  .transform((value) => value || null);

/** Données documentaires communes ; aucun identifiant de base fourni par l'extracteur. */
export const ficheImportSchema = z.strictObject({
  source: importSourceSchema,
  axeSourceKey: nonBlankTextSchema,
  reference: importReferenceSchema,
  champs: ficheImportFieldsSchema,
  sousActions: z.array(
    z.strictObject({
      source: importSourceSchema,
      reference: importReferenceSchema,
      champs: ficheImportFieldsSchema,
    })
  ),
});

/** Le profil a déjà validé le code et sélectionné ses compléments. */
export type ResolvedSousActionImport = {
  source: ImportSource;
  code: string | null;
  champs: FicheImportFields;
  defaults: FicheImportFields;
};

export type PrepareFicheInput = {
  source: ImportSource;
  axeKey: string;
  code: string | null;
  champs: FicheImportFields;
  defaults: FicheImportFields;
  sousActions: ResolvedSousActionImport[];
  complements: { code: string; champs: FicheImportFields }[];
};

export type PreparedSousAction = {
  key: string;
  code: string | null;
  champs: FicheImportFields;
  source: ImportSource;
};

/** Une fiche existante transporte uniquement son lien, sans champs à modifier. */
export type PreparedFiche = {
  key: string;
  axeKey: string;
  source: ImportSource;
} & (
  | { mode: 'link'; ficheId: number }
  | {
      mode: 'create';
      code: string | null;
      champs: FicheImportFields;
      sousActions: PreparedSousAction[];
    }
);

export type PreparedFicheCreate = Extract<PreparedFiche, { mode: 'create' }>;
