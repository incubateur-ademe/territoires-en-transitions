import { Statut, ficheSchema } from '@tet/domain/plans';
import {
  ficheImportSchema,
  importReferenceSchema,
  PreparedFiche,
  PreparedFicheCreate,
} from '../../prepare-fiche/prepare-fiche.schema';
import {
  IndicateurPeriodicite,
  IndicateurValeur,
} from '@tet/domain/indicateurs';
import { nonBlankTextSchema } from '@tet/domain/shared';
import { z } from 'zod';
import {
  ImportSource,
  importSourceSchema,
} from '../../models/import-source.schema';
import {
  resolveElectrificationEngagementsInputSchema,
  ResolvedElectrificationEngagements,
} from '../resolve-engagements/electrification-engagements.schema';

const valeurSchema = z.strictObject({
  valeur: z.number().nullable(),
  periode: z.nullable(nonBlankTextSchema),
});
const indicateurBase = {
  source: importSourceSchema,
  reference: importReferenceSchema,
  titre: z.nullable(nonBlankTextSchema),
};
export const electrificationIndicateurInputSchema = z.discriminatedUnion(
  'type',
  [
    z.strictObject({
      ...indicateurBase,
      type: z.literal('quantitatif'),
      unite: z.nullable(nonBlankTextSchema),
      periodicite: z.nullable(nonBlankTextSchema),
      resultat: valeurSchema,
      objectif: valeurSchema,
    }),
    z.strictObject({
      ...indicateurBase,
      type: z.literal('booleen'),
      titre: ficheSchema.shape.titre.unwrap().trim().min(1).nullable(),
      resultat: z.boolean().nullable(),
      anneeResultat: z.number().int().min(1).max(9999).nullable(),
      objectif: z.boolean().nullable(),
      anneeObjectif: z.number().int().min(1).max(9999).nullable(),
    }),
  ]
);
export const resolveElectrificationFichesInputSchema =
  resolveElectrificationEngagementsInputSchema.extend({
    fiches: z.array(
      ficheImportSchema.extend({
        indicateurs: z.array(electrificationIndicateurInputSchema),
      })
    ),
  });
export type ElectrificationFichesInput = z.infer<
  typeof resolveElectrificationFichesInputSchema
>;
export type ElectrificationFicheInput =
  ElectrificationFichesInput['fiches'][number];
export type ElectrificationIndicateurInput = z.infer<
  typeof electrificationIndicateurInputSchema
>;
export type PreparedElectrificationIndicateurValeur = Pick<
  IndicateurValeur,
  'dateValeur' | 'resultat' | 'objectif'
>;
export type PreparedElectrificationIndicateur =
  | { mode: 'link'; source: ImportSource; indicateurId: number }
  | {
      mode: 'catalogue' | 'create';
      source: ImportSource;
      code: string | null;
      indicateurId: number | null;
      titre: string;
      unite: string;
      periodicite: IndicateurPeriodicite;
      valeurs: PreparedElectrificationIndicateurValeur[];
    }
  | {
      mode: 'sous-action';
      source: ImportSource;
      code: string | null;
      titre: string;
      statut: Statut;
      dateFin: string | null;
      observation: {
        resultat: boolean | null;
        anneeResultat: number | null;
        objectif: boolean | null;
        anneeObjectif: number | null;
      };
    };
export type PreparedElectrificationFiche =
  | Extract<PreparedFiche, { mode: 'link' }>
  | (PreparedFicheCreate & {
      indicateurs: PreparedElectrificationIndicateur[];
    });
export type ResolvedElectrificationFiches =
  ResolvedElectrificationEngagements & {
    fiches: PreparedElectrificationFiche[];
  };
