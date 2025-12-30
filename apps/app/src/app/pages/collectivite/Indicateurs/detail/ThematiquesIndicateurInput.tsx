import { IndicateurDefinition } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { Field } from '@tet/ui';

type Props = {
  definition: IndicateurDefinition;
  disabled?: boolean;
};

export const ThematiquesIndicateurInput = ({ definition, disabled }: Props) => {
  const thematiques = definition.thematiques || [];

  const { mutate: updateIndicateur } = useUpdateIndicateur(definition.id);

  const handleOnChange = (selectedThematiqueIds: number[]) => {
    updateIndicateur({
      thematiques: selectedThematiqueIds.map((t) => ({ id: t })),
    });
  };

  return (
    <Field title="Thématique">
      <ThematiquesDropdown
        values={thematiques.map((t) => t.id)}
        onChange={handleOnChange}
        disabled={disabled}
      />
    </Field>
  );
};
