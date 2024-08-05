import {useEffect, useState} from 'react';
import {Button, Field, Option, SelectFilter} from '@tet/ui';
import {TBibliothequeFichier} from '../Bibliotheque/types';
import {useFichiers, TFilters} from '../Bibliotheque/useFichiers';
import {TAddFileFromLib} from './AddFile';

export type TAddFromLibProps = {
  items: TBibliothequeFichier[];
  setFilters: (filters: TFilters) => void;
  onAddFileFromLib: TAddFileFromLib;
  onClose: () => void;
};

/**
 * Affiche la bibliothèque de fichiers de la collectivité
 * et permet de sélectionner les fichiers à ajouter comme preuve
 */
export const AddFromLib = (props: TAddFromLibProps) => {
  const {items: fichiers, onAddFileFromLib, onClose, setFilters} = props;

  const [selectedFiles, setSelectedFiles] = useState<Option[] | undefined>();
  const [options, setOptions] = useState<Option[]>(
    fichiers.map(f => ({label: f.filename, value: f.id}))
  );

  useEffect(() => {
    const remainingOptions = fichiers
      .filter(f => !(selectedFiles ?? []).some(file => file.value === f.id))
      .map(f => ({label: f.filename, value: f.id}));

    setOptions([...(selectedFiles ?? []), ...remainingOptions]);
  }, [JSON.stringify(fichiers), JSON.stringify(selectedFiles)]);

  const onSubmit = () => {
    (selectedFiles ?? []).map(file => onAddFileFromLib(file.value as number));
    onClose();
  };

  return (
    <div className="flex flex-col gap-8">
      <Field title="Tous les fichiers de ma collectivité">
        <SelectFilter
          debounce={500}
          options={options}
          values={(selectedFiles ?? []).map(f => f.value)}
          onSearch={search => setFilters({search, page: 1})}
          onChange={({values}) => {
            setSelectedFiles(
              options.filter(opt => (values ?? []).some(v => v === opt.value))
            );
            setFilters({search: '', page: 1});
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
  const [filters, setFilters] = useState({search: '', page: 1});
  const data = useFichiers(filters);
  return data ? (
    <AddFromLib {...props} {...data} setFilters={setFilters} />
  ) : null;
};

export default AddFromLibConnected;
