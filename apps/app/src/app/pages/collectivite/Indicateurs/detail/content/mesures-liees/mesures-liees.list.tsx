import ActionLinkedCard from '@/app/referentiels/actions/action.linked-card';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useIndicateurMesuresLiees } from '../../context/indicateur-mesures-liees.context';

type MesuresLieesListeProps = {
  isReadonly: boolean;
  mesuresIds: string[];
};

export const MesuresLieesListe = ({
  isReadonly,
  mesuresIds,
}: MesuresLieesListeProps) => {
  const { useListMesuresLiees } = useIndicateurMesuresLiees();
  const { mesures, isLoading } = useListMesuresLiees(mesuresIds);

  if (isLoading) {
    return <SpinnerLoader className="mx-auto my-8" />;
  }

  if (mesures.length === 0) return null;

  return (
    // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {mesures.map((mesure) => (
          <ActionLinkedCard
            key={mesure.actionId}
            isReadonly={isReadonly}
            action={mesure}
            openInNewTab
          />
        ))}
      </div>
    </div>
  );
};
