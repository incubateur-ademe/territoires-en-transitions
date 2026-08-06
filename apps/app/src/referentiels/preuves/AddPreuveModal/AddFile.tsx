/**
 * Affiche le composant d'upload de fichiers
 */
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Field, Input } from '@tet/ui';
import { FormEvent, useEffect, useState } from 'react';
import { useUpdateBibliothequeFichier } from '../Bibliotheque/useEditPreuve';
import {
  canChooseConfidentiel,
  CheckboxConfidentiel,
} from './CheckboxConfidentiel';
import {
  DEFAULT_FILE_CONSTRAINTS,
  FileConstraints,
  toAcceptAttribute,
} from '../upload/constants';
import { TFileItem } from './FileItem';
import { FileItemsList } from './FileItemsList';
import {
  DocType,
  UploadStatusCode,
  UploadStatusCompleted,
} from './types';
import { useFileUploadList } from './use-file-upload-list';

export type TAddFileFromLib = (fichierId: number) => Promise<unknown> | void;

export type TAddFileProps = {
  docType?: DocType;
  initialSelection?: Array<TFileItem>;
  /** Formats et taille acceptés (par défaut : ceux de la bibliothèque). */
  fileConstraints?: FileConstraints;
  onAddFileFromLib: TAddFileFromLib;
  onClose: () => void;
};

export const AddFile = (props: TAddFileProps) => {
  const {
    docType,
    initialSelection,
    fileConstraints = DEFAULT_FILE_CONSTRAINTS,
    onAddFileFromLib,
    onClose,
  } = props;
  const [confidentiel, setConfidentiel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collectivite_id = useCollectiviteId();

  const { mutate: updateDocument } = useUpdateBibliothequeFichier();

  const {
    items: currentSelection,
    onDropFiles,
    onStatusChange,
    onDismissItem,
  } = useFileUploadList({
    collectiviteId: collectivite_id,
    initialItems: initialSelection,
    constraints: fileConstraints,
  });

  const validFiles = currentSelection.filter(
    ({ status }) =>
      status.code === UploadStatusCode.completed ||
      status.code === UploadStatusCode.duplicated
  );
  const isDisabled = !validFiles?.length;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const results = await Promise.allSettled(
      validFiles
        .map(({ status }) =>
          onAddFileFromLib((status as UploadStatusCompleted).fichier_id)
        )
        .filter((result): result is Promise<unknown> => result !== undefined)
    );
    setIsSubmitting(false);
    if (results.some((result) => result.status === 'rejected')) {
      return;
    }
    onClose();
  };

  // La confidentialité choisie ici ne s'applique qu'aux fichiers téléversés
  // depuis cette modale : un fichier déjà présent dans la bibliothèque garde la
  // sienne, et on ne touche à rien si le type de document n'offre pas le choix.
  const uploadedFiles = currentSelection.filter(
    ({ status }) => status.code === UploadStatusCode.completed
  );

  useEffect(() => {
    const update = async () => {
      if (
        collectivite_id &&
        uploadedFiles.length &&
        canChooseConfidentiel(docType)
      ) {
        await Promise.all(
          uploadedFiles.map(({ status }) =>
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
  }, [collectivite_id, confidentiel, docType, uploadedFiles.length]);

  return (
    <div data-test="AddFile" className="flex flex-col gap-8">
      <Field
        title={appLabels.ajouterFichiers}
        message={appLabels.aideUploadFichier({
          tailleMaxMo: Math.round(fileConstraints.maxSizeBytes / (1024 * 1024)),
          formats: fileConstraints.formats,
        })}
        state="info"
      >
        <Input
          type="file"
          accept={toAcceptAttribute(fileConstraints)}
          displaySize="md"
          multiple={fileConstraints.maxFiles !== 1}
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
        onStatusChange={onStatusChange}
        onDismissItem={onDismissItem}
      />

      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          {appLabels.annuler}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isDisabled || isSubmitting}
          data-test="ok"
        >
          {appLabels.ajouter}
        </Button>
      </div>
    </div>
  );
};
