'use client';

import { referentielToName } from '@/app/app/labels';
import { ReferentielCard } from '@/app/referentiels/tableau-de-bord/referentiel.card';
import { ModaleReferents } from '@/app/referentiels/tableau-de-bord/referents/ModaleReferents';
import { ReferentsList } from '@/app/referentiels/tableau-de-bord/referents/ReferentsList';
import {
  groupeParFonction,
  useMembres,
} from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, PageHeader, VisibleWhen } from '@tet/ui';
import { useState } from 'react';

/**
 * Affiche la page d'accueil d'une collectivité
 */
export const TableauDeBordShow = () => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const { data: referents } = useMembres({ collectiviteId, estReferent: true });
  const referentsParFonction = groupeParFonction(referents?.membres || []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const canMutateReferentiel = hasCollectivitePermission('referentiels.mutate');

  return (
    <>
      <PageHeader>
        <PageHeader.Title>
          {"Synthèse de l'état des lieux"}
        </PageHeader.Title>
        {canMutateReferentiel && (
          <PageHeader.Actions>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              {referents?.membres?.length
                ? 'Modifier les référents'
                : 'Renseigner les référents'}
            </Button>
          </PageHeader.Actions>
        )}
      </PageHeader>
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
        <ReferentielCard
          isReadonly={!canMutateReferentiel}
          collectiviteId={collectiviteId}
          referentiel="cae"
          title={referentielToName.cae}
        />
        <ReferentielCard
          isReadonly={!canMutateReferentiel}
          collectiviteId={collectiviteId}
          referentiel="eci"
          title={referentielToName.eci}
        />
      </div>

      <VisibleWhen condition={canMutateReferentiel && isModalOpen}>
        <ModaleReferents
          collectiviteId={collectiviteId}
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
        />
      </VisibleWhen>
    </>
  );
};
