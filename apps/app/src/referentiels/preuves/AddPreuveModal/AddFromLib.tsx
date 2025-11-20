import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Button, Field, Icon, Option, SelectFilter } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { TBibliothequeFichier } from '../Bibliotheque/types';
import { TFilters, useFichiers } from '../Bibliotheque/useFichiers';
import { TAddFileFromLib } from './AddFile';

export type TAddFromLibProps = {
  items: TBibliothequeFichier[];
  setFilters: (filters: TFilters) => void;
  onAddFileFromLib: TAddFileFromLib;
  onClose: () => void;
};

type OptionConfidentiel = Option & { confidentiel: boolean };

/**
 * Affiche la bibliothèque de fichiers de la collectivité
 * et permet de sélectionner les fichiers à ajouter comme preuve
 */
export const AddFromLib = (props: TAddFromLibProps) => {
  const { items: fichiers, onAddFileFromLib, onClose, setFilters } = props;

  const [selectedFiles, setSelectedFiles] = useState<Option[] | undefined>();

  const availableOptions = fichiers
    .filter((f) => !(selectedFiles ?? []).some((file) => file.value === f.id))
    .map((f) => ({
      label: f.filename,
      value: f.id,
      confidentiel: f.confidentiel,
    }));

  const options = [...(selectedFiles ?? []), ...availableOptions];
  const values = (selectedFiles ?? []).map((f) => f.value);

  const onSubmit = () => {
    (selectedFiles ?? []).map((file) => onAddFileFromLib(file.value as number));
    onClose();
  };

  return (
    <div className="flex flex-col gap-8">
      <Field title="Tous les fichiers de ma collectivité">
        <SelectFilter
          debounce={500}
          options={options}
          customItem={(option) => (
            <>
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
            </>
          )}
          values={values}
          onSearch={(search) => setFilters({ search, page: 1 })}
          onChange={({ values }) => {
            setSelectedFiles(
              options.filter((opt) =>
                (values ?? []).some((v) => v === opt.value)
              )
            );
            setFilters({ search: '', page: 1 });
          }}
          placeholder="Rechercher par nom"
          isSearcheable
        />
      </Field>

      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          Annuler
        </Button>
        <Button
          disabled={!selectedFiles || !selectedFiles.length}
          onClick={onSubmit}
        >
          Ajouter
        </Button>
      </div>
    </div>
  );
};

const AddFromLibConnected = (
  props: Omit<TAddFromLibProps, 'items' | 'setFilters'>
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
