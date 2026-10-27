import { Box } from '@tet/ui';
import { ReactNode } from 'react';

/**
 * Proposition : valeur hors échelle (largeur minimale de tableau)
 * Besoin : sur mobile, `Table` (`table-fixed w-full`) écrase ses colonnes
 * jusqu'à rendre les cellules illisibles. La maquette garde une largeur
 * minimale de 880px et fait défiler le tableau horizontalement dans un cadre
 * bordé. L'app le fait déjà au cas par cas (`min-w-[600px]`,
 * `min-w-[800px]` dans les tableaux budget de la fiche) : à trancher, une
 * largeur minimale portée par `Table` ou un token de largeur.
 */
export const TableScrollFrame = ({ children }: { children: ReactNode }) => (
  <Box className="overflow-x-auto rounded-lg border border-grey-3">
    <div className="min-w-[880px]">{children}</div>
  </Box>
);
