import * as z from 'zod/mini';
import { isIndicateurPeriodeError } from './indicateur-periode.errors';
import type {
  IndicateurPeriode,
  IndicateurPeriodeJson,
} from './indicateur-periode.types';
import { IndicateurPeriodes } from './indicateur-periodes';

const indicateurPeriodeJsonSchema = z.object({
  periodicite: z.enum(IndicateurPeriodes.supportedPeriodicites),
  dateDebut: z.string(),
});

/** Validates and rehydrates a period received through a JSON boundary. */
export const indicateurPeriodeSchema: z.ZodMiniType<
  IndicateurPeriode,
  IndicateurPeriodeJson
> = z.pipe(
  indicateurPeriodeJsonSchema,
  z.transform((value, context): IndicateurPeriode => {
    try {
      return IndicateurPeriodes.fromDateValeur(value.periodicite, value.dateDebut);
    } catch (error) {
      context.issues.push({
        code: 'custom',
        input: value,
        message: error instanceof Error ? error.message : String(error),
        ...(isIndicateurPeriodeError(error)
          ? { params: { code: error.code, details: error.details } }
          : {}),
      });
      return z.NEVER;
    }
  })
);
