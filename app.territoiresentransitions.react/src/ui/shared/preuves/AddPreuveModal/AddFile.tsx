/**
 * Affiche le composant d'upload de fichiers
 */
import {File as InputFile} from '@dataesr/react-dsfr';
import {useCollectiviteBucketFiles} from 'core-logic/hooks/preuve';
import {ChangeEvent, FormEvent, useState} from 'react';
import {HINT, EXPECTED_FORMATS_LIST} from './constants';
import {filesToUploadList} from './filesToUploadList';
import {TFileItem} from './FileItem';
import {FileItemsList} from './FileItemsList';
import {UploadStatus, UploadStatusCode} from './types';

export type TAddFileFromLib = (filename: string) => Promise<boolean>;

export type TAddFileProps = {
  /** Fichiers initialement sélectionnés (pour les tests) */
  initialSelection?: Array<TFileItem>;
  onAddFileFromLib: TAddFileFromLib;
  onClose: () => void;
};

const getFileByName = (fileName: string, selection: Array<TFileItem>): number =>
  selection.findIndex(({file}) => file.name === fileName);

export const AddFile = (props: TAddFileProps) => {
  const {initialSelection, onAddFileFromLib, onClose} = props;
  const [currentSelection, setCurrentSelection] = useState<Array<TFileItem>>(
    initialSelection || []
  );
  const {bucketFiles} = useCollectiviteBucketFiles();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {files} = e.target;
    if (files) {
      setCurrentSelection([
        ...currentSelection,
        ...filesToUploadList(files, bucketFiles),
      ]);
    }
  };

  // appelée quand un item sort de l'état "running"
  const onRunningStopped = (fileName: string, status: UploadStatus) => {
    const index = getFileByName(fileName, currentSelection);
    if (index !== -1) {
      // met à jour la sélection courante
      const updatedSelection = [...currentSelection];
      updatedSelection[index] = {...currentSelection[index], status};
      setCurrentSelection(updatedSelection);
    }
  };

  // appelée pour supprimer un item terminé en erreur
  const onRemoveFailed = (fileName: string) => {
    const index = getFileByName(fileName, currentSelection);
    if (index !== -1) {
      setCurrentSelection([
        ...currentSelection.slice(0, index),
        ...currentSelection.slice(index + 1),
      ]);
    }
  };

  const validFiles = currentSelection.filter(
    ({status}) => status.code === UploadStatusCode.completed
  );
  const isDisabled = !validFiles?.length;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    Promise.all(validFiles.map(({file}) => onAddFileFromLib(file.name))).then(
      () => {
        onClose();
      }
    );
  };

  return (
    <form data-test="AddFile" onSubmit={onSubmit}>
      <InputFile
        label="Ajouter un ou plusieurs fichier(s)"
        hint={HINT}
        accept={EXPECTED_FORMATS_LIST}
        multiple
        onChange={onChange}
        //disabled={isLoading}
      />
      <FileItemsList
        items={currentSelection}
        onRunningStopped={onRunningStopped}
        onRemoveFailed={onRemoveFailed}
      />
      <button className="fr-btn mt-2" disabled={isDisabled} type="submit">
        Ajouter
      </button>
    </form>
  );
};
