import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from './demarche-pcaet-status.enum.schema';

/**
 * Contraintes propres au dossier PCAET. La règle de couverture, elle, est
 * commune à tous les types de démarches (cf. `demarche-documents.rules`).
 */

/** Formats acceptés pour les pièces d'un dossier PCAET : PDF uniquement. */
export const PCAET_DOCUMENT_ACCEPTED_EXTENSIONS = ['pdf'] as const;

export const PCAET_DOCUMENT_ACCEPTED_MIME_TYPES = ['application/pdf'] as const;

/**
 * Extension d'un nom de fichier, en minuscules. `undefined` s'il n'y en a pas :
 * un nom sans point (« pdf ») ou commençant par un point (« .pdf ») n'a pas
 * d'extension, il ne faut pas prendre le nom entier pour telle.
 */
const getFileExtension = (filename: string): string | undefined => {
  const separator = filename.lastIndexOf('.');
  if (separator <= 0 || separator === filename.length - 1) {
    return undefined;
  }
  return filename.slice(separator + 1).toLowerCase();
};

/**
 * Vérifie qu'un fichier de la bibliothèque est acceptable comme pièce du
 * dossier. Le mime type n'est vérifié que s'il est connu : il vient des
 * métadonnées du stockage, donc renseigné par le navigateur à l'upload.
 */
export const isPcaetDocumentFileAccepted = ({
  filename,
  mimeType,
}: {
  filename: string;
  mimeType?: string | null;
}): boolean => {
  const extension = getFileExtension(filename);
  const isExtensionAccepted = Boolean(
    extension &&
      (PCAET_DOCUMENT_ACCEPTED_EXTENSIONS as readonly string[]).includes(
        extension
      )
  );
  if (!isExtensionAccepted) {
    return false;
  }
  if (!mimeType) {
    return true;
  }
  return (PCAET_DOCUMENT_ACCEPTED_MIME_TYPES as readonly string[]).includes(
    mimeType.toLowerCase()
  );
};

/**
 * Les documents du dossier ne sont modifiables que pendant l'élaboration : le
 * dossier est gelé dès sa transmission pour avis.
 */
export const isDemarchePcaetDocumentsMutable = (
  status: DemarchePcaetStatus
): boolean => status === DemarchePcaetStatusEnum.EN_ELABORATION;
