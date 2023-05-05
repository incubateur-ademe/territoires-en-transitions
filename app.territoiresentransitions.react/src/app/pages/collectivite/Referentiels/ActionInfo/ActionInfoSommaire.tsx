import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {TActionInfo, TFieldName, TTOCItem} from './type';

// tous les items du sommaire (avant filtrage)
export const TOC_ITEMS = [
  {id: 'contexte', label: 'Contexte et réglementation'},
  {id: 'exemples', label: 'Exemples d’autres collectivités'},
  {id: 'ressources', label: 'Ressources documentaires'},
  {id: 'reduction_potentiel', label: 'Réduction de potentiel'},
  {id: 'perimetre_evaluation', label: 'Renvois-limite'},
] as const;

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
    style={{paddingTop: '1.5rem', paddingBottom: '1rem'}}
    role="navigation"
    aria-labelledby="toc-action-info"
  >
    <p className="fr-summary__title" id="toc-action-info">
      Sommaire
    </p>
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

// renvoi les items du sommaire à afficher
export const getItems = (action: ActionDefinitionSummary) =>
  TOC_ITEMS
    // filtre les items pour lesquels l'action contient un champ `have_<id>` valide
    .filter(({id}) => action[`have_${id}` as TFieldName] === true)
    // et les numérote
    .map((item, index) => ({...item, num: index + 1}));
