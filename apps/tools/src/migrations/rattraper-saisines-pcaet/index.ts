#!/usr/bin/env tsx
/**
 * Saisit les services instructeurs que les transmissions passées ont oubliés.
 *
 * Une saisine naît à la transmission du dossier, pour les services qui
 * couvraient alors la collectivité déposante. Les services entrés dans le
 * dispositif après coup — les services nationaux, une DR ADEME, une DDT
 * nouvellement rattachée — n'en ont donc aucune sur les dossiers déjà partis,
 * et ne peuvent pas les ouvrir alors que leur périmètre les couvre.
 *
 * Le script ne réécrit aucune règle : il rejoue `saisirInstructeurs`, la même
 * opération que la transmission, sur les dossiers déjà transmis. L'écriture est
 * idempotente (`onConflictDoNothing` sur la paire démarche/instructeur), ce qui
 * le rend rejouable sans doublon, et laisse intactes les saisines existantes —
 * leur date de saisine fait foi.
 *
 * `source` reste `transmission` : la ligne dit vrai, ce service est bien
 * destinataire de la transmission de ce dossier. Son `created_at`, très
 * postérieur au `transmitted_at` de la démarche, suffit à repérer les lignes
 * nées ici.
 *
 * Usage :
 *   # 1. à blanc (par défaut) : n'écrit rien, dit ce qui serait créé
 *   SUPABASE_DATABASE_URL="postgresql://..." \
 *     pnpx tsx apps/tools/src/migrations/rattraper-saisines-pcaet/index.ts
 *
 *   # 2. écriture réelle
 *   SUPABASE_DATABASE_URL="postgresql://..." \
 *     pnpx tsx apps/tools/src/migrations/rattraper-saisines-pcaet/index.ts --confirm
 */

import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { pcaetDemandeAvisTable } from '@tet/backend/demarches/pcaet/shared/models/pcaet-demande-avis.table';
import { PcaetInstructeursRepository } from '@tet/backend/demarches/pcaet/shared/pcaet-instructeurs.repository';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { and, eq, isNotNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

type Manquante = {
  demarcheId: number;
  collectiviteId: number;
  collectiviteNom: string;
  instructeurId: number;
  instructeurNom: string;
  instructeurType: string;
};

const main = async () => {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'SUPABASE_DATABASE_URL est requis.\n' +
        'Exemple : export SUPABASE_DATABASE_URL="postgresql://user:password@host:port/database"'
    );
  }

  const isConfirmed = process.argv.includes('--confirm');

  const pool = new Pool({
    connectionString: databaseUrl,
    application_name: 'rattraper-saisines-pcaet',
  });
  const db = drizzle(pool);

  // Le repository ne lit que `.db` de son service : l'instancier ainsi évite de
  // monter un contexte Nest pour un script, sans dupliquer la règle de
  // couverture — c'est tout l'intérêt de passer par lui.
  const instructeurs = new PcaetInstructeursRepository({
    db,
  } as unknown as DatabaseService);

  try {
    // Un dossier transmis, quel que soit ce qu'il est devenu depuis : un PCAET
    // adopté ou archivé reste consultable par les services qui le couvrent.
    const demarches = await db
      .select({
        id: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
        collectiviteNom: collectiviteTable.nom,
      })
      .from(demarcheTable)
      .innerJoin(
        collectiviteTable,
        eq(collectiviteTable.id, demarcheTable.collectiviteId)
      )
      .where(
        and(
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          isNotNull(demarcheTable.transmittedAt)
        )
      );

    console.log(`${demarches.length} dossier(s) transmis à examiner.`);

    const manquantes: Manquante[] = [];

    /**
     * La famille juridique d'un service, retenue une fois pour toutes.
     *
     * Les mêmes services reviennent sur presque tous les dossiers — un service
     * national sur tous : la demander à chaque ligne, c'est une requête par
     * dossier et par service pour une information qui ne change pas.
     */
    const typesParService = new Map<number, string>();
    const getServiceType = async (collectiviteId: number): Promise<string> => {
      const connu = typesParService.get(collectiviteId);
      if (connu !== undefined) {
        return connu;
      }
      const [service] = await db
        .select({ type: collectiviteTable.type })
        .from(collectiviteTable)
        .where(eq(collectiviteTable.id, collectiviteId))
        .limit(1);
      const type = service?.type ?? 'inconnu';
      typesParService.set(collectiviteId, type);
      return type;
    };

    for (const demarche of demarches) {
      const [couvrants, saisis] = await Promise.all([
        instructeurs.listInstructeursCouvrants(demarche.collectiviteId),
        db
          .select({
            instructeurId: pcaetDemandeAvisTable.instructeurCollectiviteId,
          })
          .from(pcaetDemandeAvisTable)
          .where(eq(pcaetDemandeAvisTable.demarcheId, demarche.id)),
      ]);

      const dejaSaisis = new Set(
        saisis.map(({ instructeurId }) => instructeurId)
      );

      for (const couvrant of couvrants) {
        if (dejaSaisis.has(couvrant.collectiviteId)) {
          continue;
        }
        manquantes.push({
          demarcheId: demarche.id,
          collectiviteId: demarche.collectiviteId,
          collectiviteNom: demarche.collectiviteNom,
          instructeurId: couvrant.collectiviteId,
          instructeurNom: couvrant.nom,
          instructeurType: await getServiceType(couvrant.collectiviteId),
        });
      }
    }

    printSummary(manquantes);

    if (manquantes.length === 0) {
      console.log('\nRien à rattraper.');
      return;
    }

    if (!isConfirmed) {
      console.log(
        '\nMode à blanc : rien n’a été écrit. Relancer avec --confirm pour saisir.'
      );
      return;
    }

    const demarchesARattraper = [
      ...new Map(
        manquantes.map((m) => [
          m.demarcheId,
          { demarcheId: m.demarcheId, collectiviteId: m.collectiviteId },
        ])
      ).values(),
    ];

    for (const cible of demarchesARattraper) {
      await instructeurs.saisirInstructeurs(cible);
    }

    console.log(
      `\n${manquantes.length} saisine(s) rattrapée(s) sur ${demarchesARattraper.length} dossier(s).`
    );
  } finally {
    await pool.end();
  }
};

/** Ce que l'opérateur doit pouvoir vérifier avant d'écrire quoi que ce soit. */
const printSummary = (manquantes: Manquante[]) => {
  console.log(`\n${manquantes.length} saisine(s) manquante(s).`);

  const parType = manquantes.reduce<Record<string, number>>((acc, m) => {
    acc[m.instructeurType] = (acc[m.instructeurType] ?? 0) + 1;
    return acc;
  }, {});

  for (const [type, nombre] of Object.entries(parType).sort()) {
    console.log(`  ${type} : ${nombre}`);
  }

  const parService = manquantes.reduce<Record<string, number>>((acc, m) => {
    acc[m.instructeurNom] = (acc[m.instructeurNom] ?? 0) + 1;
    return acc;
  }, {});

  const top = Object.entries(parService)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (top.length > 0) {
    console.log('\nServices les plus concernés :');
    for (const [nom, nombre] of top) {
      console.log(`  ${nom} : ${nombre}`);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
