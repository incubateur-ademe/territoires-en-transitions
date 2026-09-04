import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PcaetDemandeAvisEtatEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { onTestFinished } from 'vitest';
import { attachTestPlanToDemarchePcaet } from '../demarches-pcaet.test-fixture';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('getDossierInstruction', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let demarcheId: number;
  let deposanteCollectiviteId: number;
  let instructeurCollectiviteId: number;
  let demandeAvisId: number;

  // Un code région propre à cette spec, pris hors de la plage réelle : les dix-huit
  // codes numériques portent les DREAL de l'import (collectivite/service_etat_import),
  // et l'index unique « une DREAL par région » ne tolère pas deux occupants.
  const REGION = 'DO';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test consultation' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);
    deposanteCollectiviteId = deposante.collectivite.id;

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test consultation',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);
    instructeurCollectiviteId = dreal.collectivite.id;

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test consultation',
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
        avisDeadlineAt: new Date(
          Date.now() + 30 * 24 * 3600 * 1000
        ).toISOString(),
      })
      .returning({ id: demarcheTable.id });
    demarcheId = demarche.id;

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId,
        instructeurCollectiviteId: dreal.collectivite.id,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeAvisId = demande.id;

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.id, demandeAvisId));
      await db.db.delete(demarcheTable).where(eq(demarcheTable.id, demarcheId));
      await dreal.cleanup();
      await deposante.cleanup();
      await app.close();
    };
  });

  it("l'instructeur lit l'en-tête du dossier de la collectivité", async () => {
    const dossier = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierInstruction({ demandeAvisId });

    expect(dossier.demarcheId).toBe(demarcheId);
    expect(dossier.titre).toBe('PCAET test consultation');
    expect(dossier.status).toBe('transmis_pour_avis');
    expect(dossier.collectivite.nom).toBe('Agglo test consultation');
    expect(dossier.avisDeadlineAt).not.toBeNull();
    expect(dossier.createdAt).not.toBeNull();
    expect(dossier.modifiedAt).not.toBeNull();
    expect(dossier.launchedAt).toBeNull();
    expect(dossier.pilotes).toEqual([]);
  });

  it("expose l'état de l'instruction, pas seulement le statut du dossier", async () => {
    const dossier = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierInstruction({ demandeAvisId });

    expect(dossier.status).toBe('transmis_pour_avis');
    expect(dossier.etat).toBe(PcaetDemandeAvisEtatEnum.A_TRAITER);
  });

  it('et le modèle documentaire servi par la base, dossier vide', async () => {
    const dossier = await router
      .createCaller({ user: camille })
      .demarches.pcaet.getDossierInstruction({ demandeAvisId });

    expect(dossier.documents.definitions.length).toBeGreaterThan(0);
    expect(dossier.documents.definitions.map((d) => d.id)).toContain(
      'pcaet_diagnostic'
    );
    expect(dossier.documents.documents).toEqual([]);
  });

  // L'instructeur n'a aucun droit sur les plans de la déposante : le programme
  // d'actions ne peut lui parvenir que par ce DTO.
  it('expose le programme d’actions rattaché, avec son nombre d’actions', async () => {
    const caller = router.createCaller({ user: camille });

    const avantRattachement =
      await caller.demarches.pcaet.getDossierInstruction({ demandeAvisId });
    expect(avantRattachement.plans).toEqual([]);

    const plan = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId: deposanteCollectiviteId,
      demarcheId,
      nom: 'Programme d’actions consultable',
    });
    // Le plan appartient à la collectivité : sans ce nettoyage, il retiendrait
    // sa suppression dans le teardown de la suite.
    onTestFinished(async () => {
      await db.db
        .delete(demarchePlanActionTable)
        .where(eq(demarchePlanActionTable.planActionId, plan.id));
      await db.db.delete(axeTable).where(eq(axeTable.id, plan.id));
    });

    const dossier = await caller.demarches.pcaet.getDossierInstruction({
      demandeAvisId,
    });
    // Un plan fraîchement rattaché n'a ni sous-axe ni action : c'est l'état que
    // l'écran présente comme « plan vide ».
    expect(dossier.plans).toEqual([
      {
        id: plan.id,
        nom: 'Programme d’actions consultable',
        nbFiches: 0,
        fiches: [],
        axes: [],
      },
    ]);
  });

  // L'instructeur doit voir ce qui a déjà été rendu sur le dossier : c'est ce
  // qui l'informe, et ce qui retire le titre concerné de la finalisation.
  it('expose les avis déjà déposés sur la demande', async () => {
    const caller = router.createCaller({ user: camille });

    const avant = await caller.demarches.pcaet.getDossierInstruction({
      demandeAvisId,
    });
    expect(avant.avis).toEqual([]);

    const [avis] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId,
        emetteurCollectiviteId: instructeurCollectiviteId,
        auTitreDe: 'autorite_environnementale',
        sens: 'avec_reserves',
        fichierRef: 'avis-ae.pdf',
        deposePar: camille.id,
        valideLe: new Date().toISOString(),
      })
      .returning({ id: pcaetAvisTable.id });
    onTestFinished(async () => {
      await db.db.delete(pcaetAvisTable).where(eq(pcaetAvisTable.id, avis.id));
    });

    const dossier = await caller.demarches.pcaet.getDossierInstruction({
      demandeAvisId,
    });
    expect(dossier.avis).toHaveLength(1);
    expect(dossier.avis[0]).toMatchObject({
      id: avis.id,
      auTitreDe: 'autorite_environnementale',
      sens: 'avec_reserves',
    });
    expect(dossier.avis[0].valideLe).not.toBeNull();
  });

  it("ne dit le dossier instruit qu'une fois les deux titres rendus", async () => {
    const caller = router.createCaller({ user: camille });

    const deposerAvis = async (auTitreDe: 'prefet_region' | 'autorite_environnementale') => {
      const [avis] = await db.db
        .insert(pcaetAvisTable)
        .values({
          demandeAvisId,
          emetteurCollectiviteId: instructeurCollectiviteId,
          auTitreDe,
          sens: 'favorable',
          fichierRef: `avis-${auTitreDe}.pdf`,
          deposePar: camille.id,
          valideLe: new Date().toISOString(),
        })
        .returning({ id: pcaetAvisTable.id });
      onTestFinished(async () => {
        await db.db.delete(pcaetAvisTable).where(eq(pcaetAvisTable.id, avis.id));
      });
    };

    // Un titre sur deux : l'instructeur a encore un avis à produire, et son
    // échéance reste l'information utile.
    await deposerAvis('prefet_region');
    const partiel = await caller.demarches.pcaet.getDossierInstruction({
      demandeAvisId,
    });
    expect(partiel.instruitLe).toBeNull();

    await deposerAvis('autorite_environnementale');
    const complet = await caller.demarches.pcaet.getDossierInstruction({
      demandeAvisId,
    });
    expect(complet.instruitLe).not.toBeNull();
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(
      router
        .createCaller({ user: marie })
        .demarches.pcaet.getDossierInstruction({ demandeAvisId })
    ).rejects.toThrow();
  });

  it('refuse une demande inconnue', async () => {
    await expect(
      router
        .createCaller({ user: camille })
        .demarches.pcaet.getDossierInstruction({ demandeAvisId: 999999999 })
    ).rejects.toThrow();
  });
});
