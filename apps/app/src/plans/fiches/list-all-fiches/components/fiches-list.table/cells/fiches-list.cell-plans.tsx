import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { FicheWithRelationsAndCollectivite } from '@/domain/plans';

type Props = {
  plans: FicheWithRelationsAndCollectivite['plans'] | null;
};

export const FichesListCellPlans = ({ plans }: Props) => {
  if (!plans || plans.length === 0) return null;

  return (
    <ListWithTooltip
      title={plans[0].nom}
      list={plans.map((p) => generateTitle(p.nom))}
      className="text-grey-8"
      renderFirstItem={(item) => (
        <span className="max-w-48 line-clamp-2">{item}</span>
      )}
    />
  );
};
