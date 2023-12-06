import SelectDropdown from 'ui/shared/select/SelectDropdown';
import {DSFRbuttonClassname, TOptionSection} from 'ui/shared/select/commons';
import {usePlanTypeListe} from './data/usePlanTypeListe';
import FormField from 'ui/shared/form/FormField';
import {TPlanType} from 'types/alias';

type Props = {
  type?: number;
  onSelect: (type: TPlanType) => void;
};

const PlanTypeDropdown = ({type, onSelect}: Props) => {
  const liste = usePlanTypeListe();

  const options = liste?.reduce((acc: TOptionSection[], curr) => {
    if (!acc.some(v => v.title === curr.categorie)) {
      acc.push({
        title: curr.categorie,
        options: [
          {
            value: curr.id.toString(),
            label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
          },
        ],
      });
    } else {
      acc[acc.findIndex(v => v.title === curr.categorie)].options.push({
        value: curr.id.toString(),
        label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
      });
    }
    return acc;
  }, []);

  if (!liste) return null;

  return (
    <FormField label="Type de plan d’action">
      <SelectDropdown
        data-test="Type"
        containerWidthMatchButton
        buttonClassName={DSFRbuttonClassname + 'bg-white'}
        options={options ?? []}
        value={type?.toString()}
        onSelect={value => onSelect(liste.find(t => t.id === parseInt(value))!)}
        placeholderText="Sélectionner une option"
      />
    </FormField>
  );
};

export default PlanTypeDropdown;
