/**
 * Affiche le composant d'upload de fichiers
 */
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button, Field, Input } from '@tet/ui';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useUpdateBibliothequeFichier } from '../Bibliotheque/useEditPreuve';
import {
  DEFAULT_FILE_CONSTRAINTS,
  FileConstraints,
  toAcceptAttribute,
} from '../upload/constants';
import {
  canChooseConfidentiel,
  CheckboxConfidentiel,
} from './CheckboxConfidentiel';
import { FileUploadItem } from './FileItem';
import { FileItemsList } from './FileItemsList';
import {
  AddedDuplicatedDocument,
  DocType,
  DuplicatedDocumentPreuveType,
  OnDuplicatedDocumentsAdded,
  UploadStatusCode,
  UploadStatusCompleted,
  UploadStatusDuplicated,
} from './types';
import { useFileUploadList } from './use-file-upload-list';

export type AddedPreuveResult = {
  preuveId: number;
};

export type AddFileFromLibHandler = (
  fichierId: number
) => Promise<AddedPreuveResult | void> | AddedPreuveResult | void;

type ValidUploadStatus = UploadStatusCompleted | UploadStatusDuplicated;

type ValidFileItem = FileUploadItem & {
  status: ValidUploadStatus;
};

type SubmittedValidFile = {
  file: File;
  status: ValidUploadStatus;
  addedPreuve: AddedPreuveResult | void;
};

const isTrackedDuplicatedDocumentPreuveType = (
  docType?: DocType
): docType is DuplicatedDocumentPreuveType =>
  docType === 'annexe' ||
  docType === 'complementaire' ||
  docType === 'reglementaire';

const isValidFileItem = (item: FileUploadItem): item is ValidFileItem =>
  item.status.code === UploadStatusCode.completed ||
  item.status.code === UploadStatusCode.duplicated;

const toDuplicatedDocument = (
  submittedFile: SubmittedValidFile,
  preuveType: DuplicatedDocumentPreuveType
): AddedDuplicatedDocument | null => {
  const { addedPreuve, file, status } = submittedFile;

  if (status.code !== UploadStatusCode.duplicated || !addedPreuve) {
    return null;
  }

  return {
    hash: status.hash,
    preuveId: addedPreuve.preuveId,
    preuveType,
    storedFilenameKept: file.name !== status.filename,
  };
};

const buildDuplicatedDocuments = (
  submittedFiles: SubmittedValidFile[],
  preuveType: DuplicatedDocumentPreuveType
): AddedDuplicatedDocument[] =>
  submittedFiles.flatMap((submittedFile) => {
    const duplicatedDocument = toDuplicatedDocument(submittedFile, preuveType);
    return duplicatedDocument ? [duplicatedDocument] : [];
  });

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
    onStatusChange,
    onDismissItem,
  } = useFileUploadList({
    collectiviteId: collectiviteId,
    initialItems: initialSelection,
    constraints: fileConstraints,
  });

  const validFiles = currentSelection.filter(isValidFileItem);
  const isDisabled = !validFiles?.length;

  const submitValidFile = async ({
    file,
    status,
  }: ValidFileItem): Promise<SubmittedValidFile> => ({
    file,
    status,
    addedPreuve: await onAddFileFromLib(status.fichier_id),
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const results = await Promise.allSettled(validFiles.map(submitValidFile));
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
              collectiviteId: collectiviteId,
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
          data-test="referentiels.preuves.add-file.file-input"
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
