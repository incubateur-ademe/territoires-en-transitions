import {ButtonProps} from './types';
import {Button} from './Button';
import {DropdownFloater} from '@design-system/Select/components/DropdownFloater';

/** Ouverture d'un menu flottant au click sur le bouton */

export const ButtonMenu = ({children, ...props}: ButtonProps) => {
  return (
    <DropdownFloater
      placement="bottom-end"
      containerClassName="rounded-lg !border-t shadow-card"
      render={() => <div className="p-4">{children}</div>}
    >
      <Button {...props} />
    </DropdownFloater>
  );
};
