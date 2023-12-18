import FormField from 'ui/shared/form/FormField';
import {SOURCE_COLLECTIVITE} from './useImportSources';
import SelectDropdown from 'ui/shared/select/SelectDropdown';
import {DSFRbuttonClassname} from 'ui/shared/select/commons';

/**
 * Affiche la liste déroulante des sources de données d'un indicateur, lorsqu'il
 * y en a plusieurs. Sinon rien n'est affiché.
 */
export const ImportSourcesDropdown = ({
  sources,
  currentSource,
  setCurrentSource,
}: {
  sources?: string[] | null;
  currentSource?: string;
  setCurrentSource?: (value: string) => void;
}) => {
  return sources?.length && setCurrentSource ? (
    <FormField label="Source de données">
      <SelectDropdown
        buttonClassName={DSFRbuttonClassname}
        options={[
          {label: 'Données de la collectivité', value: SOURCE_COLLECTIVITE},
          ...sources.map(label => ({label, value: label})),
        ]}
        value={currentSource}
        onSelect={setCurrentSource}
      />
    </FormField>
  ) : null;
};
