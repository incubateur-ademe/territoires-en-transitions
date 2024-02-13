import classNames from 'classnames';
import {Button} from '@design-system/Button';
import {ReactElement, useState} from 'react';
import {ButtonProps} from '@design-system/Button/types';
import HeaderBody from './HeaderBody';
import HeaderMenu from './HeaderMenu';
import HeaderButton, {HeaderButtonProps} from './HeaderButton';

type HeaderProps = {
  /** Titre du header */
  title: string;
  /** Sous-titre */
  subtitle?: string;
  /** Liste de logos à afficher à gauche du header. */
  logos?: React.ReactNode[];
  /** Menu accès rapide */
  quickAccessButtons?: (props: ButtonProps) => ReactElement<typeof Button>[];
  /** Menu de navigation */
  menuButtons?: (
    props: HeaderButtonProps
  ) => ReactElement<typeof HeaderButton>[];
  /** Surcharge des classNames. */
  className?: string;
};

export const Header = ({
  title,
  subtitle,
  logos,
  quickAccessButtons,
  menuButtons,
  className,
}: HeaderProps) => {
  const [openedMenu, setOpenedMenu] = useState(false);

  return (
    <header
      className={classNames(
        'w-full bg-white border-b-[0.5px] border-b-primary-4 relative',
        className
      )}
    >
      {/* Partie suppérieure du header */}
      <HeaderBody
        {...{
          title,
          subtitle,
          logos,
          quickAccessButtons,
          openedMenu,
          setOpenedMenu,
        }}
      />

      {/* Partie inférieure du header - Barre de navigation */}
      <HeaderMenu
        {...{quickAccessButtons, menuButtons, openedMenu, setOpenedMenu}}
      />
    </header>
  );
};
