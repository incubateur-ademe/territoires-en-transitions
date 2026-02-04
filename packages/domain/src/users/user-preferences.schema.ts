import * as z from 'zod/mini';

// Schéma des préférences
// On choisi de n'avoir aucune valeur optionnelle mais plutôt des valeurs par
// défaut (voir `defaultUserPreferences` ci-après) afin de ne pas introduire
// d'ambiguité entre le cas où une préférence n'est pas définie et celui où elle
// est désactivée explicitement (notamment pour les booléens)
export const userPreferencesSchema = z.object({
  utils: z.object({
    notifications: z.object({
      isNotifyPiloteActionEnabled: z.boolean(),
      isNotifyPiloteSousActionEnabled: z.boolean(),
    }),
  }),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// préférences par défaut
// fusionnées avec celles définies lors du chargement pour éviter de gérer des valeurs optionnelles
export const defaultUserPreferences: UserPreferences = {
  utils: {
    notifications: {
      isNotifyPiloteActionEnabled: true,
      isNotifyPiloteSousActionEnabled: true,
    },
  },
};
