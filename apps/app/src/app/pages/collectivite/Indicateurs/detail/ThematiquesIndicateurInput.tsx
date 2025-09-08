import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { useUpdateIndicateurDefinition } from '@/app/indicateurs/definitions/use-update-indicateur-definition';
import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { Field } from '@/ui';

type Props = {
  definition: IndicateurDefinition;
  disabled?: boolean;
};

export const ThematiquesIndicateurInput = ({ definition, disabled }: Props) => {
  const thematiques = definition.thematiques || [];

  const { mutate: updateIndicateur } = useUpdateIndicateurDefinition(
    definition.id
  );

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
