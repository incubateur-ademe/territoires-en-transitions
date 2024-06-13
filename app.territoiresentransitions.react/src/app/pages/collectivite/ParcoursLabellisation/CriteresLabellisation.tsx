import {TLabellisationParcours} from 'app/pages/collectivite/ParcoursLabellisation/types';
import {CritereScore} from './CritereScore';
import {CriteresAction} from './CriteresAction';
import {CriterePreuves} from './CriterePreuves';
import {numLabels} from './numLabels';
import {CritereCompletude} from './CritereCompletude';
import {TPreuveLabellisation} from 'ui/shared/preuves/Bibliotheque/types';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {
  useCycleLabellisation,
  usePreuvesLabellisation,
} from './useCycleLabellisation';
import {Alert} from '@tet/ui';

export type TCriteresLabellisationProps = {
  collectiviteId: number;
  parcours: TLabellisationParcours;
  preuves: TPreuveLabellisation[];
  isCOT: boolean;
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
      <p className="text-grey-6">
        Le premier niveau de labellisation ne nécessite pas d’audit et sera
        validé rapidement et directement par l’ADEME ! Les étoiles supérieures
        sont conditionnées à un audit réalisé par une personne experte mandatée
        par l’ADEME.
      </p>
      {etoiles !== '1' && atteint ? (
        <Alert
          className="mb-4"
          title={`Bravo, vous avez plus de ${Math.round(
            score_a_realiser * 100
          )} %
        d’actions réalisées ! Les critères ont été mis à jour pour préparer
        votre candidature à la ${numLabels[etoiles]} étoile.`}
        />
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
  const {parcours, isCOT} = useCycleLabellisation(referentiel);
  const preuves = usePreuvesLabellisation(parcours?.demande?.id);

  return collectiviteId && parcours ? (
    <CriteresLabellisation
      collectiviteId={collectiviteId}
      parcours={parcours}
      preuves={preuves}
      isCOT={isCOT}
    />
  ) : null;
};

export default CriteresLabellisationConnected;
