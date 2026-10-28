import type { ReactNode } from 'react';

/**
 * Ce qu'une source de visite — un contexte où l'on consulte l'espace d'une
 * collectivité qui n'est pas la sienne — donne au cadre `VisitModeFrame`.
 */
export type VisitMode = {
  collectiviteNom: string;
  isReadOnly: boolean;
  /** Précision affichée à la suite du message. */
  notice?: ReactNode;
  backLink: {
    label: string;
    href: string;
    onClick?: () => void;
    dataTest: string;
  };
  /** Boutons secondaires, à droite avant le badge. */
  actions?: ReactNode;
  dataTest: string;
};
