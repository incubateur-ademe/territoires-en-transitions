import { EmptyCard } from '@/ui';
import ActionPicto from '../../PlansActions/FicheAction/ActionsLiees/ActionPicto';
import ActionsLieesListe from '../../PlansActions/FicheAction/ActionsLiees/ActionsLieesListe';

type Props = {
  actionsIds: string[];
};

const ActionsLiees = ({ actionsIds }: Props) => {
  const isEmpty = actionsIds.length === 0;

  return isEmpty ? (
    <EmptyCard
      picto={(props) => <ActionPicto {...props} />}
      title="Aucune action des référentiels n'est liée !"
      size="xs"
    />
  ) : (
    <div>
      <div className="w-full border-b border-primary-3 mb-6">
        <h6 className="text-lg h-[2.125rem] mb-5">
          Actions du référentiel associées
        </h6>
      </div>
      <ActionsLieesListe
        actionsIds={actionsIds}
        className="sm:grid-cols-2 md:grid-cols-3"
      />
    </div>
  );
};

export default ActionsLiees;
