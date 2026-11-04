import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { useUpdateIndicateur } from '@/app/indicateurs/indicateurs/use-update-indicateur';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { Field } from '@tet/ui';

type Props = {
  indicateur: IndicateurDetaille;
  disabled?: boolean;
};

export const ThematiquesIndicateurInput = ({ indicateur, disabled }: Props) => {
  const thematiques = indicateur.thematiques || [];

  const { mutate: updateIndicateur } = useUpdateIndicateur(indicateur.id);

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
