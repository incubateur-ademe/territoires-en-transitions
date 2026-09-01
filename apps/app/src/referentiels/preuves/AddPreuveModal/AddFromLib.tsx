import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { getExtension } from '@/app/utils/file';
import { Button, Field, Icon, Option, SelectFilter } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { BibliothequeFichier } from '../Bibliotheque/types';
import { FichiersFilters, useFichiers } from '../Bibliotheque/useFichiers';
import { FileConstraints, keepWithinMaxFiles } from '../upload/constants';
import { AddFileFromLibHandler } from './AddFile';

export type AddFromLibProps = {
  items: BibliothequeFichier[];
  setFilters: (filters: FichiersFilters) => void;
  /** Formats acceptés (par défaut : tous ceux de la bibliothèque). */
  fileConstraints?: FileConstraints;
  onAddFileFromLib: AddFileFromLibHandler;
  onClose: () => void;
};

type OptionConfidentiel = Option & { confidentiel: boolean };

const isFormatAccepted = (
  filename: string,
  constraints?: FileConstraints
): boolean => {
  if (!constraints) return true;
  const ext = getExtension(filename);
  return Boolean(ext && constraints.formats.includes(ext.toLowerCase()));
};

/**
 * Le sélecteur est multi-choix : quand le contexte de dépôt n'accepte qu'un seul
 * fichier, on ne garde que le dernier sélectionné.
 */
const limitSelection = (
  selection: Option[],
  constraints?: FileConstraints
): Option[] => keepWithinMaxFiles(selection, constraints?.maxFiles);

export const AddFromLib = (props: AddFromLibProps) => {
  const {
    items: fichiers,
    fileConstraints,
    onAddFileFromLib,
    onClose,
    setFilters,
  } = props;

  const [selectedFiles, setSelectedFiles] = useState<Option[] | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableOptions = fichiers
    .filter((f) => !(selectedFiles ?? []).some((file) => file.value === f.id))
    // Ne pas proposer un fichier que le contexte de dépôt refusera.
    .filter((f) => isFormatAccepted(f.filename, fileConstraints))
    .map((f) => ({
      label: f.filename,
      value: f.id,
      confidentiel: f.confidentiel,
    }));

  const options = [...(selectedFiles ?? []), ...availableOptions];
  const values = (selectedFiles ?? []).map((f) => f.value);

  const onSubmit = async () => {
    setIsSubmitting(true);
    const results = await Promise.allSettled(
      (selectedFiles ?? []).map((file) =>
        Promise.resolve(onAddFileFromLib(file.value as number))
      )
    );
    setIsSubmitting(false);
    if (results.some((result) => result.status === 'rejected')) {
      return;
    }
    onClose();
  };

  return (
    <div className="flex flex-col gap-8">
      <Field title={appLabels.tousLesFichiersCollectivite}>
        <SelectFilter
          debounce={500}
          options={options}
          custom={{
            renderOptionItem: (option) => (
              <span
                className={classNames('leading-6 text-grey-8', {
                  'text-primary-7': values.includes(option.value),
                })}
              >
                {(option as OptionConfidentiel).confidentiel && (
                  <Icon icon="lock-fill" size="sm" className="mr-2" />
                )}
                {option.label}
              </span>
            ),
            valueMatchOption: false,
          }}
          enableDisplayLimitValue={false}
          values={values}
          onSearch={(search) => setFilters({ search, page: 1 })}
          onChange={({ values }) => {
            setSelectedFiles(
              limitSelection(
                options.filter((opt) =>
                  (values ?? []).some((v) => v === opt.value)
                ),
                fileConstraints
              )
            );
            setFilters({ search: '', page: 1 });
          }}
          placeholder={appLabels.placeholderRecherchezIntitule}
          isSearcheable
        />
      </Field>

      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          {appLabels.annuler}
        </Button>
        <Button
          disabled={!selectedFiles || !selectedFiles.length || isSubmitting}
          onClick={onSubmit}
        >
          {appLabels.ajouter}
        </Button>
      </div>
    </div>
  );
};

const AddFromLibConnected = (
  props: Omit<AddFromLibProps, 'items' | 'setFilters'>
) => {
  const [filters, setFilters] = useState({ search: '', page: 1 });
  const { data, isLoading } = useFichiers(filters);

  if (isLoading) {
    return (
      <div className="h-32 flex">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  return data ? (
    <AddFromLib {...props} {...data} setFilters={setFilters} />
  ) : null;
};

export default AddFromLibConnected;
