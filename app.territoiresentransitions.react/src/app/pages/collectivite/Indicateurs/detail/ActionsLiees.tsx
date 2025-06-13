import { EmptyCard } from '@/ui';
import ActionPicto from '../../PlansActions/FicheAction/ActionsLiees/ActionPicto';
import ActionsLieesListe from '../../PlansActions/FicheAction/ActionsLiees/ActionsLieesListe';

type Props = {
  actionsIds: string[];
};

const ActionsLiees = ({ actionsIds }: Props) => {
  const isEmpty = actionsIds.length === 0;

  if (isEmpty) {
    return (
      <EmptyCard
        picto={(props) => <ActionPicto {...props} />}
        title="Aucune mesure des référentiels n'est liée !"
        size="xs"
      />
    );
  }

  return (
    <div className="bg-white p-10 border border-grey-3 rounded-xl">
      <div className="w-full border-b border-primary-3 mb-6">
        <h6 className="text-lg h-[2.125rem] mb-5">
          Mesures des référentiels liées
        </h6>
      </div>
      <ActionsLieesListe actionIds={actionsIds} />
    </div>
  );
};

export default ActionsLiees;
