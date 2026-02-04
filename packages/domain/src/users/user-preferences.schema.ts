import * as z from 'zod/mini';

// Schéma des préférences : on veut que lors du chargement les préférences non
// définies aient toutes une valeur par défaut (voir `defaultUserPreferences`
// ci-après) afin de faciliter l'utilisation
export const userPreferencesSchema = z.object({
  utils: z.object({
    notifications: z.object({
      isNotifyPiloteActionEnabled: z.boolean(),
      isNotifyPiloteSousActionEnabled: z.boolean(),
    }),
  }),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

// Préférences par défaut : fusionnées lors du chargement avec celles
// explicitement définies par l'utilisateur pour éviter de gérer des valeurs
// optionnelles
export const defaultUserPreferences: UserPreferences = {
  utils: {
    notifications: {
      isNotifyPiloteActionEnabled: true,
      isNotifyPiloteSousActionEnabled: true,
    },
  },
} as const;
