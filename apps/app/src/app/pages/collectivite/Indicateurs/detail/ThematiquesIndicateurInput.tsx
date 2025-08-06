import ThematiquesDropdown from '@/app/ui/dropdownLists/ThematiquesDropdown/ThematiquesDropdown';
import { Field } from '@/ui';
import {
  useIndicateurThematiques,
  useUpsertIndicateurThematiques,
} from '../Indicateur/detail/useIndicateurThematiques';
import { TIndicateurDefinition } from '../types';

type Props = {
  definition: TIndicateurDefinition;
  disabled?: boolean;
};

const ThematiquesIndicateurInput = ({ definition, disabled }: Props) => {
  const { data: thematiques } = useIndicateurThematiques(definition.id);

  const { mutate: upsertIndicateurPersoThematique } =
    useUpsertIndicateurThematiques();

  const handleOnChange = (selectedThematiques: number[]) => {
    upsertIndicateurPersoThematique({
      collectiviteId: definition.collectiviteId!,
      indicateurId: definition.id,
      indicateurThematiqueIds: selectedThematiques,
    });
  };

  return (
    <Field title="Thématique">
      <ThematiquesDropdown
        values={(thematiques || []).map((t) => t.id)}
        onChange={handleOnChange}
        disabled={disabled}
      />
    </Field>
  );
};

export default ThematiquesIndicateurInput;
