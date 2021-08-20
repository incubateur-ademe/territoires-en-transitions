import {useEpciId} from 'core-logic/hooks';
import {Link} from 'react-router-dom';
import {FicheAction} from 'generated/models/fiche_action';
import {fiche_action_avancement_noms} from 'generated/models/fiche_action_avancement_noms';
import {Avancement} from 'types';

type FicheCardProps = {
  fiche: FicheAction;
};
export const FicheCard = (props: FicheCardProps) => {
  const epciId = useEpciId();
  const fiche = props.fiche;
  const avancement = fiche.avancement as Avancement;

  return (
    <article className="bg-beige mb-5 px-4 py-2 flex flex-row items-center justify-between">
      <Link to={`/collectivite/${epciId}/fiche/${fiche.uid}`}>
        <h3 className="fr-h3">
          {fiche.custom_id}. {fiche.titre}
        </h3>
      </Link>
      <div className="flex flex-row whitespace-nowrap items-center">
        <div className=" px-2 py-3  bg-white border-blue-500 border-b-4">
          {avancement}
        </div>

        {fiche.en_retard && (
          <div className="px-2 py-3 bg-white border-red-500 border-r-4 ml-4">
            En retard
          </div>
        )}
      </div>
    </article>
  );
};
