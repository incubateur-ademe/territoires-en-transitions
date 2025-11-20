/**
 * Affiche le composant d'upload de fichiers
 */
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Field, Input } from '@tet/ui';
import { FormEvent, useEffect, useState } from 'react';
import { useUpdateBibliothequeFichierConfidentiel } from '../Bibliotheque/useEditPreuve';
import { CheckboxConfidentiel } from './CheckboxConfidentiel';
import { EXPECTED_FORMATS_LIST, HINT } from './constants';
import { TFileItem } from './FileItem';
import { FileItemsList } from './FileItemsList';
import { filesToUploadList } from './filesToUploadList';
import {
  DocType,
  UploadStatus,
  UploadStatusCode,
  UploadStatusCompleted,
} from './types';

export type TAddFileFromLib = (fichier_id: number) => void;

export type TAddFileProps = {
  /** Type des documents attendus */
  docType?: DocType;
  /** Fichiers initialement sélectionnés (pour les tests) */
  initialSelection?: Array<TFileItem>;
  onAddFileFromLib: TAddFileFromLib;
  onClose: () => void;
};

const getFileByName = (fileName: string, selection: Array<TFileItem>): number =>
  selection.findIndex(({ file }) => file.name === fileName);

export const AddFile = (props: TAddFileProps) => {
  const { docType, initialSelection, onAddFileFromLib, onClose } = props;
  const [currentSelection, setCurrentSelection] = useState<Array<TFileItem>>(
    initialSelection || []
  );
  const [confidentiel, setConfidentiel] = useState(false);

  const collectivite_id = useCollectiviteId();

  const { mutate: updateConfidentiel } =
    useUpdateBibliothequeFichierConfidentiel();

  const onDropFiles = async (files: FileList | null) => {
    const filesToUpload = await filesToUploadList(collectivite_id, files);
    if (files) {
      setCurrentSelection([...currentSelection, ...filesToUpload]);
    }
  };

  // appelée quand un item sort de l'état "running"
  const onRunningStopped = (fileName: string, status: UploadStatus) => {
    const index = getFileByName(fileName, currentSelection);
    if (index !== -1) {
      // met à jour la sélection courante
      const updatedSelection = [...currentSelection];
      updatedSelection[index] = { ...currentSelection[index], status };
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
    ({ status }) =>
      status.code === UploadStatusCode.completed ||
      status.code === UploadStatusCode.duplicated
  );
  const isDisabled = !validFiles?.length;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    validFiles.map(({ status }) => {
      onAddFileFromLib((status as UploadStatusCompleted).fichier_id);
    });
    onClose();
  };

  // Synchronise le flag "confidentiel" des fichiers uploadés avec l'état du
  // bouton celui-ci pouvant être changé avant/après upload.
  // Permet de gérer aussi le cas des documents déjà uploadés
  useEffect(() => {
    const update = async () => {
      if (collectivite_id && validFiles?.length) {
        await Promise.all(
          validFiles.map(({ status }) =>
            updateConfidentiel({
              collectivite_id,
              fichier: { hash: (status as UploadStatusCompleted).hash },
              updatedConfidentiel: confidentiel,
            })
          )
        );
      }
    };
    update();
  }, [collectivite_id, confidentiel, validFiles?.length]);

  return (
    <div data-test="AddFile" className="flex flex-col gap-8">
      <Field
        title="Ajouter un ou plusieurs fichier(s)"
        message={HINT}
        state="info"
      >
        <Input
          type="file"
          accept={EXPECTED_FORMATS_LIST}
          displaySize="md"
          multiple
          onChange={(e) => onDropFiles(e.target.files)}
          onDropFiles={(files) => onDropFiles(files)}
        />
      </Field>
      <CheckboxConfidentiel
        docType={docType}
        confidentiel={confidentiel}
        setConfidentiel={setConfidentiel}
      />
      <FileItemsList
        items={currentSelection}
        onRunningStopped={onRunningStopped}
        onRemoveFailed={onRemoveFailed}
      />

      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={onSubmit} disabled={isDisabled} data-test="ok">
          Ajouter
        </Button>
      </div>
    </div>
  );
};
