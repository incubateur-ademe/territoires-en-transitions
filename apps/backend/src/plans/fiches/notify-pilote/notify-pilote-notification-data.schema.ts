import { z } from 'zod';

/** Format des données pour le champ `notificationData`  */
export const onUpdateFichePiloteNotificationDataSchema = z.object({
  ficheIds: z.array(z.number()),
  piloteId: z.uuid(),
});
export type OnUpdateFichePiloteNotificationData = z.infer<
  typeof onUpdateFichePiloteNotificationDataSchema
>;
