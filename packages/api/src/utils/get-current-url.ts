import 'server-only';

import { headers } from 'next/headers';

export async function getCurrentUrl() {
  const headersList = await headers();

  const host = headersList.get('host');

  // Le header custom `x-current-path` est défini par le middleware pour stocker
  // le chemin de la page actuelle et le récupérer server-side
  const currentPath = headersList.get('x-current-path') ?? '';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  return `${protocol}://${host}${currentPath}`;
}
