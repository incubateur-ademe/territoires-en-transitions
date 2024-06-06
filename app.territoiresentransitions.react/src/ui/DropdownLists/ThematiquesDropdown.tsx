import {Option, OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {useThematiqueListe} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/useThematiqueListe';
import {TThematiqueRow} from 'types/alias';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: number[];
  onChange: (thematiques: TThematiqueRow[]) => void;
};

const ThematiquesDropdown = (props: Props) => {
  const {data: thematiqueListe} = useThematiqueListe();

  const options: Option[] = thematiqueListe
    ? thematiqueListe.map(thematique => ({
        value: thematique.id,
        label: thematique.nom,
      }))
    : [];

  const getSelectedThematiques = (values?: OptionValue[]) =>
    thematiqueListe?.filter(t => values?.some(v => v === t.id)) ?? [];

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'thematiques'}
      options={options}
      onChange={({values}) => props.onChange(getSelectedThematiques(values))}
    />
  );
};

export default ThematiquesDropdown;
