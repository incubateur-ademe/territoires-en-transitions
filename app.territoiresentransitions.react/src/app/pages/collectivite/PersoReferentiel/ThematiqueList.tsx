import {makeCollectivitePersoRefThematiqueUrl} from 'app/paths';
import {TQuestionThematiqueCompletudeRead} from 'generated/dataLayer/question_thematique_completude_read';
import {Badge} from 'ui/shared/Badge';

export type TThematiqueListProps = {
  collectivite: {
    id: number;
    nom: string;
  };
  items: TQuestionThematiqueCompletudeRead[];
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

/**
 * Affiche un item de la liste des personnalisations par thématique
 */
const Item = (props: TQuestionThematiqueCompletudeRead) => {
  const {collectivite_id, id, nom, completude} = props;
  const url = makeCollectivitePersoRefThematiqueUrl({
    collectiviteId: collectivite_id,
    thematiqueId: id,
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
