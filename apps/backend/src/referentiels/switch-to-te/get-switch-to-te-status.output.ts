import { referentielIdEnumValues } from '@tet/domain/referentiels';
import { z } from 'zod';

const switchToTeBlockerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('COT_ACTIVE') }),
  z.object({ type: z.literal('COLLECTIVITE_IS_SYNDICAT') }),
  z.object({
    type: z.literal('AUDIT_IN_PROGRESS'),
    referentiel: z.enum(referentielIdEnumValues),
  }),
  z.object({
    type: z.literal('AUDIT_REQUEST_IN_PROGRESS'),
    referentiel: z.enum(referentielIdEnumValues),
  }),
]);

export const switchToTeStatusOutputSchema = z.discriminatedUnion('value', [
  z.object({ value: z.literal('CAN_SWITCH') }),
  z.object({ value: z.literal('NOT_ELIGIBLE') }),
  z.object({ value: z.literal('UNAUTHORIZED') }),
  z.object({
    value: z.literal('ALREADY_SWITCHED'),
    populatedAt: z.iso.datetime(),
  }),
  z.object({
    value: z.literal('BLOCKED'),
    blockers: z.array(switchToTeBlockerSchema),
  }),
]);

export type SwitchToTeStatus = z.infer<typeof switchToTeStatusOutputSchema>;
