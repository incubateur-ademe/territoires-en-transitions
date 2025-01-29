import { useRemoveFicheFromAxe } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useRemoveFicheFromAxe';
import { usePlanActionChemin } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlanActionChemin';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Icon } from '@/ui';

type CheminEmplacementProps = {
  ficheId: number;
  axeId: number;
};

const CheminEmplacement = ({ ficheId, axeId }: CheminEmplacementProps) => {
  const { data } = usePlanActionChemin(axeId);
  const { chemin } = data ?? {};

  const { mutate: removeFicheFromAxe } = useRemoveFicheFromAxe();

  if (!chemin || chemin?.length === 0) return null;

  return (
    <div className="border border-grey-3 rounded-lg flex divide-x-[0.5px] divide-primary-3 py-3 items-center w-fit">
      {/* Bouton de suppression d'un emplacement */}
      <div className="px-5 py-2">
        <DeleteButton
          data-test="EnleverFichePlanBouton"
          title="Supprimer l'emplacement"
          variant="grey"
          size="sm"
          className="m-auto"
          onClick={() =>
            removeFicheFromAxe({
              axe_id: axeId,
              fiche_id: ficheId,
            })
          }
        />
      </div>

      {/* Emplacement */}
      <div className="grid grid-flow-col auto-cols-[16rem] divide-x-[0.5px] divide-primary-3">
        {chemin.map((axe, index) => (
          <div
            key={axe.id}
            className="text-base text-primary-9 font-medium px-5 py-2 flex items-center justify-between gap-2"
          >
            {axe.nom}
            {index < chemin.length - 1 && <Icon icon="arrow-right-s-line" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheminEmplacement;
