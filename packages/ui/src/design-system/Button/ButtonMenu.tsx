import { ButtonProps } from './types';
import { Button } from './Button';
import { NotificationVariant } from '../Notification';
import { NotificationButton } from './NotificationButton';
import { DropdownFloater } from '@tet/ui/design-system/Select/components/DropdownFloater';

/** Ouverture d'un menu flottant au click sur le bouton */

export const ButtonMenu = ({
  children,
  notificationValue,
  notificationVariant,
  notificationBtnClassName,
  size = 'xs',
  ...props
}: {
  /** Contenu du menu flottant */
  children: React.ReactNode;
  /** Valeur visible dans la pastille de notification */
  notificationValue?: number;
  /** Variant de la pastille de notification */
  notificationVariant?: NotificationVariant;
  /** ClassName pour le container du NotificationButton */
  notificationBtnClassName?: string;
} & ButtonProps) => {
  return (
    <DropdownFloater
      placement="bottom-end"
      containerClassName="rounded-lg !border-t shadow-card"
      render={() => <div className="p-4">{children}</div>}
    >
      {notificationValue !== undefined ? (
        <NotificationButton
          size={size}
          notificationValue={notificationValue}
          notificationVariant={notificationVariant}
          containerclassName={notificationBtnClassName}
          {...props}
          className="" // reset le classname sinon les styles sont dupliqués entre le container et le bouton
        />
      ) : (
        <Button size={size} {...props} />
      )}
    </DropdownFloater>
  );
};
