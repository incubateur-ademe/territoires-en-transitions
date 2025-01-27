import { makeCollectivitePersoRefThematiqueUrl } from '@/app/app/paths';
import { BadgeACompleter } from '@/app/ui/shared/Badge/BadgeACompleter';
import { ReferentielId } from '@/domain/referentiels';
import Link from 'next/link';
import { TQuestionThematiqueCompletudeRead } from './useQuestionThematiqueCompletude';

export type TThematiqueListProps = {
  collectivite: {
    id: number;
    nom: string;
  };
  items: TQuestionThematiqueCompletudeRead[];
  className?: string;
  referentiels: ReferentielId[];
};

/**
 * Affiche ...
 */
export const ThematiqueList = (props: TThematiqueListProps) => {
  const { collectivite, items, className, referentiels } = props;
  return (
    <ul className={`w-full border pl-0 ${className || ''}`}>
      {items.map((item) => (
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
    referentielsSelected: ReferentielId[];
  }
) => {
  const { collectivite_id, id, nom, completude, referentielsSelected } = props;
  const url = makeCollectivitePersoRefThematiqueUrl({
    collectiviteId: collectivite_id,
    thematiqueId: id,
    referentiels: referentielsSelected,
  });

  return (
    <li className="list-none py-0 border-b last:border-none hover:bg-primary-1">
      <Link
        className="flex justify-between items-center px-2 py-3 bg-none"
        href={url}
      >
        {nom}
        <BadgeACompleter a_completer={completude === 'a_completer'} />
      </Link>
    </li>
  );
};
