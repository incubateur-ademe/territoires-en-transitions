export const PREUVES_ARCHIVES_BUCKET = 'preuves-archives';

export const ARCHIVE_ZIP_CONTENT_TYPE = 'application/zip';

/** TTL de la signed URL retournée par `get`, générée à la demande au clic de téléchargement : 10 min suffisent. */
export const ARCHIVE_DOWNLOAD_TTL_SECONDS = 10 * 60;
