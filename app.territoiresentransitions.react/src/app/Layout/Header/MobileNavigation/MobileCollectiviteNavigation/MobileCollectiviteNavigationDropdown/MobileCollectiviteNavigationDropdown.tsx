import {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';

import {CollectiviteNavDropdown} from 'app/Layout/Header/makeCollectiviteNavItems';
import CollectiviteAccesChip from 'app/Layout/Header/CollectiviteNavigation/CollectiviteAccesChip';

type DropdownProps = {
  item: CollectiviteNavDropdown;
  handleCloseMobileNavigation: () => void;
};

const MobileCollectiviteNavigationDropdown = ({
  item,
  handleCloseMobileNavigation,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleIsOpen = () => setIsOpen(!isOpen);

  return (
    <div>
      <button
        className={`flex items-center w-full p-4 ${
          !item.isSelectCollectivite && 'font-bold'
        }`}
        onClick={toggleIsOpen}
      >
        <span>{item.menuLabel}</span>
        {item.isSelectCollectivite && (
          <CollectiviteAccesChip
            acces={item.niveauAcces ?? null}
            className="ml-4"
          />
        )}
        <div
          className={`ml-auto fr-fi-arrow-down-s-line ${
            isOpen && 'rotate-180'
          }`}
        />
      </button>
      <div className={`${isOpen ? 'block' : 'hidden'} pb-8`}>
        {item.isSelectCollectivite ? (
          <>
            {item.listPathsAndLabels.map(e => (
              <Link
                key={e.path}
                className="flex items-center py-3 px-8"
                to={e.path}
                onClick={handleCloseMobileNavigation}
              >
                <span className="mr-auto">{e.label}</span>
                {e.niveauAcces && (
                  <CollectiviteAccesChip
                    acces={e.niveauAcces}
                    className="ml-4"
                  />
                )}
              </Link>
            ))}
          </>
        ) : (
          item.listPathsAndLabels.map(e => (
            <NavLink
              key={e.path}
              className="block py-3 px-8"
              activeClassName="border-l-4 border-bf500 text-bf500 font-bold"
              to={e.path}
              onClick={handleCloseMobileNavigation}
            >
              {e.label}
            </NavLink>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileCollectiviteNavigationDropdown;
