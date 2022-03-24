import {makeCollectivitePersoRefThematiqueUrl} from 'app/paths';
import {Badge} from 'ui/shared/Badge';

export type TThematiqueListProps = {
  collectivite: {
    id: number;
    nom: string;
  };
  items: TItemProps[];
  className?: string;
};

/**
 * Affiche ...
 */
export const ThematiqueList = (props: TThematiqueListProps) => {
  const {collectivite, items, className} = props;
  return (
    <ul className={`w-full border pl-0 ${className || ''}`}>
      {items.map(item => (
        <Item key={item.id} {...item} collectivite_id={collectivite.id} />
      ))}
    </ul>
  );
};

export type TItemProps = {
  collectivite_id: number;
  id: string;
  nom: string;
  perso_thematique_status: 'done' | 'todo';
};

/**
 * Affiche un item de la liste des personnaliations par thématique
 */
const Item = (props: TItemProps) => {
  const {collectivite_id, id, nom, perso_thematique_status} = props;
  const url = makeCollectivitePersoRefThematiqueUrl({
    collectivite_id,
    thematique_id: id,
  });

  return (
    <li className="list-none px-2 py-3 border-b last:border-none hover:bg-grey925">
      <a
        className="flex justify-between"
        style={{boxShadow: 'none'}}
        href={url}
      >
        {nom}
        {renderByStatus[perso_thematique_status]}
      </a>
    </li>
  );
};

const renderByStatus = {
  done: <Badge status="success">Complété</Badge>,
  todo: <Badge status="info">À compléter</Badge>,
};
