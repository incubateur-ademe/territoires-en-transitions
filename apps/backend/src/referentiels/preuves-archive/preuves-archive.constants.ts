export const PREUVES_ARCHIVES_BUCKET = 'preuves-archives';

export const ARCHIVE_ZIP_CONTENT_TYPE = 'application/zip';

/** TTL de la signed URL retournée par `get` : 24h pour laisser à l'utilisateur le temps de télécharger son archive. Régénérée à chaque appel de `get`. */
export const ARCHIVE_DOWNLOAD_TTL_SECONDS = 24 * 60 * 60;
