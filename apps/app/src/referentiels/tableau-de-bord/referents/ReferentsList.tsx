import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { appLabels } from '@/app/labels/catalog';
import { ReferentItem } from './ReferentItem';

export type ReferentsListProps = {
  nomFonction: string;
  referents?: Membre[];
};

/**
 * Affiche une liste de membres référents de la collectivité
 */
export const ReferentsList = (props: ReferentsListProps) => {
  const { nomFonction, referents } = props;
  return (
    <div className="mb-0">
      <span className="text-primary">{`${nomFonction} :`}</span>{' '}
      {referents?.length ? (
        referents.map((membre) => (
          <ReferentItem key={membre.userId} membre={membre} />
        ))
      ) : (
        <i>{appLabels.nonRenseigne}</i>
      )}
    </div>
  );
};
