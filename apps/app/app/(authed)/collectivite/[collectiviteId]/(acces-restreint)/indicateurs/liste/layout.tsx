'use client';

import { appLabels } from '@/app/labels/catalog';
import { CreateIndicateurModal } from '@/app/plans/fiches/show-fiche/content/indicateurs/create-indicateur.modal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, PageHeader } from '@tet/ui';
import { ReactNode, useState } from 'react';

/**
 * Affiche le bouton de création d'un indicateur perso et
 * les onglets ("Indicateurs clés", etc.)
 */
export default function Layout({ tabs }: { tabs: ReactNode }) {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  const canCreate = hasCollectivitePermission('indicateurs.indicateurs.create');

  return (
    <>
      <PageHeader>
        <PageHeader.Title>
          appLabels.navListesIndicateurs
        </PageHeader.Title>
        {canCreate && (
          <PageHeader.Actions>
            <Button
              data-test="create-perso"
              size="sm"
              onClick={() => setIsNewIndicateurOpen(true)}
            >
              {appLabels.creerIndicateur}
            </Button>
          </PageHeader.Actions>
        )}
      </PageHeader>
      {canCreate && isNewIndicateurOpen && (
        <CreateIndicateurModal
          isOpen={isNewIndicateurOpen}
          setIsOpen={setIsNewIndicateurOpen}
        />
      )}
      {tabs}
    </>
  );
}
