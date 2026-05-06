import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { generateTitle } from '@/app/utils/generate-title';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';

type Props = {
  plans: FicheWithRelationsAndCollectivite['plans'] | null;
};

export const FichesListCellPlans = ({ plans }: Props) => (
  <TableCell>
    {!plans || plans.length === 0 ? (
      <span className="text-grey-8">Sans plan</span>
    ) : (
      <ListWithTooltip
        title={plans[0].nom}
        list={plans.map((p) => generateTitle(p.nom))}
        className="text-grey-8"
        renderFirstItem={(item) => (
          <span className="max-w-48 line-clamp-2">{item}</span>
        )}
      />
    )}
  </TableCell>
);
