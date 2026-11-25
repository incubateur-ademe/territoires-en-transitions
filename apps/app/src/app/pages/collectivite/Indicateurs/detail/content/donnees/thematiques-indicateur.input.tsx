import { appLabels } from '@/app/labels/catalog';
import ThematiquesDropdown from '@/app/shared/thematiques/thematiques.dropdown';
import { Field } from '@tet/ui';
import { useIndicateurData } from '../../context/indicateur-data.context';
import { useIndicateurActions } from '../../context/indicateur-actions.context';

type Props = {
  disabled?: boolean;
};

export const ThematiquesIndicateurInput = ({ disabled }: Props) => {
  const { indicateur } = useIndicateurData();
  const { updateIndicateur } = useIndicateurActions();
  const thematiques = indicateur.thematiques || [];

  const handleOnChange = (selectedThematiqueIds: number[]) => {
    updateIndicateur({
      thematiques: selectedThematiqueIds.map((t) => ({ id: t })),
    });
  };

  return (
    <Field title={appLabels.thematique()}>
      <ThematiquesDropdown
        values={thematiques.map((t) => t.id)}
        onChange={handleOnChange}
        disabled={disabled}
      />
    </Field>
  );
};
