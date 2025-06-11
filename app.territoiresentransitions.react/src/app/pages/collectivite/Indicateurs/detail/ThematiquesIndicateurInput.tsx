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
    useUpsertIndicateurThematiques({
      id: definition.id,
      estPerso: definition.estPerso,
    });

  return (
    <Field title="Thématique">
      <ThematiquesDropdown
        values={thematiques}
        onChange={upsertIndicateurPersoThematique}
        disabled={disabled}
      />
    </Field>
  );
};

export default ThematiquesIndicateurInput;
