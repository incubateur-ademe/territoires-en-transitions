import classNames from 'classnames';
import {TActionInfo, TTOCItem} from './type';

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
  <nav className="bg-grey975 fr-py-1w fr-px-3w text-xs" role="navigation">
    <ul className="list-none p-0">
      {items.map(({id, label, num}) => {
        const isCurrent = id === current;
        return (
          <li
            key={id}
            aria-current={isCurrent}
            className={classNames('cursor-pointer hover:bg-grey925 p-2', {
              'bg-[rgba(0,0,0,0.04)]': isCurrent,
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
