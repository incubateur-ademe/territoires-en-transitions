import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import CheminEmplacement from './CheminEmplacement';

type EmplacementActuelFicheProps = {
  fiche: FicheWithRelations;
};

const EmplacementActuelFiche = ({ fiche }: EmplacementActuelFicheProps) => {
  const collectiviteId = useCollectiviteId();
  const { mutate: updateFiche } = useUpdateFiche();

  const filteredAxes = fiche.axes?.filter(
    (axe) => axe.collectiviteId === collectiviteId
  );
  const nbEmplacements = filteredAxes?.length ?? 0;

  const removeAxeFromFiche = ({ axeId }: { axeId: number }) => {
    const updatedAxes =
      fiche.axes
        ?.filter((axe) => axe.id !== axeId)
        .map((currentAxe) => ({
          id: currentAxe.id,
        })) || [];
    updateFiche({
      ficheId: fiche.id,
      ficheFields: {
        axes: updatedAxes,
      },
    });
  };

  return (
    <div>
      {/* Indique le nombre d'emplacements actuel */}
      <h6 className="text-sm">
        {nbEmplacements !== 0
          ? `${nbEmplacements} emplacement${
              nbEmplacements > 1 ? 's' : ''
            } sélectionné${nbEmplacements > 1 ? 's' : ''} pour cette fiche`
          : "Cette fiche n'a pas encore d'emplacement sélectionné"}
      </h6>

      {/* Liste des emplacements */}
      <div className="flex flex-col gap-6 overflow-x-auto pb-4">
        {filteredAxes?.map(
          (axe) =>
            !!axe.id && (
              <CheminEmplacement
                key={`${fiche.id}-${axe.id}`}
                ficheId={fiche.id}
                axeId={axe.id}
                onRemoveAxe={removeAxeFromFiche}
              />
            )
        )}
      </div>
    </div>
  );
};

export default EmplacementActuelFiche;
