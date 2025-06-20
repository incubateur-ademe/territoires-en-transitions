import { useGetThematiqueOptions } from '@/app/ui/dropdownLists/ThematiquesDropdown/use-get-thematique-and-sous-thematique-options';
import { Thematique } from '@/domain/shared';
import { SelectFilter, SelectMultipleProps } from '@/ui';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: number[];
  onChange: (selectedThematiques: Thematique[]) => void;
};

const ThematiquesDropdown = (props: Props) => {
  const { thematiqueOptions, thematiqueListe } = useGetThematiqueOptions();

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'thematiques'}
      options={thematiqueOptions}
      onChange={({ values }) => {
        const selectedThematiques = thematiqueListe.filter((t) =>
          values?.some((v) => v === t.id)
        );
        props.onChange(selectedThematiques);
      }}
    />
  );
};

export default ThematiquesDropdown;
