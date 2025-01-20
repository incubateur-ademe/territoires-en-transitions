import ModaleCreerIndicateur from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import { EmptyCard, useEventTracker } from '@/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const EmptyIndicateurFavori = () => {
  const tracker = useEventTracker('app/indicateurs/collectivite');
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;

  const router = useRouter();

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  return (
    <>
      <EmptyCard
        picto={(props) => <PictoDashboard {...props} />}
        title="Vous n'avez pas encore d'indicateur"
        description="Ajoutez les depuis notre bibliothèque ou créez vos propres indicateurs."
        actions={[
          {
            children: 'Explorer les indicateurs',
            onClick: () => {
              tracker('explorerIndicateursClick', {
                collectiviteId,
                niveauAcces,
                role,
              });
              router.push(
                makeCollectiviteTousLesIndicateursUrl({
                  collectiviteId,
                })
              );
            },
          },
          {
            children: 'Créer un indicateur',
            onClick: () => setIsNewIndicateurOpen(true),
            variant: 'outlined',
          },
        ]}
      />
      {isNewIndicateurOpen && (
        <ModaleCreerIndicateur
          isOpen={isNewIndicateurOpen}
          setIsOpen={setIsNewIndicateurOpen}
          isFavoriCollectivite
        />
      )}
    </>
  );
};

export default EmptyIndicateurFavori;
