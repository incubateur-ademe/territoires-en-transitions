import { PoolClient } from 'pg';
import { listCasBloquantsEcriture } from './ecriture';
import { listCasBloquantsDossiers } from './lignes';
import { listCasBloquantsSocle } from './thematiques';

export const validateGardes = async (
  client: PoolClient,
  socle: ReadonlyMap<string, number>
) => {
  const cas = [
    ...(await listCasBloquantsDossiers(client)),
    ...(await listCasBloquantsEcriture(client)),
    ...listCasBloquantsSocle(socle),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
