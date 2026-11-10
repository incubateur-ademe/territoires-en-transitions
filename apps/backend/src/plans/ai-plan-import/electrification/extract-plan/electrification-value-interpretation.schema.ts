import { z } from 'zod';
import type { ElectrificationDocumentSource } from './electrification-extraction.schema';

const interpretedValueSchema = z.strictObject({
  key: z.string().min(1),
  number: z.string().min(1),
  unit: z.string().min(1).nullable(),
  year: z.string().min(1).nullable(),
  quote: z.string().min(1),
});

/** Des littéraux du document, jamais une valeur calculée ou une unité déduite. */
export const electrificationValueResponseSchema = z.strictObject({
  values: z.array(interpretedValueSchema).max(2),
});
export type ElectrificationValueResponse = z.infer<
  typeof electrificationValueResponseSchema
>;

export const electrificationValueInterpretationSchema =
  electrificationValueResponseSchema.extend({ sourceId: z.string().min(1) });
export type ElectrificationValueInterpretation = z.infer<
  typeof electrificationValueInterpretationSchema
>;

export type ElectrificationValueRequest = {
  source: ElectrificationDocumentSource;
  label: string;
  unit: string | null;
  year: number | null;
} & (
  | { kind: 'target'; keys: ('principale' | 'total' | 'rapides')[] }
  | { kind: 'observation'; keys: ['valeur'] }
);

/** Contexte interne : seuls les lecteurs de cellules numériques y accèdent. */
export type ElectrificationValueContext = {
  interpretations?: ElectrificationValueInterpretation[];
  onUnparsedValue?: (request: ElectrificationValueRequest) => void;
};
