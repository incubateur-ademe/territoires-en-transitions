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
  <nav
    className="fr-summary !bg-grey975"
    /** surcharge les espacements de fr-summary */
    style={{paddingTop: '0', paddingBottom: '0'}}
    role="navigation"
  >
    <ol className="fr-summary__list">
      {items.map(({id, label}) => {
        const isCurrent = id === current;
        return (
          <li
            key={id}
            aria-current={isCurrent}
            className={classNames({'bg-[rgba(0,0,0,0.04)]': isCurrent})}
          >
            <button className="fr-summary__link" onClick={() => setCurrent(id)}>
              {label}
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
