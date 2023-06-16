import {useCollectiviteId} from 'core-logic/hooks/params';
import {useProgressionReferentiel} from '../EtatDesLieux/Synthese/data/useProgressionReferentiel';
import EtatDesLieuxCard from './EtatDesLieuxCard';
import IndicateursCard from './IndicateursCard';
import PlansActionCard from './PlansActionCard';

const Accueil = (): JSX.Element => {
  const collectiviteId = useCollectiviteId();
  const {
    caeTable: caeProgressionScore,
    eciTable: eciProgressionScore,
    caeRepartitionPhases,
    eciRepartitionPhases,
  } = useProgressionReferentiel();

  return (
    <main data-test="TableauBord" className="bg-bf975 -mb-8">
      {!!collectiviteId && (
        <div className="fr-container flex flex-col py-16 gap-16">
          {/* Première ligne - Plans d'action et Indicateurs */}
          <div className="grid lg:grid-cols-2 gap-x-6 gap-y-16">
            <div className="flex flex-col">
              <h5 className="text-xl leading-5 font-extrabold">
                Plans d'action
              </h5>
              <PlansActionCard collectiviteId={collectiviteId} />
            </div>
            <div className="flex flex-col">
              <h5 className="text-xl leading-5 font-extrabold">Indicateurs</h5>
              <IndicateursCard collectiviteId={collectiviteId} />
            </div>
          </div>

          {/* Deuxième ligne - États des lieux */}
          <div>
            <h5 className="text-xl leading-5 font-extrabold">État des lieux</h5>
            <div className="grid lg:grid-cols-2 gap-6">
              <EtatDesLieuxCard
                collectiviteId={collectiviteId}
                progressionScore={caeProgressionScore}
                repartitionPhases={caeRepartitionPhases}
                referentiel="cae"
                title="Climat Air Énergie"
                className="order-1"
              />
              <EtatDesLieuxCard
                collectiviteId={collectiviteId}
                progressionScore={eciProgressionScore}
                repartitionPhases={eciRepartitionPhases}
                referentiel="eci"
                title="Économie circulaire"
                className="lg:order-2 order-3"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Accueil;
