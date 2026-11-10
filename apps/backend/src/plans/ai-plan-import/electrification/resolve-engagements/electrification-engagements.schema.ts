import { StatutEnum } from '@tet/domain/plans';
import { z } from 'zod';
import { engagementImportSchema } from '../../models/engagement-import.schema';
import { ImportReport } from '../../models/import-report';
import {
  ImportSource,
  importSourceSchema,
} from '../../models/import-source.schema';

/** Contrat documentaire : aucun identifiant de base de données fourni par le LLM. */
export const resolveElectrificationEngagementsInputSchema = z.strictObject({
  collectiviteId: z.number().int().positive(),
  catalogueVersion: z.string().trim().min(1),
  engagements: z.array(engagementImportSchema),
  /** Axes explicitement demandés par les fiches actions, sans engagement implicite. */
  axes: z.array(
    z.strictObject({
      source: importSourceSchema,
      numero: z.number().int().positive().nullable(),
      titre: z.string().trim().min(1),
      sousAxes: z.array(
        z.strictObject({
          source: importSourceSchema,
          numero: z.string().trim().min(1).nullable(),
          titre: z.string().trim().min(1),
        })
      ),
    })
  ),
});

export type ElectrificationEngagementsInput = z.infer<
  typeof resolveElectrificationEngagementsInputSchema
>;

export type ResolvedElectrificationAxe = {
  key: string;
  parentKey: string | null;
  numero: string | null;
  titre: string;
  sources: ImportSource[];
};

export type ResolvedElectrificationEngagements = {
  catalogueVersion: string;
  axes: ResolvedElectrificationAxe[];
  engagements: {
    code: string;
    axeKey: string;
    source: ImportSource;
  }[];
  fichesEngagements: {
    key: string;
    axeKey: string;
    engagementCode: string;
    titre: string;
    statut: typeof StatutEnum.A_VENIR;
    source: ImportSource;
  }[];
  cibles: {
    key: string;
    axeKey: string;
    engagementCode: string;
    indicateurId: number;
    identifiantReferentiel: string;
    unite: string;
    periodicite: 'annuelle';
    dateValeur: string;
    objectif: number | null;
    source: ImportSource;
  }[];
  report: ImportReport;
};
