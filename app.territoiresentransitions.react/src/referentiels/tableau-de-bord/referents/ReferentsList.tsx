import { ReferentItem } from './ReferentItem';
import { CollectiviteMembre } from './useMembres';

export type ReferentsListProps = {
  nomFonction: string;
  referents?: CollectiviteMembre[];
};

/**
 * Affiche une liste de membres référents de la collectivité
 */
export const ReferentsList = (props: ReferentsListProps) => {
  const { nomFonction, referents } = props;
  return (
    <div className="mb-0">
      <span className="text-primary">{nomFonction} :</span>{' '}
      {referents?.length ? (
        referents.map((membre) => (
          <ReferentItem key={membre.userId} membre={membre} />
        ))
      ) : (
        <i>Non renseigné</i>
      )}
    </div>
  );
};
