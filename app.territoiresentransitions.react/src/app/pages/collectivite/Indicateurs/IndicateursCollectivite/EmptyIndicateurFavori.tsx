import { EmptyCard, useEventTracker } from '@/ui';
import ModaleCreerIndicateur from 'app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import { makeCollectiviteTousLesIndicateursUrl } from 'app/paths';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PictoDashboard from 'ui/pictogrammes/PictoDashboard';

type Props = {
  collectiviteId: number;
  isReadonly: boolean;
};

const EmptyIndicateurFavori = ({ collectiviteId, isReadonly }: Props) => {
  const tracker = useEventTracker('app/indicateurs/collectivite');

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
                collectivite_id: collectiviteId!,
              });
              router.push(
                makeCollectiviteTousLesIndicateursUrl({
                  collectiviteId: collectiviteId!,
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
