import classNames from 'classnames';
import { TActionInfo, TTOCItem } from './action-information.types';

type TActionSommaireProps = {
  /** Items à afficher */
  items: Array<TTOCItem>;
  /** Id de l'item sélectionné  */
  current: TActionInfo;
  /** Appelée pour changer l'id de l'item sélectionné  */
  setCurrent: (id: TActionInfo) => void;
};

/** Affiche le sommaire */
export const ActionInfoSommaire = ({
  items,
  current,
  setCurrent,
}: TActionSommaireProps) => (
  <nav className="bg-grey-2 py-2 px-6 text-xs" role="navigation">
    <ul className="list-none p-0">
      {items.map(({ id, label, num }) => {
        const isCurrent = id === current;
        return (
          <li
            key={id}
            aria-current={isCurrent}
            className={classNames('cursor-pointer p-2', {
              'bg-grey-3': isCurrent,
            })}
            onClick={() => setCurrent(id)}
          >
            {num}. {label}
          </li>
        );
      })}
    </ul>
  </nav>
);
