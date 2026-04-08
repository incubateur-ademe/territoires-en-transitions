import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { useListPersonnalisationThematiques } from '../data/use-list-personnalisation-thematiques';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  collectiviteId: number;
  values?: string[];
  onChange: (selectedThematiqueIds: string[]) => void;
};

export const PersonnalisationThematiquesDropdown = (props: Props) => {
  const { collectiviteId, onChange } = props;
  const { data: thematiques } =
    useListPersonnalisationThematiques(collectiviteId);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'personnalisation-thematiques'}
      options={thematiques?.map((t) => ({ label: t.nom, value: t.id })) || []}
      onChange={({ values }) => {
        const selectedThematiqueIds =
          thematiques
            ?.filter((t) => values?.some((v) => v === t.id))
            .map((t) => t.id) || [];
        onChange(selectedThematiqueIds);
      }}
    />
  );
};
