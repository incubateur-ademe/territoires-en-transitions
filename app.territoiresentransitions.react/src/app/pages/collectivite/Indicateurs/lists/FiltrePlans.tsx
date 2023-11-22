import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {usePlansActionsListe} from '../../PlansActions/PlanAction/data/usePlansActionsListe';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {generateTitle} from '../../PlansActions/FicheAction/data/utils';

type Props = {
  values: string[] | undefined;
  onSelect: (values: string[]) => void;
};

const FiltrePlans = ({values, onSelect}: Props) => {
  const collectivite_id = useCollectiviteId();
  const data = usePlansActionsListe(collectivite_id!);
  const plans = data?.plans;

  const options: TOption[] = plans
    ? [
        {value: ITEM_ALL, label: 'Tous'},
        ...plans.map(plan => ({
          value: `${plan.id}`,
          label: generateTitle(plan.nom),
        })),
      ]
    : [];

  return (
    <AutocompleteInputSelect
      data-test="plans"
      buttonClassName={DSFRbuttonClassname}
      values={values?.includes(ITEM_ALL) ? [] : values}
      options={options}
      onSelect={values => onSelect(values)}
    />
  );
};

export default FiltrePlans;
