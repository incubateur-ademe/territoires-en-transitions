'use client';

import { CreateIndicateurModal } from '@/app/plans/fiches/show-fiche/content/indicateurs/create-indicateur.modal';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { ReactNode, useState } from 'react';

/**
 * Affiche le bouton de création d'un indicateur perso et
 * les onglets ("Indicateurs clés", etc.)
 */
export default function Layout({ tabs }: { tabs: ReactNode }) {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between max-sm:flex-col gap-y-4">
        <h2 className="mb-0 mr-auto">Listes d&apos;indicateurs</h2>
        {hasCollectivitePermission('indicateurs.indicateurs.create') && (
          <>
            <Button
              data-test="create-perso"
              size="sm"
              onClick={() => setIsNewIndicateurOpen(true)}
            >
              Créer un indicateur
            </Button>
            {isNewIndicateurOpen && (
              <CreateIndicateurModal
                isOpen={isNewIndicateurOpen}
                setIsOpen={setIsNewIndicateurOpen}
              />
            )}
          </>
        )}
      </div>
      {tabs}
    </>
  );
}
