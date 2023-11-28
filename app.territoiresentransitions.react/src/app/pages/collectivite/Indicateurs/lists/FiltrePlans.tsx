import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import {ITEM_ALL} from 'ui/shared/filters/commons';
import AutocompleteInputSelect from 'ui/shared/select/AutocompleteInputSelect';
import {usePlansActionsListe} from '../../PlansActions/PlanAction/data/usePlansActionsListe';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {generateTitle} from '../../PlansActions/FicheAction/data/utils';

export const ITEM_FICHES_NON_CLASSEES = 'nc';

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
        {value: ITEM_FICHES_NON_CLASSEES, label: 'Fiches non classées'},
        ...plans.map(plan => ({
          value: `${plan.id}`,
          label: generateTitle(plan.nom),
        })),
      ]
    : [];

  const handleSelect = (newValues: string[]) => {
    // supprime le choix ITEM_FICHES_NON_CLASSEES quand on sélectionne d'autres options
    onSelect(
      values?.includes(ITEM_FICHES_NON_CLASSEES) && newValues?.length > 1
        ? newValues.filter(v => v !== ITEM_FICHES_NON_CLASSEES)
        : newValues
    );
  };

  return (
    <AutocompleteInputSelect
      data-test="plans"
      buttonClassName={DSFRbuttonClassname}
      values={getValues(values)}
      options={options}
      onSelect={handleSelect}
    />
  );
};

export default FiltrePlans;

const getValues = (values: string[] | undefined) => {
  // les choix ITEM_ALL ou ITEM_FICHES_NON_CLASSEES sont exclusifs
  if (values?.includes(ITEM_ALL)) {
    return [];
  }
  if (values?.includes(ITEM_FICHES_NON_CLASSEES)) {
    return [ITEM_FICHES_NON_CLASSEES];
  }
  return values;
};
