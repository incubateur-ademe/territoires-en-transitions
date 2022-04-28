/**
 * Affiche le sélecteur de fichiers preuves
 */
import {File as InputFile} from '@dataesr/react-dsfr';
import {preuveFichierWriteEndpoint} from 'core-logic/api/endpoints/PreuveFichierWriteEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useCollectiviteBucketFiles} from 'core-logic/hooks/preuve';
import {ChangeEvent, FormEvent, useState} from 'react';
import {TActionPreuvePanelProps} from 'ui/shared/actions/ActionPreuvePanel/ActionPreuvePanel';
import {HINT, EXPECTED_FORMATS_LIST} from './constants';
import {filesToUploadList} from './filesToUploadList';
import {TFileItem} from './FileItem';
import {FileItemsList} from './FileItemsList';
import {UploadStatus, UploadStatusCode} from './Uploader.d';

export type TAddPreuveFichierProps = TActionPreuvePanelProps & {
  /** Fichiers initialement sélectionnés (pour les tests) */
  initialSelection?: Array<TFileItem>;
  onClose: () => void;
};

const getFileByName = (fileName: string, selection: Array<TFileItem>): number =>
  selection.findIndex(({file}) => file.name === fileName);

export const AddPreuveFichier = (props: TAddPreuveFichierProps) => {
  const {initialSelection, onClose, action} = props;
  const [currentSelection, setCurrentSelection] = useState<Array<TFileItem>>(
    initialSelection || []
  );
  const collectivite_id = useCollectiviteId();
  const {bucketFiles} = useCollectiviteBucketFiles();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {files} = e.target;
    if (files) {
      setCurrentSelection([
        ...currentSelection,
        ...filesToUploadList(action, files, bucketFiles),
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
    if (collectivite_id) {
      Promise.all(
        validFiles.map(({actionId, file}) =>
          preuveFichierWriteEndpoint.save({
            action_id: actionId,
            collectivite_id,
            commentaire: '',
            filename: file.name,
          })
        )
      ).then(() => {
        onClose();
      });
    }
  };

  return (
    <form data-test="AddPreuveFichier" onSubmit={onSubmit}>
      <InputFile
        label="Ajouter un ou plusieurs fichier(s)"
        hint={HINT}
        accept={EXPECTED_FORMATS_LIST}
        multiple
        onChange={onChange}
        //disabled={isLoading}
      />
      <FileItemsList
        actionId={action.id}
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
