import {DSFRbuttonClassname, TOption} from 'ui/shared/select/commons';
import MultiSelectTagsDropdown from 'ui/shared/select/MultiSelectTagsDropdown';
import {TThematiqueRow} from 'types/alias';
import {useThematiqueListe} from '../../PlansActions/FicheAction/data/options/useThematiqueListe';

type Props = {
  values: string[] | undefined;
  onSelect: (thematique: TThematiqueRow[]) => void;
  isReadonly: boolean;
};

const ThematiquesDropdown = ({values, onSelect, isReadonly}: Props) => {
  const {data: thematiqueListe} = useThematiqueListe();

  const options: TOption[] = thematiqueListe
    ? thematiqueListe.map(thematique => ({
        value: `${thematique.id}`,
        label: thematique.nom,
      }))
    : [];

  const formatThematiques = (values: string[]) =>
    thematiqueListe?.filter(thematique =>
      values.some(v => v === `${thematique.id}`)
    ) ?? [];

  return (
    <MultiSelectTagsDropdown
      data-test="thematiques"
      buttonClassName={DSFRbuttonClassname}
      values={values}
      options={options}
      onSelect={values => onSelect(formatThematiques(values))}
      disabled={isReadonly}
    />
  );
};

export default ThematiquesDropdown;
