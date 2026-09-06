#!/usr/bin/env node

const policy = process.argv[2];
const rawDatabaseUrl = process.env.DATABASE_URL;
const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
const secureSslModes = new Set(['require', 'verify-ca', 'verify-full']);
const restoreProjectRefs = new Set([
  'qwbsrgwlypaqheoedxxq', // staging
  'xbrefnclajfcjlpnwyow', // preprod
]);

function fail(message) {
  console.error(`URL PostgreSQL refusée : ${message}`);
  process.exit(2);
}

function decodeUrlComponent(component, label) {
  try {
    return decodeURIComponent(component);
  } catch {
    fail(`${label} contient un encodage invalide`);
  }
}

function getSupabaseProjectRef(url) {
  const directHostMatch = url.hostname.match(
    /^db\.([a-z0-9-]+)\.supabase\.co$/
  );
  if (directHostMatch) {
    return directHostMatch[1];
  }

  if (/^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname)) {
    const username = decodeUrlComponent(url.username, "le nom d'utilisateur");
    if (username.startsWith('postgres.')) {
      return username.slice('postgres.'.length);
    }
  }

  return undefined;
}

function assertSupabaseConnectionShape(url) {
  if (url.port && url.port !== '5432') {
    fail(
      'la connexion doit être directe ou utiliser un pooler de session sur le port 5432'
    );
  }
  if (decodeUrlComponent(url.pathname, 'le nom de base') !== '/postgres') {
    fail(
      'la connexion doit cibler explicitement la base postgres du projet Supabase'
    );
  }

  const configuredSslMode = url.searchParams.get('sslmode');
  if (configuredSslMode && !secureSslModes.has(configuredSslMode)) {
    fail(`le mode TLS ${configuredSslMode} n'est pas assez strict`);
  }
}

function assertDisposableLocalDatabase(url) {
  if (!loopbackHosts.has(url.hostname)) {
    fail('un test destructif exige une adresse loopback');
  }

  const pathname = decodeUrlComponent(url.pathname, 'le nom de base');
  const databaseNameMatch = pathname.match(/^\/([a-z0-9_]+)$/);
  const databaseName = databaseNameMatch?.[1];
  if (
    !databaseName ||
    !/(?:^|_)(?:test|temp|tmp|disposable)(?:_|$)/.test(databaseName)
  ) {
    fail(
      'un test destructif exige un nom de base jetable contenant test, temp, tmp ou disposable'
    );
  }
}

function assertLocalSupabaseCiDatabase(url) {
  const username = decodeUrlComponent(url.username, "le nom d'utilisateur");
  const password = decodeUrlComponent(url.password, 'le mot de passe');
  const databaseName = decodeUrlComponent(url.pathname, 'le nom de base');

  if (
    url.hostname !== 'supabase_db_tet' ||
    url.port !== '5432' ||
    databaseName !== '/postgres' ||
    username !== 'postgres' ||
    password !== 'postgres'
  ) {
    fail(
      'un test CI destructif doit cibler exactement la base postgres du conteneur Supabase local'
    );
  }

  if ([...url.searchParams].length !== 0) {
    fail("la cible Supabase locale CI n'accepte aucun paramètre de connexion");
  }
}

if (!rawDatabaseUrl) {
  fail('DATABASE_URL est absente');
}

let databaseUrl;
try {
  databaseUrl = new URL(rawDatabaseUrl);
} catch {
  fail("le format de l'URL est invalide");
}

if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
  fail('le protocole doit être postgres ou postgresql');
}
if (databaseUrl.hash) {
  fail('les fragments sont interdits');
}

// libpq permet aux paramètres nommés de remplacer l'autorité de l'URI et le
// dernier doublon gagne. Une URL de déploiement reste donc volontairement
// minimale : seul sslmode peut apparaître, une seule fois.
const connectionParameters = [...databaseUrl.searchParams.entries()];
if (
  connectionParameters.some(([name]) => name !== 'sslmode') ||
  connectionParameters.length > 1
) {
  fail('seul un unique paramètre sslmode est autorisé');
}

if (policy === 'local-bootstrap') {
  if (!loopbackHosts.has(databaseUrl.hostname)) {
    fail('le bootstrap Earthly exige une adresse loopback');
  }
  process.exit(0);
}

if (policy === 'local-disposable') {
  assertDisposableLocalDatabase(databaseUrl);
  process.exit(0);
}

if (policy === 'local-supabase-ci') {
  assertLocalSupabaseCiDatabase(databaseUrl);
  process.exit(0);
}

if (policy === 'supabase-contract') {
  const expectedProjectRef = process.env.EXPECTED_SUPABASE_PROJECT_REF;

  if (!expectedProjectRef) {
    fail('EXPECTED_SUPABASE_PROJECT_REF est absente');
  }
  assertSupabaseConnectionShape(databaseUrl);

  const actualProjectRef = getSupabaseProjectRef(databaseUrl);
  if (!actualProjectRef || actualProjectRef !== expectedProjectRef) {
    fail(
      "la cible ne correspond pas au projet Supabase déclaré pour l'environnement"
    );
  }
  process.exit(0);
}

if (policy === 'restore-target') {
  if (
    loopbackHosts.has(databaseUrl.hostname) ||
    databaseUrl.hostname === 'host.docker.internal'
  ) {
    process.exit(0);
  }

  assertSupabaseConnectionShape(databaseUrl);
  if (!databaseUrl.searchParams.has('sslmode')) {
    fail('une restauration distante doit expliciter un mode TLS strict');
  }
  const actualProjectRef = getSupabaseProjectRef(databaseUrl);
  if (!actualProjectRef || !restoreProjectRefs.has(actualProjectRef)) {
    fail('la restauration distante doit cibler exactement staging ou preprod');
  }
  process.exit(0);
}

fail(`la politique ${policy ?? '(absente)'} est inconnue`);
