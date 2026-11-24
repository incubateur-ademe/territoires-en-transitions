import { z } from 'zod';
import type { ElectrificationDocumentSource } from './electrification-extraction.schema';
import type {
  ElectrificationEngagementInterpretation,
  ElectrificationEngagementMatchRequest,
} from './electrification-engagement-interpretation.schema';

const interpretedValueSchema = z.strictObject({
  key: z.string().min(1),
  numberId: z.number().int().nonnegative(),
  unit: z.string().min(1).nullable(),
  yearId: z.number().int().nonnegative().nullable(),
  quote: z.string().min(1),
});

/** Le modèle affecte les occurrences du document à leurs rôles, sans produire de nombre. */
const interpretedValuesSchema = z.strictObject({
  status: z.enum(['extracted', 'unresolved']),
  values: z.array(interpretedValueSchema).max(100),
});
const valueRejectionSchema = z.strictObject({
  reason: z.enum([
    'approximation',
    'ambiguity',
    'contradiction',
    'condition',
    'instruction',
  ]),
  quote: z.string().min(1),
});
export type ElectrificationValueRejection = z.infer<
  typeof valueRejectionSchema
>;

/** Le refus sert au diagnostic ; seules les valeurs justifiées sont conservées en checkpoint. */
export const electrificationValueResponseSchema = interpretedValuesSchema
  .extend({ rejection: valueRejectionSchema.nullable() })
  .refine(({ status, values, rejection }) =>
    status === 'extracted'
      ? rejection === null
      : rejection !== null && values.length === 0
  );
export type ElectrificationInterpretedValue = {
  key: string;
  value: number;
  unit: string | null;
  year: number | null;
};

export const electrificationValueInterpretationSchema =
  interpretedValuesSchema.extend({ sourceId: z.string().min(1) });
export type ElectrificationValueInterpretation = z.infer<
  typeof electrificationValueInterpretationSchema
>;

export type ElectrificationValueRequest = {
  source: ElectrificationDocumentSource;
  label: string;
  unit: string | null;
  year: number | null;
} & (
  | {
      kind: 'target';
      keys: string[];
      targets: {
        key: string;
        unit: string;
        year: number;
        ceilingKey: string | null;
        labels: string[];
        units: string[];
      }[];
    }
  | { kind: 'observation'; keys: ['valeur'] }
);

/** Contexte interne de lecture des cellules numériques et de rapprochement des engagements. */
export type ElectrificationValueContext = {
  engagementInterpretations?: ElectrificationEngagementInterpretation[];
  onUnmatchedEngagement?: (
    request: ElectrificationEngagementMatchRequest
  ) => void;
  interpretations?: ElectrificationValueInterpretation[];
  onUnparsedValue?: (request: ElectrificationValueRequest) => void;
};
