import {ReactNode} from 'react';
import {referentielToName} from 'app/labels';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useProgressionReferentiel} from './data/useProgressionReferentiel';
import EtatDesLieux from './EtatDesLieux/EtatDesLieux';
import IndicateursCard from './IndicateursCard';
import PlansActionCard from './PlansActionCard';

/**
 * Affiche la page d'accueil d'une collectivité
 */
const Accueil = (): JSX.Element => {
  const collectiviteId = useCollectiviteId();
  const {
    caeTable: caeProgressionScore,
    eciTable: eciProgressionScore,
    caeRepartitionPhases,
    eciRepartitionPhases,
    caePotentiel,
    eciPotentiel,
  } = useProgressionReferentiel();

  return (
    <main data-test="TableauBord" className="bg-bf975 -mb-8">
      {!!collectiviteId && (
        <div className="fr-container flex flex-col py-16 gap-16">
          {/* Plans d'action et Indicateurs */}
          <div className="grid lg:grid-cols-2 gap-x-6 gap-y-16">
            <div className="flex flex-col">
              <TitreSection>Plans d'action</TitreSection>
              <PlansActionCard collectiviteId={collectiviteId} />
            </div>
            <div className="flex flex-col">
              <TitreSection>Indicateurs</TitreSection>
              <IndicateursCard collectiviteId={collectiviteId} />
            </div>
          </div>

          {/* États des lieux */}
          <div>
            <TitreSection>État des lieux</TitreSection>
            <div className="grid lg:grid-cols-2 gap-6">
              {/** Climat Air Énergie */}
              <EtatDesLieux
                collectiviteId={collectiviteId}
                progressionScore={caeProgressionScore}
                repartitionPhases={caeRepartitionPhases}
                potentiel={caePotentiel}
                referentiel="cae"
                title={referentielToName.cae}
              />
              {/** Écomomie circulaire */}
              <EtatDesLieux
                collectiviteId={collectiviteId}
                progressionScore={eciProgressionScore}
                repartitionPhases={eciRepartitionPhases}
                potentiel={eciPotentiel}
                referentiel="eci"
                title={referentielToName.eci}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

// affiche un titre au-dessus d'une carte
const TitreSection = ({children}: {children: ReactNode}) => (
  <h5 className="text-xl leading-5 font-extrabold">{children}</h5>
);

export default Accueil;
