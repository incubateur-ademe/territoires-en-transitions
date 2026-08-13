import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
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
 * Rattache un programme d'actions à la démarche — l'une des deux conditions du
 * guard `dossierComplet`.
 */
export async function attachTestPlanToDemarchePcaet(
  db: DatabaseService,
  { collectiviteId, demarcheId }: { collectiviteId: number; demarcheId: number }
): Promise<{ id: number }> {
  const [plan] = await db.db
    .insert(axeTable)
    .values({ nom: 'Programme d’actions du PCAET', collectiviteId })
    .returning({ id: axeTable.id });

  await db.db
    .update(demarcheTable)
    .set({ planActionId: plan.id })
    .where(eq(demarcheTable.id, demarcheId));

  return plan;
}

/**
 * Couvre toutes les sections requises en déposant le seul document global —
 * l'autre condition du guard `dossierComplet`. Écrit directement en base : c'est
 * un raccourci de mise en situation, pas un test du chemin de dépôt.
 */
export async function coverTestDocumentsPcaet(
  db: DatabaseService,
  {
    collectiviteId,
    demarcheId,
    userId,
  }: { collectiviteId: number; demarcheId: number; userId?: string }
): Promise<void> {
  const fichier = await addTestBibliothequeFichier(db, { collectiviteId });
  await db.db.insert(demarcheDocumentTable).values({
    collectiviteId,
    demarcheId,
    documentId: PCAET_DOCUMENT_GLOBAL_ID,
    fichierId: fichier.id,
    modifiedBy: userId ?? null,
  });
}

/**
 * Renseigne chaque ligne requise du diagnostic : un résultat sur l'année de
 * comptabilisation et un objectif sur le premier horizon du topic. Écrit
 * directement dans `indicateur_valeur`, là où vivent les valeurs de la
 * collectivité.
 */
export async function completeTestDiagnosticPcaet(
  db: DatabaseService,
  {
    collectiviteId,
    demarcheId,
    referenceYear = 2021,
  }: { collectiviteId: number; demarcheId: number; referenceYear?: number }
): Promise<void> {
  await db.db.execute(sql`
    insert into demarche_pcaet_diagnostic_state (demarche_id, topic_id, reference_year)
    select ${demarcheId}, id, ${referenceYear}
    from demarche_pcaet_topic
    where kind = 'indicateurs'
    on conflict (demarche_id, topic_id) do update set reference_year = ${referenceYear}
  `);

  await db.db.execute(sql`
    with ligne as (
        select d.id as indicateur_id, t.horizons[1] as horizon
        from demarche_pcaet_topic t
        join demarche_pcaet_topic_row r on r.topic_id = t.id
        join indicateur_definition d on d.identifiant_referentiel = r.referentiel_id
        where t.kind = 'indicateurs' and r.requis
    )
    insert into indicateur_valeur
        (indicateur_id, collectivite_id, date_valeur, metadonnee_id, resultat, objectif)
    select ligne.indicateur_id, ${collectiviteId}, annee.date_valeur, null,
           annee.resultat, annee.objectif
    from ligne
    cross join lateral (
        values (make_date(${referenceYear}, 1, 1), 100::double precision, null::double precision),
               (make_date(ligne.horizon, 1, 1), null, 80::double precision)
    ) as annee(date_valeur, resultat, objectif)
    on conflict do nothing
  `);
}

/**
 * Déclare chaque domaine requis « non concerné » aux trois horizons : le
 * chemin le plus court vers un volet vulnérabilité complet, puisque ce niveau
 * dispense d'objectif.
 */
export async function completeTestVulnerabilitePcaet(
  db: DatabaseService,
  { demarcheId }: { demarcheId: number }
): Promise<void> {
  await db.db.execute(sql`
    insert into demarche_pcaet_vulnerabilite_valeur
        (demarche_id, domaine_id, niveau_maintenant, niveau_2050, niveau_2100)
    select ${demarcheId}, id, 'non_concerne', 'non_concerne', 'non_concerne'
    from demarche_pcaet_vulnerabilite_domaine
    where collectivite_id is null and requis
    on conflict (demarche_id, domaine_id) do update
        set niveau_maintenant = 'non_concerne',
            niveau_2050 = 'non_concerne',
            niveau_2100 = 'non_concerne'
  `);
}

/**
 * Rend le dossier complet au sens du guard `dossierComplet` : programme
 * d'actions rattaché, pièces requises couvertes, diagnostic renseigné et
 * vulnérabilité déclarée. Les composer séparément permet de tester chacune.
 */
export async function completeTestDossierPcaet(
  db: DatabaseService,
  options: { collectiviteId: number; demarcheId: number; userId?: string }
): Promise<void> {
  await attachTestPlanToDemarchePcaet(db, options);
  await coverTestDocumentsPcaet(db, options);
  await completeTestDiagnosticPcaet(db, options);
  await completeTestVulnerabilitePcaet(db, options);
}
