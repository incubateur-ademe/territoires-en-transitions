'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import { ReferentielCardSkeleton } from '@/app/referentiels/tableau-de-bord/referentiel-card.skeleton';
import { ReferentielCard } from '@/app/referentiels/tableau-de-bord/referentiel.card';
import { ModaleReferents } from '@/app/referentiels/tableau-de-bord/referents/ModaleReferents';
import { ReferentsList } from '@/app/referentiels/tableau-de-bord/referents/ReferentsList';
import {
  groupeParFonction,
  useMembres,
} from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { useProgressionReferentiel } from '@/app/referentiels/tableau-de-bord/useProgressionReferentiel';
import { Button } from '@/ui';
import { useState } from 'react';

/**
 * Affiche la page d'accueil d'une collectivité
 */
export const TableauDeBordShow = () => {
  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const {
    caeTable: caeProgressionScore,
    eciTable: eciProgressionScore,
    caeRepartitionPhases,
    eciRepartitionPhases,
    caePotentiel,
    eciPotentiel,
    isCaeLoading,
    isEciLoading,
  } = useProgressionReferentiel();

  const { data: referents } = useMembres({ collectiviteId, estReferent: true });
  const referentsParFonction = groupeParFonction(referents || []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        data-test="TableauBord"
        className="flex flex-row justify-between content-center pb-4 mb-4 border-b border-b-primary-3"
      >
        <h2 className="mb-0">{"Synthèse de l'état des lieux"}</h2>
        {!isReadOnly && (
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
        {isCaeLoading ? (
          <ReferentielCardSkeleton />
        ) : (
          <ReferentielCard
            isReadonly={isReadOnly}
            collectiviteId={collectiviteId}
            progressionScore={caeProgressionScore}
            repartitionPhases={caeRepartitionPhases}
            potentiel={caePotentiel}
            referentiel="cae"
            title={referentielToName.cae}
          />
        )}
        {/** Écomomie circulaire */}
        {isEciLoading ? (
          <ReferentielCardSkeleton />
        ) : (
          <ReferentielCard
            isReadonly={isReadOnly}
            collectiviteId={collectiviteId}
            progressionScore={eciProgressionScore}
            repartitionPhases={eciRepartitionPhases}
            potentiel={eciPotentiel}
            referentiel="eci"
            title={referentielToName.eci}
          />
        )}
      </div>

      {!isReadOnly && isModalOpen && (
        <ModaleReferents
          collectiviteId={collectiviteId}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      )}
    </>
  );
};
