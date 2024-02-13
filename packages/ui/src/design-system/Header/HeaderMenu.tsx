import {Button} from '@design-system/Button';
import {ButtonProps} from '@design-system/Button/types';
import classNames from 'classnames';
import {Dispatch, ReactElement, SetStateAction} from 'react';
import HeaderButton, {HeaderButtonProps} from './HeaderButton';

type HeaderMenuProps = {
  /** Menu accès rapide */
  quickAccessButtons?: (props: ButtonProps) => ReactElement<typeof Button>[];
  /** Menu de navigation */
  menuButtons?: (
    props: HeaderButtonProps
  ) => ReactElement<typeof HeaderButton>[];
  openedMenu: boolean;
  setOpenedMenu: Dispatch<SetStateAction<boolean>>;
};

const HeaderMenu = ({
  quickAccessButtons,
  openedMenu,
  setOpenedMenu,
  menuButtons,
}: HeaderMenuProps) => {
  return (
    <div
      className={classNames('w-full bg-white', {
        'lg:border-t-[0.5px] lg:border-t-primary-4': !!menuButtons,
        'absolute top-0 left-0': openedMenu,
      })}
    >
      <div
        className={classNames(
          'mx-auto px-4 lg:px-6 xl:max-w-7xl xl:px-2 text-sm',
          {'py-3': openedMenu}
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

        {/* Menu de navigation */}
        <nav
          className={classNames(
            'flex max-lg:flex-col justify-between max-lg:mt-6',
            {
              'max-lg:hidden': !openedMenu,
            }
          )}
        >
          <ul className={classNames('list-none flex max-lg:flex-col mb-0')}>
            {menuButtons?.({
              variant: 'white',
              className:
                'rounded-none font-normal text-primary-9 hover:!text-primary-9 text-sm max-lg:w-full',
            }).map((button, idx) => {
              return (
                <li key={idx} className="pb-0">
                  {button}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default HeaderMenu;
