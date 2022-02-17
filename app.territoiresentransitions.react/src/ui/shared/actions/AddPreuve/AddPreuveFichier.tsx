/**
 * Affiche le sélecteur de fichiers preuves
 */
import {File} from '@dataesr/react-dsfr';
import {LinearProgress} from '@material-ui/core';
import {ChangeEvent, FormEvent, useState} from 'react';
import {
  MAX_FILE_SIZE_MB,
  EXPECTED_FORMATS,
  EXPECTED_FORMATS_LIST,
  filesToArray,
  getInvalidFiles,
  TFilesArrayOrNull,
  getValidFiles,
} from './constants';

export type TAddPreuveFichierProps = {
  /** Fonction appelée pour téléverser les fichiers sélectionnés */
  uploadFiles: (
    files: Array<File>
  ) => Promise<{data: {Key: string} | null; error: Error | null}>;
};

const HINT = (
  <>
    Taille maximale par fichier : {MAX_FILE_SIZE_MB} Mo.
    <br />
    Formats supportés : {EXPECTED_FORMATS.join(', ')}.
  </>
);

export const AddPreuveFichier = (props: TAddPreuveFichierProps) => {
  const {uploadFiles} = props;
  const [currentSelection, setCurrentSelection] =
    useState<TFilesArrayOrNull>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validFiles = getValidFiles(currentSelection);
  const invalidFiles = getInvalidFiles(currentSelection);
  const errorMessage = invalidFiles?.length ? (
    <div>
      Les fichiers suivants ne sont pas compatibles et ne seront pas transférés
      :<br />
      <ul>
        {invalidFiles.map(f => (
          <li key={f.name}>{f.name}</li>
        ))}
      </ul>
    </div>
  ) : null;

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const {files} = e.target;
    setCurrentSelection(filesToArray(files));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validFiles?.length) {
      setIsLoading(true);
      uploadFiles(validFiles).then(() => {
        setIsLoading(false);
      });
    }
  };

  const isDisabled = !validFiles?.length || isLoading;

  return (
    <form onSubmit={onSubmit}>
      <File
        label="Ajouter un ou plusieurs fichier(s)"
        hint={HINT}
        accept={EXPECTED_FORMATS_LIST}
        multiple
        onChange={onChange}
        errorMessage={errorMessage}
        disabled={isLoading}
      />
      <br />

      {isLoading ? (
        <label>
          Transfert en cours...
          <LinearProgress />
        </label>
      ) : (
        <button className="fr-btn" disabled={isDisabled} type="submit">
          Ajouter
        </button>
      )}
    </form>
  );
};
