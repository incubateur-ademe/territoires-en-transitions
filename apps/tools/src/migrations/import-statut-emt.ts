#!/usr/bin/env tsx
/**
 * Import (xlsx) des statuts EMT
 * Remplace supabase/functions/import_statut_emt/index.ts
 *
 * Usage:
 *   SUPABASE_URL="http://127.0.0.1:54321" \
 *   SUPABASE_SERVICE_ROLE_KEY="..." \
 *   tsx apps/tools/src/migrations/import-statut-emt.ts <collectivite_id> <chemin/fichier.xlsx> [--test]
 *
 * --test : utilise l'utilisateur YOLO comme modified_by au lieu de TeT
 *
 * Forcer un recalcul du snapshot score-courant de la collectivité/référentiel
 * concerné pour que les textes et statuts soient bien affichés dans l'app.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ExcelJS, {
  type CellFormulaValue,
  type CellHyperlinkValue,
  type CellRichTextValue,
  type CellSharedFormulaValue,
  type CellValue,
} from 'exceljs';
import Fuse from 'fuse.js';
import { readFile } from 'node:fs/promises';

const tetUserId = '0938e00d-ff6d-41b0-82a0-068858a66520';
const yoloUserId = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9';

const avancementStatut = [
  'pas_fait',
  'fait',
  'non_renseigne',
  'programme',
  'detaille',
] as const;

const IMPORT_EMT_PREFIX = 'Import EMT: ';

/** vérifie si le commentaire xlsx a déjà été importé (relance du script) */
function isDejaImporte(
  commentaireExistant: string,
  commentaire: string
): boolean {
  if (!commentaireExistant.startsWith(IMPORT_EMT_PREFIX)) {
    return false;
  }
  const sansPrefixe = commentaireExistant.slice(IMPORT_EMT_PREFIX.length);
  const premierSegment = sansPrefixe.split('\n---\n')[0];
  return premierSegment === commentaire;
}

type ActionCommentaireRow = {
  action_id: string;
  collectivite_id: number;
  commentaire: string;
  modified_by?: string;
};

type ActionStatutRow = {
  action_id: string;
  collectivite_id: number;
  avancement: string;
  concerne: boolean;
  modified_by?: string;
};

const usage =
  'tsx apps/tools/src/migrations/import-statut-emt.ts <collectivite_id> <chemin/fichier.xlsx> [--test]';

function parseArgs(argv: string[]) {
  const args = argv.filter((arg) => arg !== '--test');
  const test = argv.includes('--test');

  if (args.length < 2) {
    throw new Error(`Arguments manquants.\nUsage: ${usage}`);
  }

  const collectiviteId = parseInt(args[0], 10);
  if (Number.isNaN(collectiviteId)) {
    throw new Error(`collectivite_id invalide: ${args[0]}`);
  }

  return {
    collectiviteId,
    filePath: args[1],
    test,
  };
}

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.\n' +
        'Exemple: export SUPABASE_URL="http://127.0.0.1:54321"'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'public' },
    auth: { persistSession: false },
  });
}

function extractCellValue(
  cell: CellValue
): string | number | boolean | Date | null | undefined {
  if (cell === null || cell === undefined) {
    return cell;
  }
  if (
    typeof cell === 'string' ||
    typeof cell === 'number' ||
    typeof cell === 'boolean' ||
    cell instanceof Date
  ) {
    return cell;
  }
  if (
    typeof cell === 'object' &&
    'richText' in cell &&
    Array.isArray((cell as CellRichTextValue).richText)
  ) {
    return (cell as CellRichTextValue).richText
      .map((part) => part.text)
      .join('');
  }
  if (typeof cell === 'object' && 'hyperlink' in cell && 'text' in cell) {
    return (cell as CellHyperlinkValue).text;
  }
  if (
    typeof cell === 'object' &&
    ('formula' in cell || 'sharedFormula' in cell)
  ) {
    const withResult = cell as CellFormulaValue | CellSharedFormulaValue;
    const result = withResult.result;
    if (result !== undefined && result !== null) {
      if (typeof result === 'object' && 'error' in result) {
        return undefined;
      }
      return result as string | number | boolean | Date;
    }
    return undefined;
  }
  if (typeof cell === 'object' && 'error' in cell) {
    return undefined;
  }
  return undefined;
}

function findSheetBounds(worksheet: ExcelJS.Worksheet): {
  entete: number;
  derniereCellule: number;
} {
  let derniereCellule = 0;
  let entete = 0;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const ligne = rowNumber - 1;
    if (ligne > 0) {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (extractCellValue(cell.value) === 'Arborescence') {
          entete = ligne;
        }
      });
      derniereCellule = ligne;
    }
  });

  return { entete, derniereCellule };
}

function getCelluleValue(
  worksheet: ExcelJS.Worksheet,
  ligne: number,
  colonne: number
): string | number | null {
  const value = extractCellValue(
    worksheet.getRow(ligne + 1).getCell(colonne + 1).value
  );
  if (value === undefined || value === null) {
    return null;
  }
  return typeof value === 'boolean' || value instanceof Date
    ? String(value)
    : value;
}

async function fetchCommentaires(
  supabaseClient: SupabaseClient,
  collectiviteId: number
) {
  const { error, data } = await supabaseClient
    .from('action_commentaire')
    .select()
    .eq('collectivite_id', collectiviteId);

  if (error) {
    throw new Error(error.message);
  }

  const commentaires = new Map<string, ActionCommentaireRow>();
  for (const commentaire of data ?? []) {
    commentaires.set(commentaire.action_id, commentaire);
  }
  return commentaires;
}

async function fetchStatuts(
  supabaseClient: SupabaseClient,
  collectiviteId: number
) {
  const { error, data } = await supabaseClient
    .from('action_statut')
    .select()
    .eq('collectivite_id', collectiviteId);

  if (error) {
    throw new Error(error.message);
  }

  const statuts = new Map<string, ActionStatutRow>();
  for (const statut of data ?? []) {
    statuts.set(statut.action_id, statut);
  }
  return statuts;
}

async function fetchActions(supabaseClient: SupabaseClient) {
  const { error, data } = await supabaseClient.from('action_relation').select();

  if (error) {
    throw new Error(error.message);
  }

  const actions = new Set<string>();
  for (const action of data ?? []) {
    actions.add(action.id);
  }
  return actions;
}

async function saveCommentaire(
  supabaseClient: SupabaseClient,
  collectiviteId: number,
  actionId: string,
  commentaire: string,
  commentaires: Map<string, ActionCommentaireRow>,
  tetId: string
): Promise<boolean> {
  const existant = commentaires.get(actionId);
  if (existant && isDejaImporte(existant.commentaire, commentaire)) {
    return false;
  }

  let commentaireToSave = existant;
  if (commentaireToSave) {
    commentaireToSave.commentaire =
      commentaire + '\n---\n' + commentaireToSave.commentaire;
  } else {
    commentaireToSave = {
      action_id: actionId,
      collectivite_id: collectiviteId,
      commentaire,
    };
  }
  commentaireToSave.modified_by = tetId;
  commentaireToSave.commentaire =
    IMPORT_EMT_PREFIX + commentaireToSave.commentaire;

  const { error } = await supabaseClient
    .from('action_commentaire')
    .upsert(commentaireToSave);
  if (error) {
    throw new Error(`action_commentaire ${actionId}: ${error.message}`);
  }

  commentaires.set(actionId, commentaireToSave);
  return true;
}

async function saveStatut(
  supabaseClient: SupabaseClient,
  collectiviteId: number,
  actionId: string,
  statut: string,
  statuts: Map<string, ActionStatutRow>,
  tetId: string
) {
  // on n'écrase pas les statuts déjà renseignés
  if (!statuts.get(actionId)) {
    const statutToSave: ActionStatutRow = {
      action_id: actionId,
      collectivite_id: collectiviteId,
      avancement: statut,
      concerne: true,
      modified_by: tetId,
    };

    const { error } = await supabaseClient
      .from('action_statut')
      .upsert(statutToSave);
    if (error) {
      throw new Error(`action_statut ${actionId}: ${error.message}`);
    }
  }
}

async function importStatutEmt(args: {
  collectiviteId: number;
  filePath: string;
  test: boolean;
}) {
  const supabaseClient = getSupabaseClient();
  const fileBuffer = await readFile(args.filePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as unknown as ArrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Aucune feuille trouvée dans le fichier xlsx');
  }

  const { entete, derniereCellule } = findSheetBounds(worksheet);
  if (entete === 0) {
    throw new Error('En-tête « Arborescence » introuvable dans le fichier');
  }

  console.log(
    `Import EMT pour collectivité ${args.collectiviteId} (${args.filePath})`
  );
  console.log(`Lignes ${entete + 1} à ${derniereCellule}`);

  const statuts = await fetchStatuts(supabaseClient, args.collectiviteId);
  const commentaires = await fetchCommentaires(
    supabaseClient,
    args.collectiviteId
  );
  const tetId = args.test ? yoloUserId : tetUserId;
  const fuse = new Fuse([...avancementStatut]);
  const actions = await fetchActions(supabaseClient);

  let savedCommentaires = 0;
  let savedStatuts = 0;
  let skippedActions = 0;

  for (let ligne = entete + 1; ligne < derniereCellule + 1; ligne++) {
    const actionIdRaw = getCelluleValue(worksheet, ligne, 0);
    const actionId = actionIdRaw == null ? null : String(actionIdRaw);

    if (!actionId || !actions.has(actionId)) {
      if (actionId) {
        skippedActions++;
      }
      continue;
    }

    let commentaire = getCelluleValue(worksheet, ligne, 2);
    if (typeof commentaire === 'string') {
      commentaire = commentaire.replace('_x000D_', '');
    }
    const statut = getCelluleValue(worksheet, ligne, 3);

    if (commentaire) {
      const saved = await saveCommentaire(
        supabaseClient,
        args.collectiviteId,
        actionId,
        String(commentaire),
        commentaires,
        tetId
      );
      if (saved) {
        savedCommentaires++;
      }
    }

    if (statut) {
      const statutClean = fuse.search(String(statut))?.[0]?.item;
      if (statutClean) {
        await saveStatut(
          supabaseClient,
          args.collectiviteId,
          actionId,
          statutClean,
          statuts,
          tetId
        );
        savedStatuts++;
      }
    }
  }

  console.log('Import terminé.');
  console.log(`  commentaires sauvegardés: ${savedCommentaires}`);
  console.log(`  statuts sauvegardés: ${savedStatuts}`);
  console.log(`  actions ignorées (inconnues): ${skippedActions}`);
}

async function main() {
  const { collectiviteId, filePath, test } = parseArgs(process.argv.slice(2));
  await importStatutEmt({ collectiviteId, filePath, test });
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import EMT échoué:', error);
    process.exit(1);
  });
