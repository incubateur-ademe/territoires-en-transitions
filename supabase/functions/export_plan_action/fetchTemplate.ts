export const MIME_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Fourni le modèle de fichier nécessaire à un export (le fichier doit se
 * trouver dans le répertoire "public" du front) */
export const fetchTemplate = async (fileName: string | null) => {
  if (!fileName) {
    throw Error('Filename is missing');
  }

  const PUBLIC_URL = Deno.env.get('PUBLIC_URL');
  if (!PUBLIC_URL) {
    throw Error('PUBLIC_URL env. var is not set');
  }

  const response = await fetch(`${PUBLIC_URL}/${fileName}`, {
    headers: {
      'Content-Type': MIME_XLSX,
      Accept: MIME_XLSX,
    },
  });

  if (response.ok) {
    return response.arrayBuffer();
  }

  throw Error('Response not ok');
};
