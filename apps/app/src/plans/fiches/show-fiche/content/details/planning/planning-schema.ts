import type { TempsDeMiseEnOeuvre } from '@tet/domain/shared';
import isBefore from 'date-fns/isBefore';
import { z } from 'zod';

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
