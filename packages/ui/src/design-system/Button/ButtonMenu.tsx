import {ButtonProps} from './types';
import {Button} from './Button';
import {NotificationVariant} from '../Notification';
import {NotificationButton} from './NotificationButton';
import {DropdownFloater} from '@design-system/Select/components/DropdownFloater';

/** Ouverture d'un menu flottant au click sur le bouton */

export const ButtonMenu = ({
  children,
  notificationValue,
  notificationVariant,
  size = 'xs',
  ...props
}: {
  /** Contenu du menu flottant */
  children: React.ReactNode;
  /** Valeur visible dans la pastille de notification */
  notificationValue?: number;
  /** Variant de la pastille de notification */
  notificationVariant?: NotificationVariant;
} & ButtonProps) => {
  return (
    <>
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
            className="mr-2"
            {...props}
          />
        ) : (
          <Button size={size} className="mx-2" {...props} />
        )}
      </DropdownFloater>
    </>
  );
};
