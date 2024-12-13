import { referentielToName } from '@/app/app/labels';
import { useAuth } from '@/app/core-logic/api/auth/AuthProvider';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from '@/app/core-logic/hooks/useCurrentCollectivite';
import { Button } from '@/ui';
import { useState } from 'react';
import { useProgressionReferentiel } from './data/useProgressionReferentiel';
import EtatDesLieux from './EtatDesLieux/EtatDesLieux';
import { ModaleReferents } from './EtatDesLieux/referents/ModaleReferents';
import { ReferentsList } from './EtatDesLieux/referents/ReferentsList';
import {
  groupeParFonction,
  useMembres,
} from './EtatDesLieux/referents/useMembres';

/**
 * Affiche la page d'accueil d'une collectivité
 */
const Accueil = (): JSX.Element => {
  const collectivite = useCurrentCollectivite();

  const { user } = useAuth();

  if (!collectivite?.collectivite_id) return <></>;

  /** Vérifie que l'utilisateur peut accéder à la collectivité */
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
  return <AccueilNonConfidentielle collectivite={collectivite} />;
};

/** Affiche le tableau de bord de l'accueil pour les utilisateurs avec les droits nécessaires */
const AccueilNonConfidentielle = ({
  collectivite,
}: {
  collectivite: CurrentCollectivite;
}) => {
  const {
    caeTable: caeProgressionScore,
    eciTable: eciProgressionScore,
    caeRepartitionPhases,
    eciRepartitionPhases,
    caePotentiel,
    eciPotentiel,
  } = useProgressionReferentiel();

  const { collectivite_id: collectiviteId, readonly } = collectivite;
  const { data: referents } = useMembres({ collectiviteId, estReferent: true });
  const referentsParFonction = groupeParFonction(referents || []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main data-test="TableauBord" className="bg-bf975 -mb-8">
      {!!collectiviteId && (
        <div className="fr-container flex flex-col pt-8 pb-16">
          <div className="flex flex-row justify-between content-center py-4 mb-4 border-b border-b-primary-3">
            <h2 className="mb-0">{"Synthèse de l'état des lieux"}</h2>
            {!readonly && (
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                {referents?.length
                  ? 'Modifier les référents'
                  : 'Renseigner les référents'}
              </Button>
            )}
          </div>
          <div className="mb-8">
            <ReferentsList
              nomFonction="Chef·fe de projet"
              referents={referentsParFonction?.technique}
            />
            <ReferentsList
              nomFonction="Élu·e"
              referents={referentsParFonction?.politique}
            />
            <ReferentsList
              nomFonction="Conseiller·ère"
              referents={referentsParFonction?.conseiller}
            />
          </div>
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
      )}

      {!readonly && isModalOpen && (
        <ModaleReferents
          collectiviteId={collectiviteId}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      )}
    </main>
  );
};

export default Accueil;
