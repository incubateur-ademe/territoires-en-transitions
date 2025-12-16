import { zodResolver } from '@hookform/resolvers/zod';
import type { TempsDeMiseEnOeuvre } from '@tet/domain/shared';
import isBefore from 'date-fns/isBefore';
import { z } from 'zod';

/**
 * This wrapper is used to circumvent an issue with `refine`method from zod resolver
 * not returning the errors in the correct format for react-hook-form
 */
export const safeZodResolver = <T extends z.ZodType>(schema: T) => {
  return async (values: any, context: any, options: any) => {
    try {
      return await zodResolver(schema)(values, context, options);
    } catch (error) {
      // ZodErrors are already in the correct format for react-hook-form
      // Just return them instead of throwing
      if (error instanceof z.ZodError) {
        return {
          values: {},
          errors: error.issues.reduce((acc, issue) => {
            const path = issue.path.join('.');
            acc[path] = {
              type: issue.code,
              message: issue.message,
            };
            return acc;
          }, {} as any),
        };
      }
      throw error;
    }
  };
};

export const planningFormSchema = z
  .object({
    dateDebut: z
      .date()
      .min(new Date('1900-01-01'), {
        message: 'La date de début doit être postérieure au 1er janvier 1900',
      })
      .nullable(),
    dateFin: z
      .date()
      .min(new Date('1900-01-01'), {
        message: 'La date de fin doit être postérieure au 1er janvier 1900',
      })
      .nullable(),
    tempsDeMiseEnOeuvre: z.custom<TempsDeMiseEnOeuvre>().nullable(),
    ameliorationContinue: z.boolean().nullable(),
    calendrier: z.string().nullable(),
  })
  .refine(
    (data) => {
      if (data.ameliorationContinue === true && data.dateFin !== null) {
        return false;
      }
      return true;
    },
    {
      path: ['dateFin'],
      message:
        'La date de fin doit être vide si amélioration continue est activée',
    }
  )
  .refine(
    (data) => {
      if (data.dateDebut && data.dateFin) {
        return isBefore(data.dateDebut, data.dateFin);
      }
      return true;
    },
    {
      path: ['dateFin'],
      message: 'La date de fin doit être après la date de début',
    }
  );

export type PlanningFormValues = z.infer<typeof planningFormSchema>;
