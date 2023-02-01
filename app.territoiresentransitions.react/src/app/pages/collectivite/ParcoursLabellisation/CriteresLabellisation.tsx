import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {CritereScore} from './CritereScore';
import {CriteresAction} from './CriteresAction';
import {CriterePreuves} from './CriterePreuves';
import {numLabels} from './numLabels';
import {CritereCompletude} from './CritereCompletude';
import {TPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/types';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {useCycleLabellisation} from './useCycleLabellisation';
import {usePreuves} from 'ui/shared/preuves/Bibliotheque/usePreuves';
import {useDemandeLabellisation} from './useDemandeLabellisation';
import {Referentiel} from 'types/litterals';

export type TCriteresLabellisationProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
  preuves: TPreuveLabellisation[];
};

/**
 * Affiche la liste des critères à remplir pour un niveau de labellisation
 */
export const CriteresLabellisation = (props: TCriteresLabellisationProps) => {
  const {parcours} = props;
  const {etoiles, critere_score} = parcours;
  const {atteint, score_a_realiser} = critere_score;

  return (
    <>
      <p className="text-grey625">
        Le premier niveau de labellisation ne nécessite pas d’audit et sera
        validé rapidement et directement par l’ADEME ! Les étoiles supérieures
        sont conditionnées à un audit réalisé par une personne experte mandatée
        par l’ADEME.
      </p>
      {etoiles !== '1' && atteint ? (
        <div className="fr-alert fr-alert--info fr-mb-2w">
          Bravo, vous avez plus de {Math.round(score_a_realiser * 100)} %
          d’actions réalisées ! Les critères ont été mis à jour pour préparer
          votre candidature à la {numLabels[etoiles]} étoile.
        </div>
      ) : null}
      <h2>Critères de labellisation</h2>
      <ul>
        <CritereCompletude {...props} />
        {etoiles !== '1' ? <CritereScore {...props} /> : null}
        <CriteresAction {...props} />
        <CriterePreuves {...props} />
      </ul>
    </>
  );
};

const CriteresLabellisationConnected = () => {
  const collectiviteId = useCollectiviteId();
  const referentiel = useReferentielId();

  const {parcours} = useCycleLabellisation(referentiel);

  // on s'assure que la demande existe pour avoir l'id nécessaire pour attacher les preuves
  const etoiles = parcours?.etoiles;
  const demande = useDemandeLabellisation(referentiel as Referentiel, etoiles);

  const preuves = usePreuves({
    demande_id: demande?.id,
    preuve_types: ['labellisation'],
  }) as TPreuveLabellisation[];

  return collectiviteId && parcours ? (
    <CriteresLabellisation
      collectiviteId={collectiviteId}
      parcours={parcours}
      preuves={preuves}
    />
  ) : null;
};

export default CriteresLabellisationConnected;
