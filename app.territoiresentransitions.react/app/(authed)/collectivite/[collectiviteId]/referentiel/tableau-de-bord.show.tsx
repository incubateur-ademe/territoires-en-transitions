'use client';

import { referentielToName } from '@/app/app/labels';
import {
  CurrentCollectivite,
  useCurrentCollectivite,
} from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ReferentielCard } from '@/app/referentiels/tableau-de-bord/referentiel.card';
import { ModaleReferents } from '@/app/referentiels/tableau-de-bord/referents/ModaleReferents';
import { ReferentsList } from '@/app/referentiels/tableau-de-bord/referents/ReferentsList';
import {
  groupeParFonction,
  useMembres,
} from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { useProgressionReferentiel } from '@/app/referentiels/tableau-de-bord/useProgressionReferentiel';
import { Button } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { useState } from 'react';

/**
 * Affiche la page d'accueil d'une collectivité
 */
export const TableauDeBordShow = () => {
  const collectivite = useCurrentCollectivite();

  return (
    collectivite && <AccueilNonConfidentielle collectivite={collectivite} />
  );
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

  const { collectiviteId: collectiviteId, isReadOnly: readonly } = collectivite;
  const { data: referents } = useMembres({ collectiviteId, estReferent: true });
  const referentsParFonction = groupeParFonction(referents || []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <PageContainer dataTest="TableauBord" bgColor="primary">
      {!!collectiviteId && (
        <>
          <div className="flex flex-row justify-between content-center pb-4 mb-4 border-b border-b-primary-3">
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
            <ReferentielCard
              isReadonly={readonly}
              collectiviteId={collectiviteId}
              progressionScore={caeProgressionScore}
              repartitionPhases={caeRepartitionPhases}
              potentiel={caePotentiel}
              referentiel="cae"
              title={referentielToName.cae}
            />
            {/** Écomomie circulaire */}
            <ReferentielCard
              isReadonly={readonly}
              collectiviteId={collectiviteId}
              progressionScore={eciProgressionScore}
              repartitionPhases={eciRepartitionPhases}
              potentiel={eciPotentiel}
              referentiel="eci"
              title={referentielToName.eci}
            />
          </div>
        </>
      )}

      {!readonly && isModalOpen && (
        <ModaleReferents
          collectiviteId={collectiviteId}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      )}
    </PageContainer>
  );
};
