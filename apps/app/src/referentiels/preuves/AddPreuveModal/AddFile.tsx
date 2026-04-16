/**
 * Affiche le composant d'upload de fichiers
 */
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Field, Input } from '@tet/ui';
import { FormEvent, useEffect, useState } from 'react';
import { useUpdateBibliothequeFichier } from '../Bibliotheque/useEditPreuve';
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
  docType?: DocType;
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

  const { mutate: updateDocument } = useUpdateBibliothequeFichier();

  const onDropFiles = async (files: FileList | null) => {
    const filesToUpload = await filesToUploadList(collectivite_id, files);
    if (files) {
      setCurrentSelection([...currentSelection, ...filesToUpload]);
    }
  };

  const onRunningStopped = (fileName: string, status: UploadStatus) => {
    const index = getFileByName(fileName, currentSelection);
    if (index !== -1) {
      const updatedSelection = [...currentSelection];
      updatedSelection[index] = { ...currentSelection[index], status };
      setCurrentSelection(updatedSelection);
    }
  };

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

  useEffect(() => {
    const update = async () => {
      if (collectivite_id && validFiles?.length) {
        await Promise.all(
          validFiles.map(({ status }) =>
            updateDocument({
              collectiviteId: collectivite_id,
              hash: (status as UploadStatusCompleted).hash,
              confidentiel,
            })
          )
        );
      }
    };
    update();
  }, [collectivite_id, confidentiel, validFiles?.length]);

  return (
    <div data-test="AddFile" className="flex flex-col gap-8">
      <Field title={appLabels.ajouterFichiers} message={HINT} state="info">
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
          {appLabels.annuler}
        </Button>
        <Button onClick={onSubmit} disabled={isDisabled} data-test="ok">
          {appLabels.ajouter}
        </Button>
      </div>
    </div>
  );
};
