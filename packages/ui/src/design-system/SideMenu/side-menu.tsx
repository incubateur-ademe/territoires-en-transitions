import { Icon, Notification } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';

type SideMenuProps = {
  children: JSX.Element;
  /** Détermine l'affichage du header */
  headerType?: 'title' | 'navigation';
  /** Titre du menu latéral */
  title?: string;
  /** Affichage d'un compteur dans le titre du menu latéral */
  count?: number;
  /** Ajout d'un bouton pour ouvrir en pleine page */
  canExtend?: boolean;
  /** Action au click sur le bouton extend */
  onExtend?: () => void;
  /** Etat ouvert du menu latéral */
  isOpen: boolean;
  /** Commande l'ouverture du menu */
  setIsOpen: (value: boolean) => void;
  /** Ajout d'un data-test */
  dataTest?: string;
};

export const SideMenu = ({
  children,
  headerType = 'title',
  title = '',
  count,
  canExtend = false,
  onExtend,
  isOpen,
  setIsOpen,
  dataTest,
}: SideMenuProps) => {
  const [displayContent, setDisplayContent] = useState(false);

  useEffect(() => {
    // Le content est rerendered à l'ouverture du menu pour toujours être en haut de la div
    // setInterval 500 correspond à la durée de l'animation de fermeture du menu
    let interval: ReturnType<typeof setInterval>;

    if (!isOpen) {
      interval = setInterval(() => setDisplayContent(false), 500);
    } else {
      setDisplayContent(true);
    }

    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <div
      data-test={dataTest}
      className={classNames(
        'fixed z-[800] top-0 h-screen max-h-screen overflow-hidden w-full md:w-[50%] lg:w-[40%] xl:w-[35%] flex flex-col bg-white transition-all duration-500',
        {
          '-right-full md:-right-[50%] lg:-right-[40%] xl:-right-[35%]':
            !isOpen,
          'right-0': isOpen,
        }
      )}
      style={isOpen ? { boxShadow: '-1px 0px 15px 0.5px #ddd' } : {}}
    >
      {/* Titre + bouton de fermeture */}
      <div className="h-10 py-1 px-2 flex items-center gap-3 bg-primary-0 border border-primary-3 shadow-sm z-[801] top-0">
        {/* Menu icônes - Fermer / Ouvrir en pleine page */}
        <div className="flex gap-2">
          <Icon
            icon="arrow-right-double-line"
            size="xs"
            className="text-primary-8 hover:text-primary-10 transition-colors cursor-pointer"
            title="Fermer"
            onClick={() => setIsOpen(false)}
          />
          {canExtend && (
            // to do
            <Icon
              icon="expand-diagonal-s-line"
              size="xs"
              className="text-primary-8 hover:text-primary-10 transition-colors cursor-pointer"
              title="Ouvrir en pleine page"
              onClick={onExtend}
            />
          )}
        </div>

        <div className="bg-grey-6 h-5/6 w-[0.5px]" />

        {/* Titre */}
        {headerType === 'title' && (
          <div className="flex items-center gap-2">
            {count !== undefined && <Notification number={count} size="xs" />}
            <h6 className="mb-0 text-sm uppercase">{title}</h6>
          </div>
        )}

        {/* Navigation */}
        {headerType === 'navigation' && <div>{/* to do */}</div>}
      </div>

      {/* Contenu du side menu */}
      <div className="grow overflow-y-auto border border-t-0 border-grey-3">
        {displayContent && children}
      </div>
    </div>
  );
};
