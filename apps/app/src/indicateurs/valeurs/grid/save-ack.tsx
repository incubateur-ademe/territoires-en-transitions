import { Icon } from '@tet/ui';
import { JSX } from 'react';

/**
 * Repère visuel seulement : c'est le badge d'enregistrement de la grille qui
 * annonce la sauvegarde aux lecteurs d'écran, une seule fois par écriture.
 */
export const SaveAck = (): JSX.Element => (
  <span
    aria-hidden
    className="pointer-events-none absolute right-1 text-success-1"
  >
    <Icon icon="check-line" size="sm" />
  </span>
);
