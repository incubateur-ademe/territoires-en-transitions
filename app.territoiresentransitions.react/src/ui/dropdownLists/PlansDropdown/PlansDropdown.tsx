import {Option, SelectMultiple} from '@tet/ui';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {generateTitle} from '../../../app/pages/collectivite/PlansActions/FicheAction/data/utils';
import {usePlansActionsListe} from 'app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import {TAxeRow} from 'types/alias';

type Props = {
  plans: TAxeRow[] | null;
  onChange: (plans: TAxeRow[] | null) => void;
  isReadonly?: boolean;
};

const PlansDropdown = ({plans, onChange, isReadonly}: Props) => {
  const collectivite_id = useCollectiviteId();

  const data = usePlansActionsListe(collectivite_id!);

  const planListe = data?.plans;

  const options: Option[] | undefined = planListe?.map(plan => ({
    value: plan.id,
    label: generateTitle(plan.nom),
  }));

  if (!options) return null;

  return (
    <SelectMultiple
      options={options}
      values={plans?.map((plan: TAxeRow) => plan.id)}
      onChange={({values}) => {
        const plans = planListe?.filter(
          p => values && values.some(v => p.id === v)
        );
        onChange(plans && plans.length > 0 ? plans : null);
      }}
      disabled={isReadonly}
    />
  );
};

export default PlansDropdown;
