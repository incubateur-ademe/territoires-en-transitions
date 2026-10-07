/**
 * Affiche le composant d'upload de fichiers
 */
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { PreuveType } from '@tet/domain/collectivites';
import { Button, Field, Input } from '@tet/ui';
import { FormEvent, useState } from 'react';
import { useUpdateBibliothequeFichier } from '../bibliotheque/use-edit-preuve';
import {
  DEFAULT_FILE_CONSTRAINTS,
  FileConstraints,
  toAcceptAttribute,
} from '../upload/constants';
import {
  AddedDocumentResult,
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
  DuplicatedPreuveType,
  OnDuplicatedDocumentsAdded,
  UploadStatusCode,
} from './types';
import { useFileUploadList } from './use-file-upload-list';

export type AddFileHandler = (
  fichierId: number
) => Promise<AddedDocumentResult | void> | AddedDocumentResult | void;

const isDuplicatedPreuveType = (
  preuveType?: PreuveType
): preuveType is DuplicatedPreuveType =>
  preuveType === 'annexe' ||
  preuveType === 'complementaire' ||
  preuveType === 'reglementaire';

const isFulfilledSubmittedFile = (
  result: PromiseSettledResult<SubmittedValidFile>
): result is PromiseFulfilledResult<SubmittedValidFile> =>
  result.status === 'fulfilled';

export type AddFileProps = {
  preuveType?: PreuveType;
  initialSelection?: Array<FileUploadItem>;
  /** Formats et taille acceptés (par défaut : ceux de la bibliothèque). */
  fileConstraints?: FileConstraints;
  onAddFile: AddFileHandler;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
  onClose: () => void;
};

export const AddFile = (props: AddFileProps) => {
  const {
    preuveType,
    initialSelection,
    fileConstraints = DEFAULT_FILE_CONSTRAINTS,
    onAddFile,
    onDuplicatedDocumentsAdded,
    onClose,
  } = props;
  const [confidentiel, setConfidentiel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collectiviteId = useCollectiviteId();

  const { mutateAsync: updateDocument } = useUpdateBibliothequeFichier();

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

  const canSetConfidentiel = canChooseConfidentiel(preuveType);

  const submitValidFile = async ({
    file,
    status,
  }: ValidFileItem): Promise<SubmittedValidFile> => {
    const isUploadedFromThisModal = status.code === UploadStatusCode.completed;

    if (isUploadedFromThisModal && canSetConfidentiel) {
      await updateDocument({
        collectiviteId,
        hash: status.hash,
        confidentiel,
      });
    }

    return {
      file,
      status,
      addedDocument: await onAddFile(status.fichierId),
    };
  };

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

    if (onDuplicatedDocumentsAdded && isDuplicatedPreuveType(preuveType)) {
      const duplicatedDocuments = buildDuplicatedDocuments(
        submittedFiles,
        preuveType
      );

      if (duplicatedDocuments.length > 0) {
        onDuplicatedDocumentsAdded(duplicatedDocuments);
      }
    }

    onClose();
  };

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
        preuveType={preuveType}
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
