import {makeCollectivitePersoRefThematiqueUrl} from 'app/paths';
import {TQuestionThematiqueCompletudeRead} from './useQuestionThematiqueCompletude';
import {Referentiel} from 'types/litterals';
import {Badge} from 'ui/shared/Badge';

export type TThematiqueListProps = {
  collectivite: {
    id: number;
    nom: string;
  };
  items: TQuestionThematiqueCompletudeRead[];
  className?: string;
  referentiels: Referentiel[];
};

/**
 * Affiche ...
 */
export const ThematiqueList = (props: TThematiqueListProps) => {
  const {collectivite, items, className, referentiels} = props;
  return (
    <ul className={`w-full border pl-0 ${className || ''}`}>
      {items.map(item => (
        <Item
          key={item.id}
          {...item}
          collectivite_id={collectivite.id}
          referentielsSelected={referentiels}
        />
      ))}
    </ul>
  );
};

/**
 * Affiche un item de la liste des personnalisations par thématique
 */
const Item = (
  props: TQuestionThematiqueCompletudeRead & {
    referentielsSelected: Referentiel[];
  }
) => {
  const {collectivite_id, id, nom, completude, referentielsSelected} = props;
  const url = makeCollectivitePersoRefThematiqueUrl({
    collectiviteId: collectivite_id,
    thematiqueId: id,
    referentiels: referentielsSelected,
  });

  return (
    <li className="list-none px-2 py-3 border-b last:border-none hover:bg-grey925">
      <a
        className="flex justify-between"
        style={{boxShadow: 'none'}}
        href={url}
      >
        {nom}
        {renderByStatus[completude]}
      </a>
    </li>
  );
};

const renderByStatus = {
  complete: <Badge status="success">Complété</Badge>,
  a_completer: <Badge status="info">À compléter</Badge>,
};
