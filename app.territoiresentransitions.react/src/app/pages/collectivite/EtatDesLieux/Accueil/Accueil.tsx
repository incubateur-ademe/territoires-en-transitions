import { ReactNode } from 'react';
import { referentielToName } from 'app/labels';
import { useProgressionReferentiel } from './data/useProgressionReferentiel';
import EtatDesLieux from './EtatDesLieux/EtatDesLieux';
import IndicateursCard from './IndicateursCard';
import PlansActionCard from './PlansActionCard';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';
import { useAuth } from 'core-logic/api/auth/AuthProvider';

/**
 * Affiche la page d'accueil d'une collectivité
 */
const Accueil = (): JSX.Element => {
  const collectivite = useCurrentCollectivite();

  const { user } = useAuth();

  if (!collectivite?.collectivite_id) return <></>;

  /** Vérifi que l'utilisateur peut accéder à la collectivité */
  const hasNoAccessToCollectivite =
    collectivite.acces_restreint &&
    collectivite.niveau_acces === null &&
    !user?.isSupport &&
    !collectivite.est_auditeur;

  /** S'il ne peut pas, on affiche un message */
  if (hasNoAccessToCollectivite) {
    return (
      <div className="flex-grow flex">
        <div className="m-auto text-grey-7">
          Cette collectivité n’est pas accessible en mode visite.
        </div>
      </div>
    );
  }

  /** Sinon on affiche la page.
   * Ceci permet de ne pas appeler `useProgressionReferentiel`
   * qui ne marche pas si l'utilisateur n'a pas les droits */
  return (
    <AccueilNonConfidentielle collectiviteId={collectivite.collectivite_id} />
  );
};

/** Affiche le tableau de bord de l'accueil pour les utilisateurs avec les droits nécessaires */
const AccueilNonConfidentielle = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
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
          {/* <div className="grid lg:grid-cols-2 gap-x-6 gap-y-16">
            <div className="flex flex-col">
              <TitreSection>Plans d'action</TitreSection>
              <PlansActionCard collectiviteId={collectiviteId} />
            </div>
            <div className="flex flex-col">
              <TitreSection>Indicateurs</TitreSection>
              <IndicateursCard collectiviteId={collectiviteId} />
            </div>
          </div> */}

          {/* États des lieux */}
          <div>
            {/* <TitreSection>État des lieux</TitreSection> */}
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
const TitreSection = ({ children }: { children: ReactNode }) => (
  <h5 className="text-xl leading-5 font-extrabold">{children}</h5>
);

export default Accueil;
