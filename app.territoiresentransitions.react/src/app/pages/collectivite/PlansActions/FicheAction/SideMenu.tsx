import {useEffect, useState} from 'react';
import classNames from 'classnames';
import {Button} from '@tet/ui';

type SideMenuProps = {
  children: JSX.Element;
  title: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

const SideMenu = ({children, title, isOpen, setIsOpen}: SideMenuProps) => {
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
      className={classNames(
        'absolute z-[800] top-0 h-screen max-h-screen overflow-hidden w-[50%] lg:w-[33%] xl:w-[30%] flex flex-col bg-white rounded-l-lg border-l border-l-grey-3 transition-all duration-500',
        {
          '-right-[50%] lg:-right-[33%] xl:-right-[30%]': !isOpen,
          'right-0': isOpen,
        }
      )}
      style={isOpen ? {boxShadow: '-1px 0px 12px 1px #ddd'} : {}}
    >
      {/* Titre + bouton de fermeture */}
      <div className="p-4 flex justify-between items-center bg-white border-b border-b-grey-3 shadow-sm z-[801] top-0">
        <h5 className="mb-0">{title}</h5>
        <Button
          title="Fermer"
          onClick={() => setIsOpen(false)}
          icon="close-line"
          variant="grey"
          size="xs"
        />
      </div>

      {/* Contenu du side menu */}
      <div className="grow overflow-y-auto">{displayContent && children}</div>
    </div>
  );
};

export default SideMenu;
