import {Button} from '@design-system/Button';
import {ButtonProps} from '@design-system/Button/types';
import classNames from 'classnames';
import {Dispatch, ReactElement, SetStateAction} from 'react';

type HeaderMenuProps = {
  /** Menu accès rapide */
  quickAccessButtons?: (props: ButtonProps) => ReactElement<typeof Button>[];
  /** Etat ouvert du menu en version mobile */
  openedMenu: boolean;
  /** Ouverture du menu en version mobile */
  setOpenedMenu: Dispatch<SetStateAction<boolean>>;
};

// TODO: Ajout de la barre de navigation

const HeaderMenu = ({
  quickAccessButtons,
  openedMenu,
  setOpenedMenu,
}: HeaderMenuProps) => {
  return (
    <div
      className={classNames('w-full bg-white', {
        'absolute top-0 left-0 z-modal h-screen': openedMenu,
      })}
    >
      <div
        className={classNames(
          'mx-auto px-4 lg:px-6 xl:max-w-7xl 2xl:max-w-8xl xl:px-2 text-sm',
          {'py-3 h-full': openedMenu}
        )}
      >
        {/* Bouton de fermeture du menu mobile */}
        <Button
          variant="white"
          size="sm"
          icon="close-line"
          iconPosition="right"
          className={classNames('lg:hidden ml-auto', {
            'max-lg:hidden': !openedMenu,
          })}
          onClick={() => setOpenedMenu(false)}
        >
          Fermer
        </Button>

        {/* Menu accès rapide en version mobile */}
        <ul
          className={classNames(
            'list-none flex-col gap-4 mb-0 mt-6 lg:hidden',
            {
              'max-lg:hidden': !openedMenu,
            }
          )}
        >
          {quickAccessButtons?.({
            variant: 'white',
            size: 'sm',
          }).map((button, idx) => (
            <li key={idx}>{button}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HeaderMenu;
