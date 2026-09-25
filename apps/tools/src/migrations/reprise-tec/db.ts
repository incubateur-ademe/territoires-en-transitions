import { Pool } from 'pg';

const getUrl = (variable: string): string => {
  const url = process.env[variable];
  if (!url) {
    throw new Error(
      `${variable} est requis.\n` +
        `Exemple : export ${variable}="postgresql://user:password@host:port/database"`
    );
  }
  return url;
};

export const getCible = (applicationName: string): Pool =>
  new Pool({
    connectionString: getUrl('SUPABASE_DATABASE_URL'),
    application_name: applicationName,
  });

export const getDatabases = (
  applicationName: string
): { source: Pool; cible: Pool } => ({
  source: new Pool({
    connectionString: getUrl('TEC_DATABASE_URL'),
    application_name: applicationName,
  }),
  cible: getCible(applicationName),
});
