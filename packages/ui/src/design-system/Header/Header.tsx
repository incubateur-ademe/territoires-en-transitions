import classNames from 'classnames';
import {Button} from '@design-system/Button';
import {ReactElement, useState} from 'react';
import {ButtonProps} from '@design-system/Button/types';
import HeaderBody from './HeaderBody';
import HeaderMenu from './HeaderMenu';

type HeaderProps = {
  /** Titre du header */
  title: string;
  /** Sous-titre */
  subtitle?: string;
  /** Liste de logos à afficher à gauche du header. */
  logos?: React.ReactNode[];
  /** Menu accès rapide */
  quickAccessButtons?: (props: ButtonProps) => ReactElement<typeof Button>[];
  /** Surcharge des classNames. */
  className?: string;
};

export const Header = ({
  title,
  subtitle,
  logos,
  quickAccessButtons,
  className,
}: HeaderProps) => {
  const [openedMenu, setOpenedMenu] = useState(false);

  return (
    <header className={classNames('w-full bg-white relative', className)}>
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
      <HeaderMenu {...{quickAccessButtons, openedMenu, setOpenedMenu}} />
    </header>
  );
};
