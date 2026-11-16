import { sanitizeSegment } from '@tet/backend/utils/archive/build-archive-path.utils';

/** Nom du zip et de son dossier racine : `documents_eci_Nom de la collectivité`. */
export const toPreuvesArchiveName = ({
  referentielId,
  collectiviteNom,
}: {
  referentielId: string;
  collectiviteNom: string;
}): string => sanitizeSegment(`documents_${referentielId}_${collectiviteNom}`);
