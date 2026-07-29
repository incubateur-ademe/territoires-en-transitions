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
  // État per-utilisateur des deux surfaces qui invitent à lier une identité
  // OIDC : la bannière in-app et la modale post-connexion. Nommé `oidc` et non
  // d'après un provider — le mécanisme survivra à MonCompteAdeme.
  oidc: z.object({
    // Bannière encore affichable, ou masquée par l'utilisateur (croix).
    isBannerVisible: z.boolean(),
    // Nombre de fois où la modale a été reportée (« Plus tard »).
    modalDisplayCount: z.number(),
    // Dernier affichage de la modale — sert à ne pas la remontrer le même jour.
    modalLastSeenAt: z.nullable(z.iso.datetime()),
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
  oidc: {
    isBannerVisible: true,
    modalDisplayCount: 0,
    modalLastSeenAt: null,
  },
} as const;
