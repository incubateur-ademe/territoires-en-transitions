import {useCollectiviteId} from 'core-logic/hooks';
import {Link} from 'react-router-dom';

import {FicheActionRead} from 'generated/dataLayer/fiche_action_read';
import {ficheActionAvancementLabels} from 'app/labels';
import {FicheActionAvancement} from 'generated/dataLayer/fiche_action_write';

const AvancementTag = ({avancement}: {avancement: FicheActionAvancement}) => {
  if (avancement === 'non_renseigne') return null;
  return (
    <div className="px-2 py-3 bg-white border-bf500 border-b-4">
      {ficheActionAvancementLabels[avancement]}
    </div>
  );
};

type FicheCardProps = {
  fiche: FicheActionRead;
};
export const FicheCard = (props: FicheCardProps) => {
  const collectiviteId = useCollectiviteId();
  const fiche = props.fiche;
  const avancement = fiche.avancement;
  const formatedTitle = fiche.numerotation
    ? `${fiche.numerotation} - ${fiche.titre}`
    : fiche.titre;
  return (
    <article className="bg-beige mb-5 px-4 py-2 flex flex-row items-center justify-between">
      <Link to={`/collectivite/${collectiviteId}/fiche/${fiche.uid}`}>
        <h3 className="fr-h3">{formatedTitle}</h3>
      </Link>
      <div className="flex flex-row whitespace-nowrap items-center">
        <AvancementTag avancement={avancement} />

        {fiche.en_retard && (
          <div className="px-2 py-3 bg-white border-red-500 border-r-4 ml-4">
            En retard
          </div>
        )}
      </div>
    </article>
  );
};
