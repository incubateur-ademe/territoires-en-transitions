import {Placement} from '@floating-ui/react';

import {ButtonProps} from './types';
import {Button} from './Button';
import {DropdownFloater} from '../Select/components/DropdownFloater';
import {OpenState} from '../../utils/types';

type Props = {
  /** Le contenu du menu */
  children: React.ReactNode;
  /** Placement du menu pour l'élément floating-ui */
  menuPlacement?: Placement;
  openState?: OpenState;
} & ButtonProps;

/**
 * Ouverture d'un menu flottant au click sur le bouton.
 *
 * Ne pas oublier de donner une largeur fixe au menu s'il contient des élements qui peuvent être resizer comme un sélecteur avec une valeur.
 */
export const ButtonMenu = ({
  menuPlacement = 'bottom-end',
  openState,
  children,
  ...props
}: Props) => {
  return (
    <DropdownFloater
      placement={menuPlacement}
      openState={openState}
      containerClassName="relative rounded-lg !border-t shadow-card"
      render={() => <div className="p-4">{children}</div>}
    >
      <Button {...props} />
    </DropdownFloater>
  );
};
