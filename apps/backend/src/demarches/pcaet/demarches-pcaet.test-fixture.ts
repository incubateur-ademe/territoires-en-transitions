import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { demarcheDocumentTable } from '@tet/backend/demarches/shared/models/demarche-document.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

/**
 * Ajoute un fichier dans la bibliothèque de la collectivité, sans passer par le
 * stockage : le type reste inconnu côté `storage.objects`, ce que les règles du
 * dossier PCAET acceptent en se rabattant sur l'extension.
 */
export async function addTestBibliothequeFichier(
  db: DatabaseService,
  {
    collectiviteId,
    filename = 'dossier-pcaet.pdf',
  }: { collectiviteId: number; filename?: string }
): Promise<{ id: number; filename: string }> {
  const [fichier] = await db.db
    .insert(bibliothequeFichierTable)
    .values({
      collectiviteId,
      // La bibliothèque est dédupliquée par (collectivite, hash) : un hash
      // aléatoire garantit une nouvelle entrée à chaque appel.
      hash: randomUUID().replaceAll('-', ''),
      filename,
      confidentiel: false,
    })
    .returning({
      id: bibliothequeFichierTable.id,
      filename: bibliothequeFichierTable.filename,
    });

  return { id: fichier.id, filename: fichier.filename ?? filename };
}

/**
 * Identifiant de la pièce globale du modèle de démarche PCAET : son dépôt couvre
 * toutes les sections attendues.
 */
export const PCAET_DOCUMENT_GLOBAL_ID = 'pcaet_document_global';

/**
 * Rend le dossier complet au sens du guard `dossierComplet` : rattache un plan
 * d'actions et dépose le document global, qui couvre toutes les sections
 * requises. Écrit directement en base — c'est un raccourci de mise en situation,
 * pas un test du chemin de dépôt.
 */
export async function completeTestDossierPcaet(
  db: DatabaseService,
  {
    collectiviteId,
    demarcheId,
    userId,
  }: { collectiviteId: number; demarcheId: number; userId?: string }
): Promise<void> {
  const [plan] = await db.db
    .insert(axeTable)
    .values({ nom: 'Programme d’actions du PCAET', collectiviteId })
    .returning({ id: axeTable.id });

  await db.db
    .update(demarcheTable)
    .set({ planActionId: plan.id })
    .where(eq(demarcheTable.id, demarcheId));

  const fichier = await addTestBibliothequeFichier(db, { collectiviteId });
  await db.db.insert(demarcheDocumentTable).values({
    collectiviteId,
    demarcheId,
    documentId: PCAET_DOCUMENT_GLOBAL_ID,
    fichierId: fichier.id,
    modifiedBy: userId ?? null,
  });
}
