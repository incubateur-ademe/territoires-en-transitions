/**
 * Affiche le composant d'upload de fichiers
 */
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Field, Input } from '@tet/ui';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useUpdateBibliothequeFichier } from '../bibliotheque/use-edit-preuve';
import {
  DEFAULT_FILE_CONSTRAINTS,
  FileConstraints,
  toAcceptAttribute,
} from '../upload/constants';
import {
  AddedPreuveResult,
  buildDuplicatedDocuments,
  getFilesSubmission,
  SubmittedValidFile,
  ValidFileItem,
} from './add-file.utils';
import {
  canChooseConfidentiel,
  ConfidentielCheckbox,
} from './confidentiel.checkbox';
import { FileUploadItem } from './file-item';
import { FileItemsList } from './file-items-list';
import {
  DocType,
  DuplicatedDocumentPreuveType,
  OnDuplicatedDocumentsAdded,
  UploadStatusCode,
  UploadStatusCompleted,
} from './types';
import { useFileUploadList } from './use-file-upload-list';

export type AddFileFromLibHandler = (
  fichierId: number
) => Promise<AddedPreuveResult | void> | AddedPreuveResult | void;

const isTrackedDuplicatedDocumentPreuveType = (
  docType?: DocType
): docType is DuplicatedDocumentPreuveType =>
  docType === 'annexe' ||
  docType === 'complementaire' ||
  docType === 'reglementaire';

const isFulfilledSubmittedFile = (
  result: PromiseSettledResult<SubmittedValidFile>
): result is PromiseFulfilledResult<SubmittedValidFile> =>
  result.status === 'fulfilled';

export type AddFileProps = {
  docType?: DocType;
  initialSelection?: Array<FileUploadItem>;
  /** Formats et taille acceptés (par défaut : ceux de la bibliothèque). */
  fileConstraints?: FileConstraints;
  onAddFileFromLib: AddFileFromLibHandler;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
  onClose: () => void;
};

export const AddFile = (props: AddFileProps) => {
  const {
    docType,
    initialSelection,
    fileConstraints = DEFAULT_FILE_CONSTRAINTS,
    onAddFileFromLib,
    onDuplicatedDocumentsAdded,
    onClose,
  } = props;
  const [confidentiel, setConfidentiel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collectiviteId = useCollectiviteId();

  const { mutate: updateDocument } = useUpdateBibliothequeFichier();

  const {
    items: currentSelection,
    onDropFiles,
    onDismissItem,
  } = useFileUploadList({
    collectiviteId,
    initialItems: initialSelection,
    constraints: fileConstraints,
  });

  const submission = getFilesSubmission(currentSelection);
  const isSubmitDisabled = !submission.canSubmit || isSubmitting;

  const submitValidFile = async ({
    file,
    status,
  }: ValidFileItem): Promise<SubmittedValidFile> => ({
    file,
    status,
    addedPreuve: await onAddFileFromLib(status.fichierId),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!submission.canSubmit) {
      return;
    }

    setIsSubmitting(true);
    const results = await Promise.allSettled(
      submission.validFiles.map(submitValidFile)
    );
    setIsSubmitting(false);
    if (results.some((result) => result.status === 'rejected')) {
      return;
    }

    const submittedFiles = results
      .filter(isFulfilledSubmittedFile)
      .map((result) => result.value);

    if (
      onDuplicatedDocumentsAdded &&
      isTrackedDuplicatedDocumentPreuveType(docType)
    ) {
      const duplicatedDocuments = buildDuplicatedDocuments(
        submittedFiles,
        docType
      );

      if (duplicatedDocuments.length > 0) {
        onDuplicatedDocumentsAdded(duplicatedDocuments);
      }
    }

    onClose();
  };

  // La confidentialité choisie ici ne s'applique qu'aux fichiers téléversés
  // depuis cette modale : un fichier déjà présent dans la bibliothèque garde la
  // sienne, et on ne touche à rien si le type de document n'offre pas le choix.
  const uploadedFiles = useMemo(
    () =>
      currentSelection.filter(
        ({ status }) => status.code === UploadStatusCode.completed
      ),
    [currentSelection]
  );

  useEffect(() => {
    const update = async () => {
      if (
        collectiviteId &&
        uploadedFiles.length &&
        canChooseConfidentiel(docType)
      ) {
        await Promise.all(
          uploadedFiles.map(({ status }) =>
            updateDocument({
              collectiviteId,
              hash: (status as UploadStatusCompleted).hash,
              confidentiel,
            })
          )
        );
      }
    };
    update();
  }, [collectiviteId, confidentiel, docType, updateDocument, uploadedFiles]);

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
      <ConfidentielCheckbox
        docType={docType}
        confidentiel={confidentiel}
        setConfidentiel={setConfidentiel}
      />
      <FileItemsList items={currentSelection} onDismissItem={onDismissItem} />

      <div className="flex gap-4 ml-auto">
        <Button variant="outlined" onClick={onClose}>
          {appLabels.annuler}
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitDisabled} data-test="ok">
          {appLabels.ajouter}
        </Button>
      </div>
    </div>
  );
};
