import {Ref, forwardRef, useEffect, useRef, useState} from 'react';
import {ButtonProps} from './types';
import {Button} from './Button';
import {NotificationVariant} from '../Notification';
import {NotificationButton} from './NotificationButton';
import classNames from 'classnames';

/** Ouverture d'un menu flottant au click sur le bouton */

export const ButtonMenu = forwardRef(
  (
    {
      children,
      notificationValue,
      notificationVariant,
      size = 'xs',
      menuAlignment = 'right',
      menuClassName,
      ...props
    }: {
      /** Contenu du menu flottant */
      children: React.ReactNode;
      /** Valeur visible dans la pastille de notification */
      notificationValue?: number;
      /** Variant de la pastille de notification */
      notificationVariant?: NotificationVariant;
      /** Alignement du menu par rapport au bouton */
      menuAlignment?: 'left' | 'right';
      /** Surcouche sur la classname du menu */
      menuClassName?: string;
    } & ButtonProps,
    ref?: Ref<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    const [openMenu, setOpenMenu] = useState(false);

    const containerRef: Ref<HTMLDivElement> = useRef(null);

    const handleClick = () => setOpenMenu(prevState => !prevState);

    const handleClickOutside = event => {
      if (
        containerRef?.current &&
        !containerRef?.current.contains(event.target)
      ) {
        setOpenMenu(false);
      }
    };

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    return (
      <div ref={containerRef} className="mx-2 relative w-fit">
        {notificationValue !== undefined ? (
          <NotificationButton
            ref={ref}
            size={size}
            notificationValue={notificationValue}
            notificationVariant={notificationVariant}
            onClick={handleClick}
            {...props}
          />
        ) : (
          <Button ref={ref} size={size} onClick={handleClick} {...props} />
        )}
        {openMenu && (
          <div
            className={classNames(
              'absolute z-modal p-4 bg-white border border-grey-2 rounded-md shadow-card w-fit',
              {
                'right-0': menuAlignment === 'right',
                'left-0': menuAlignment === 'left',
                'top-12': size === 'xs',
                'top-14': size === 'sm',
                'top-16': size === 'md',
                'top-20': size === 'xl',
              },
              menuClassName
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
