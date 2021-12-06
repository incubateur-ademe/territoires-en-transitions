import {useEpciSiren} from 'core-logic/hooks';
import {Link} from 'react-router-dom';
import {FicheAction} from 'generated/models/fiche_action';

import {avancementLabels} from 'app/labels';
import {Avancement} from 'generated/dataLayer/action_statut_read';

const AvancementTag = ({avancement}: {avancement: Avancement}) => {
  // if (avancement !== '')
  return (
    <div className="px-2 py-3 bg-white border-bf500 border-b-4">
      {avancementLabels[avancement]}
    </div>
  );
  // return <></>;
};

type FicheCardProps = {
  fiche: FicheAction;
};
export const FicheCard = (props: FicheCardProps) => {
  const epciId = useEpciSiren();
  const fiche = props.fiche;
  const avancement = fiche.avancement as Avancement;
  const formatedTitle = fiche.custom_id
    ? `${fiche.custom_id} - ${fiche.titre}`
    : fiche.titre;
  return (
    <article className="bg-beige mb-5 px-4 py-2 flex flex-row items-center justify-between">
      <Link to={`/collectivite/${epciId}/fiche/${fiche.uid}`}>
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
