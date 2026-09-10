#!/usr/bin/env -S node --experimental-strip-types
/**
 * Import des correspondants d'un service de l'État.
 *
 * Rattache chaque adresse d'un fichier au service qu'elle représente et lui
 * écrit **une fois**. Toute la logique vit dans le backend (`serviceRoleProcedure`
 * `collectivites.membres.imports.correspondants`) : ce script lit le fichier,
 * appelle l'API et imprime le rapport.
 *
 * Usage :
 *   TET_API_URL="https://..." TET_API_TOKEN="<service role>" \
 *     node --experimental-strip-types \
 *       apps/tools/src/migrations/import-correspondants-service-etat/index.ts \
 *       [chemin] --initiateur=prenom.nom@beta.gouv.fr [--envoi]
 *
 * Sans chemin, tous les CSV de `data_layer/seed/sources/service-etat/contacts`
 * sont lus. Relancer est sans conséquence : les familles déjà importées
 * ressortent `deja_invite` ou `deja_membre`, et rien ne repart.
 *
 * En staging et en production, préférer le workflow « Import des correspondants
 * de service » : la clé de service reste dans les secrets de l'environnement.
 *
 * Sans `--envoi`, rien n'est écrit ni envoyé : le passage à blanc dit ce qui
 * partirait. C'est celui qu'on relit avec la personne métier.
 */

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DOSSIER_PAR_DEFAUT = 'data_layer/seed/sources/service-etat/contacts';

const USAGE =
  'node --experimental-strip-types apps/tools/src/migrations/import-correspondants-service-etat/index.ts [chemin] --initiateur=<email> [--envoi]';

type Options = {
  chemin: string;
  initiateur: string;
  envoi: boolean;
};

function lireOptions(argv: string[]): Options {
  const positionnels = argv.filter((arg) => !arg.startsWith('--'));
  const initiateur = argv
    .find((arg) => arg.startsWith('--initiateur='))
    ?.split('=')[1];

  if (!initiateur) {
    throw new Error(`Usage : ${USAGE}`);
  }

  return {
    chemin: positionnels[0] ?? DOSSIER_PAR_DEFAUT,
    initiateur,
    envoi: argv.includes('--envoi'),
  };
}

/**
 * Un fichier, ou tous les CSV d'un dossier.
 *
 * Repasser sur une famille déjà importée ne coûte rien — ses correspondants
 * ressortent `deja_invite` ou `deja_membre` — donc le défaut lit tout et le
 * script se relance quand une nouvelle liste arrive.
 */
function listerFichiers(chemin: string): string[] {
  if (!statSync(chemin).isDirectory()) {
    return [chemin];
  }

  const fichiers = readdirSync(chemin)
    .filter((nom) => nom.endsWith('.csv'))
    .sort()
    .map((nom) => join(chemin, nom));

  if (!fichiers.length) {
    throw new Error(`Aucun fichier .csv dans ${chemin}`);
  }
  return fichiers;
}

function creerClient() {
  const apiUrl = process.env.TET_API_URL;
  const apiToken = process.env.TET_API_TOKEN;
  if (!apiUrl || !apiToken) {
    throw new Error('TET_API_URL et TET_API_TOKEN sont requis');
  }

  // Le jeton de service part dans un en-tête : en clair sur `http`, il suffirait
  // à qui l'intercepte. Seule la boucle locale échappe à l'exigence.
  const url = new URL(apiUrl);
  const enLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !enLocal) {
    throw new Error(
      `TET_API_URL doit être en https (reçu : ${url.protocol}//${url.hostname})`
    );
  }

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        headers: () => ({ authorization: `Bearer ${apiToken}` }),
      }),
    ],
  });
}

async function main() {
  const options = lireOptions(process.argv.slice(2));
  const fichiers = listerFichiers(options.chemin);
  const client = creerClient();

  const totaux = new Map<string, number>();
  let envoisPrevus = 0;

  for (const fichier of fichiers) {
    const rapport =
      await client.collectivites.membres.imports.correspondants.mutate({
        contenuCsv: readFileSync(fichier, 'utf8'),
        initiateurEmail: options.initiateur,
        mode: options.envoi ? 'envoi' : 'a-blanc',
      });

    envoisPrevus += rapport.envoisPrevus;
    for (const [statut, nombre] of Object.entries(rapport.totaux)) {
      totaux.set(statut, (totaux.get(statut) ?? 0) + nombre);
    }

    console.log(
      `\n${fichier} — ${rapport.lignesLues} ligne(s), ${rapport.envoisPrevus} envoi(s)`
    );
    for (const resultat of rapport.resultats) {
      const service = resultat.service
        ? `${resultat.service.nom} (#${resultat.service.collectiviteId})`
        : '—';
      console.log(
        [
          `  L${resultat.ligne}`.padEnd(7),
          resultat.statut.padEnd(12),
          resultat.email.padEnd(45),
          service,
          resultat.motif ? `— ${resultat.motif}` : '',
        ].join(' ')
      );
    }
  }

  console.log(
    `\n${options.envoi ? 'Envoi' : 'À blanc'} — ${fichiers.length} fichier(s), ${envoisPrevus} envoi(s)`
  );
  for (const [statut, nombre] of [...totaux].sort()) {
    if (nombre > 0) {
      console.log(`  ${statut.padEnd(12)} ${nombre}`);
    }
  }

  if (!options.envoi && envoisPrevus > 0) {
    console.log(
      "\nPour envoyer, relire le rapport ci-dessus puis rejouer avec --envoi."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
