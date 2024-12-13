import DropdownFloater from '@/app/ui/shared/floating-ui/DropdownFloater';
import classNames from 'classnames';
import { TOption } from './commons';

type TOptionWithIcon = TOption & { icon?: string };

/** Affiche un menu contextuel */
const ContextMenu = ({
  /** id du menu déroulant pour les tests */
  dataTest,
  /** options du menu */
  options,
  /** composant bouton pour ouvrir le menu */
  children,
  /** appelée lorsqu'une option est sélectionnée */
  onSelect,
}: {
  dataTest?: string;
  options: TOptionWithIcon[];
  children: JSX.Element;
  onSelect: (value: string) => void;
}) => {
  return (
    <DropdownFloater
      placement="bottom-end"
      render={({ close }) => (
        <nav data-test={dataTest}>
          <ul className="m-0 p-0">
            {options.map(({ value, label, icon }) => (
              <li
                key={value}
                className="fr-nav__item pb-0 border-b border-gray-200"
              >
                <button
                  className="fr-nav__link !flex !items-center !text-bf500 !py-2 !px-3 before:!hidden !shadow-none"
                  onClick={() => {
                    onSelect(value);
                    close();
                  }}
                >
                  {icon && (
                    <span className={classNames('scale-75 mr-1', icon)} />
                  )}
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    >
      {children}
    </DropdownFloater>
  );
};

export default ContextMenu;
