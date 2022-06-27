import {useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {CollectiviteNavDropdown} from '../../../Header';

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
    <>
      <button
        className={`flex items-center w-full p-4 ${
          !item.isSelectCollectivite && 'font-bold'
        }`}
        onClick={toggleIsOpen}
      >
        <span>{item.menuLabel}</span>
        <div
          className={`ml-auto fr-fi-arrow-down-s-line ${
            isOpen && 'rotate-180'
          }`}
        />
      </button>
      <div className={`${isOpen ? 'block' : 'hidden'} pb-8`}>
        {item.isSelectCollectivite
          ? item.listPathsAndLabels.map(e => (
              <Link
                key={e.path}
                className="block py-3 px-8"
                to={e.path}
                onClick={handleCloseMobileNavigation}
              >
                {e.label}
              </Link>
            ))
          : item.listPathsAndLabels.map(e => (
              <NavLink
                key={e.path}
                className="block py-3 px-8"
                activeClassName="border-l-4 border-bf500 text-bf500 font-bold"
                to={e.path}
                onClick={handleCloseMobileNavigation}
              >
                {e.label}
              </NavLink>
            ))}
      </div>
    </>
  );
};

export default MobileCollectiviteNavigationDropdown;
