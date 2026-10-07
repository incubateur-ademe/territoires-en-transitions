#!/usr/bin/env tsx
/**
 * Reprise T&C, étape 7 : dépose les fichiers des dossiers repris, les range dans leur dossier et écrit les avis rendus.
 * Simulation par défaut (rien n'est déposé), `--confirm` pour valider.
 *
 *   SUPABASE_DATABASE_URL=… SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpx tsx \
 *     apps/tools/src/migrations/reprise-tec/import-pieces-dossiers/index.ts \
 *     --archive chemin/vers/Uploads --suivi chemin/vers/suivi-ademe.csv [--confirm]
 */
import { getCible } from '../db';
import { createEcarts, validateBilan } from '../import-fiches/ecarts';
import { readSuiviAdeme } from '../import-demarches/suivi-ademe';
import { getArgument } from '../import-demarches/utils';
import { readContenus } from './archive';
import { buildAvis, groupAvis, loadSaisines, TITRES } from './avis';
import { createFichiers, type Bibliotheque, type Depot } from './bibliotheque';
import { loadCatalogue } from './catalogue';
import { loadEcarts } from './ecarts';
import { createAvis, createDocuments } from './ecriture';
import { loadFichiers } from './fichiers';
import { validateGardes } from './gardes';
import { buildPieces, toDepot } from './pieces';
import { rangePieces } from './rangement';
import { printRapport } from './rapport';
import { uploadFichiers } from './stockage';

const main = async () => {
  const isConfirmed = process.argv.includes('--confirm');
  const archive = getArgument('--archive');
  const suivi = readSuiviAdeme(getArgument('--suivi'));
  const pool = getCible('reprise-tec-import-pieces-dossiers');
  const client = await pool.connect();

  try {
    const fichiers = await loadFichiers(client);
    const contenus = await readContenus(archive, fichiers);
    const estAvis = (typeFichierId: number) =>
      TITRES.some((t) => t.typeFichierId === typeFichierId);

    const avis = buildAvis(
      groupAvis(fichiers.filter((f) => estAvis(f.typeFichierId))),
      contenus,
      await loadSaisines(client),
      suivi
    );
    // Les fichiers d'avis après ceux des dépôts : une case va d'abord à une pièce déposée.
    const pieces = buildPieces(
      [...fichiers.filter((f) => !estAvis(f.typeFichierId)), ...avis.auDossier],
      contenus
    );
    const catalogue = await loadCatalogue(
      pool,
      pieces.map((p) => p.fichier)
    );
    const { rangements, inclusions } = rangePieces(pieces, catalogue);
    const depots: Depot[] = [
      ...pieces.map(toDepot),
      ...avis.ecrits.map((a) => ({
        collectiviteId: a.saisine.emetteurId,
        fichier: a.retenu,
        contenu: a.retenu.contenu,
        confidentiel: true,
      })),
    ];
    await validateGardes(client, {
      archive,
      avis,
      depots,
    });
    const { lues, ecrites, ecarts } = await loadEcarts(
      client,
      pieces,
      avis,
      contenus
    );
    const bilan = validateBilan(lues, ecrites, ecarts);

    // Avant la transaction : un fichier sans ligne n'est visible nulle part, et relancer le redépose à l'identique.
    const envoi = isConfirmed
      ? await uploadFichiers(client, archive, depots)
      : null;

    await client.query('begin');
    let bibliotheque: Bibliotheque;
    let inclusionsEcrites: number;
    try {
      bibliotheque = await createFichiers(client, depots);
      inclusionsEcrites = await createDocuments(
        client,
        rangements,
        inclusions,
        bibliotheque
      );
      await createAvis(client, avis.ecrits);
      await createEcarts(client, ecarts);
      await client.query(isConfirmed ? 'commit' : 'rollback');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }

    printRapport({
      bilan,
      ecarts,
      fichiers,
      pieces,
      rangements,
      inclusions: inclusionsEcrites,
      avis,
      bibliotheque,
      envoi,
      isConfirmed,
    });
  } finally {
    client.release();
    await pool.end();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
