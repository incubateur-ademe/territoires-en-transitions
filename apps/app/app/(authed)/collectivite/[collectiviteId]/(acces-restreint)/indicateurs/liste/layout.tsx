'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import ModaleCreerIndicateur from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import { Button } from '@/ui';
import { ReactNode, useState } from 'react';

/**
 * Affiche le bouton de création d'un indicateur perso et
 * les onglets ("Indicateurs clés", etc.)
 */
export default function Layout({ tabs }: { tabs: ReactNode }) {
  const { isReadOnly } = useCurrentCollectivite();
  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between max-sm:flex-col gap-y-4">
        <h2 className="mb-0 mr-auto">Listes d&apos;indicateurs</h2>
        {!isReadOnly && (
          <>
            <Button
              data-test="create-perso"
              size="sm"
              onClick={() => setIsNewIndicateurOpen(true)}
            >
              Créer un indicateur
            </Button>
            {isNewIndicateurOpen && (
              <ModaleCreerIndicateur
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
