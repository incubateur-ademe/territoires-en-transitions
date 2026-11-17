import { useIndicateurDefinition } from './indicateur-definition.context';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { Field } from '@tet/ui';

type Props = {
  disabled?: boolean;
};

export const ThematiquesIndicateurInput = ({ disabled }: Props) => {
  const { indicateur, updateIndicateur } = useIndicateurDefinition();
  const thematiques = indicateur.thematiques || [];

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
