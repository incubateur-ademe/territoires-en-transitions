import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { getExtension } from '@/app/utils/file';
import { Button, Field, Icon, Option, SelectFilter } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import {
  BibliothequeFichierListItem,
  useFichiers,
} from '../bibliotheque/use-fichiers';
import { FileConstraints, keepWithinMaxFiles } from '../upload/constants';
import { AddFileHandler } from './add-file';
import {
  AddDocumentFollowUp,
  FollowUpCheckbox,
  isFollowUpApplicable,
} from './follow-up.checkbox';

export type AddFromBibliothequeProps = {
  items: BibliothequeFichierListItem[];
  onSearch: (search: string) => void;
  /** Formats acceptés (par défaut : tous ceux de la bibliothèque). */
  fileConstraints?: FileConstraints;
  /** Suite proposée une fois le fichier choisi. */
  followUp?: AddDocumentFollowUp;
  onAddFile: AddFileHandler;
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

export const AddFromBibliotheque = (props: AddFromBibliothequeProps) => {
  const {
    items: fichiers,
    fileConstraints,
    followUp,
    onAddFile,
    onClose,
    onSearch,
  } = props;

  const [selectedFiles, setSelectedFiles] = useState<Option[] | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUpChecked, setIsFollowUpChecked] = useState(
    followUp?.defaultChecked ?? false
  );
  const selectedFilename = selectedFiles?.[0]?.label;
  const applicableFollowUp = isFollowUpApplicable(followUp, selectedFilename)
    ? followUp
    : undefined;
  const isFollowUpChosen =
    applicableFollowUp !== undefined && isFollowUpChecked;

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
        Promise.resolve(
          onAddFile(file.value as number, { followUp: isFollowUpChosen })
        )
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
          onSearch={onSearch}
          onChange={({ values }) => {
            setSelectedFiles(
              limitSelection(
                options.filter((opt) =>
                  (values ?? []).some((v) => v === opt.value)
                ),
                fileConstraints
              )
            );
            onSearch('');
          }}
          placeholder={appLabels.placeholderRecherchezIntitule}
          isSearcheable
        />
      </Field>
      {applicableFollowUp && (
        <FollowUpCheckbox
          followUp={applicableFollowUp}
          checked={isFollowUpChecked}
          onChange={setIsFollowUpChecked}
        />
      )}

      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          {appLabels.annuler}
        </Button>
        <Button
          disabled={!selectedFiles || !selectedFiles.length || isSubmitting}
          onClick={onSubmit}
        >
          {isFollowUpChosen
            ? applicableFollowUp.submitLabel
            : appLabels.ajouter}
        </Button>
      </div>
    </div>
  );
};

const AddFromBibliothequeConnected = (
  props: Omit<AddFromBibliothequeProps, 'items' | 'onSearch'>
) => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFichiers(search);

  if (isLoading) {
    return (
      <div className="h-32 flex">
        <SpinnerLoader className="m-auto" />
      </div>
    );
  }

  return data ? (
    <AddFromBibliotheque {...props} items={data.items} onSearch={setSearch} />
  ) : null;
};

export default AddFromBibliothequeConnected;
