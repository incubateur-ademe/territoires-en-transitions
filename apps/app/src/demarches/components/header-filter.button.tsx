'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';

/**
 * Le déclencheur d'un filtre de colonne : discret tant que rien n'est posé,
 * porteur du nombre de valeurs retenues ensuite.
 *
 * `filterCount` ne se déduit pas de la sélection : un filtre garni de son
 * défaut n'est pas un choix de l'utilisateur et ne doit donc rien afficher.
 * C'est l'appelant qui compte.
 */
export const HeaderFilterButton = ({
  filterCount,
  ...props
}: {
  filterCount: number;
}) => (
  <Button
    size="xs"
    variant="grey"
    className="font-normal text-grey-8"
    notification={
      filterCount > 0 ? { size: 'xs', number: filterCount } : undefined
    }
    {...props}
  >
    {appLabels.filtrer}
  </Button>
);
