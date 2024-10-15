/**
 * Affiche le composant d'upload de fichiers
 */
import {ChangeEvent, FormEvent, useState} from 'react';
import { Button, Checkbox, Field, InfoTooltip, Input } from '@tet/ui';
import { HINT, EXPECTED_FORMATS_LIST } from './constants';
import { filesToUploadList } from './filesToUploadList';
import { TFileItem } from './FileItem';
import { FileItemsList } from './FileItemsList';
import {
  DocType,
  UploadStatus,
  UploadStatusCode,
  UploadStatusCompleted,
} from './types';
import { useCollectiviteId } from 'core-logic/hooks/params';

export type TAddFileFromLib = (fichier_id: number) => void;

export type TAddFileProps = {
  /** Type des documents attendus */
  docType?: DocType;
  /** Fichiers initialement sélectionnés (pour les tests) */
  initialSelection?: Array<TFileItem>;
  onAddFileFromLib: TAddFileFromLib;
  onClose: () => void;
};

// types de documents pour lesquels l'utilisateur peut choisir l'option "confidentiel"
const ALLOW_PRIVATE: DocType[] = ['reglementaire', 'complementaire', 'annexe'];

const getFileByName = (fileName: string, selection: Array<TFileItem>): number =>
  selection.findIndex(({ file }) => file.name === fileName);

export const AddFile = (props: TAddFileProps) => {
  const { docType, initialSelection, onAddFileFromLib, onClose } = props;
  const [currentSelection, setCurrentSelection] = useState<Array<TFileItem>>(
    initialSelection || []
  );
  const [confidentiel, setConfidentiel] = useState(false);

  const collectivite_id = useCollectiviteId();

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
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
    validFiles.map(({ status }) =>
      onAddFileFromLib((status as UploadStatusCompleted).fichier_id)
    );
    onClose();
  };

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
          multiple
          onChange={onChange}
        />
      </Field>
      {!!docType && ALLOW_PRIVATE.includes(docType) && (
        <div className="flex flex-row items-center gap-2">
          <Checkbox
            variant="switch"
            label="Document en mode privé"
            checked={confidentiel}
            onChange={(evt) => setConfidentiel(evt.currentTarget.checked)}
          />
          <InfoTooltip
            iconClassName="text-primary-8"
            className="whitespace-break-spaces !text-lg"
            label={
              docType === 'annexe'
                ? MSG_ANNEXE_CONFIDENTIELLE
                : MSG_DOC_CONFIDENTIEL
            }
            size="md"
          />
        </div>
      )}

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

/** Libellés affichés dans l'infobulle à côté du bouton "confidentiel" */
const MSG_ANNEXE_CONFIDENTIELLE = `Nous vous encourageons à partager vos documents : ils permettent à d’autres collectivités de s’inspirer de vos actions, de vos pratiques.

Si vos documents sont confidentiels, vous pouvez activer cette option : seuls les membres de votre collectivité (dont votre conseiller et votre auditeur si vous êtes engagés dans le programme “Territoire Engagé Transition Écologique”) et le service support de la plateforme pourront y accéder.

Si la fiche action est en mode privé, les documents ne seront pas accessibles par des personnes n’étant pas membres de votre collectivité, que le document soit en mode privé ou non.`;

const MSG_DOC_CONFIDENTIEL = `Nous vous encourageons à partager vos documents : ils permettent à d’autres collectivités de s’inspirer de vos actions, de vos pratiques.

Si vos documents sont confidentiels, vous pouvez activer cette option : seuls les membres de votre collectivité, votre conseiller, votre auditeur, les membres de la CNL (Commission National du Label) et le service support de la plateforme pourront y accéder.`;
