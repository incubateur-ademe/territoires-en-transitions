import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import type { Collectivite, CollectiviteType } from '@tet/domain/collectivites';
import { ficheActionSecteurAttributionTable } from '@tet/backend/plans/fiches/fiche-secteurs/fiche-action-secteur-attribution.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  OrigineSecteursEnum,
  PlanSourceEnum,
  PlanStatusEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { listEnabledTransitions } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import { onTestFinished, vi } from 'vitest';
import { failure } from '@tet/backend/utils/result.type';
import { DemarchePcaetExportRepository } from '../exports/demarche-pcaet-export.repository';
import { DEMARCHE_PCAET_EXPORTS_BUCKET } from '../exports/demarche-pcaet-exports-storage.service';
import { DemarchePcaetTransitionRepository } from '../shared/demarche-pcaet-transition.repository';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { CloreInstructionService } from '../clore-instruction/clore-instruction.service';
import { collectivitePerimetreSecondaireTable } from '@tet/backend/collectivites/shared/models/collectivite-perimetre-secondaire.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import { PcaetInstructeursRepository } from '../shared/pcaet-instructeurs.repository';
import {
  addTestFichePcaet,
  attachTestPlanToDemarchePcaet,
  cloreTestInstructionPcaet,
  completeTestDiagnosticIndicateursPcaet,
  completeTestDossierPcaet,
  completeTestVulnerabilitePcaet,
  coverTestDocumentsPcaet,
  listTestDemarchePcaetExports,
  listTestWorksheetTexts,
  loadTestDemarchePcaetExportWorkbook,
  pickFreeRegionCode,
} from '../demarches-pcaet.test-fixture';

describe('Cycle de vie de la démarche PCAET (transitions)', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshEditor = async (collectivite?: Partial<Collectivite>) => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
      collectivite,
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      user,
      caller: router.createCaller({ user }),
    };
  };

  // Antidate l'échéance d'avis (figée à la transmission) pour qu'elle soit écoulée.
  const backdateTransmission = async (demarcheId: number) => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  test('Transmettre pour avis, journalisé et sans retour possible', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
    // La transmission ferme le dossier d'élaboration.
    expect(transmise.amontModifiable).toBe(false);
    // La transmission fige sa date et l'échéance légale de remise des avis.
    expect(transmise.transmittedAt).not.toBeNull();
    expect(transmise.avisDeadlineAt).not.toBeNull();
    expect(
      new Date(transmise.avisDeadlineAt as string).getTime()
    ).toBeGreaterThan(Date.now());

    // Le dossier est entre les mains des instances consultatives : la
    // collectivité n'a plus aucune action dessus, elle attend. Les deux sorties
    // restantes sont constatées par le système, et leurs conditions ne sont pas
    // réunies — ni avis rendus, ni délai écoulé.
    const apres = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(apres.transitions)).toEqual([]);

    const history = await db.db
      .select()
      .from(demarcheStatusHistoryTable)
      .where(eq(demarcheStatusHistoryTable.demarcheId, created.id));
    expect(history.map((entry) => entry.transition)).toEqual([
      'transmettre_pour_avis',
    ]);
    expect(history[0].fromStatus).toBe('en_elaboration');
    expect(history[0].toStatus).toBe('transmis_pour_avis');
  });

  test('Clôture d’instruction : sans effet avant la fin du délai, appliquée après', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    // Aucune des deux conditions n'est réunie : le service ne fait rien, et
    // n'échoue pas — c'est ce qui le rend appelable sans condition.
    const cloreService = app.get(CloreInstructionService);
    const cible = { collectiviteId: collectivite.id, demarcheId: created.id };
    const sansEffet = await cloreService.clore(cible);
    expect(sansEffet).toEqual({ success: true, data: null });

    await backdateTransmission(created.id);

    const close = await cloreService.clore(cible);
    expect(close.success && close.data?.status).toBe('instruit');

    // Le journal nomme la cause : ici le délai, pas les avis.
    const history = await db.db
      .select()
      .from(demarcheStatusHistoryTable)
      .where(eq(demarcheStatusHistoryTable.demarcheId, created.id));
    const derniere = history.at(-1);
    expect(derniere?.transition).toBe('delai_avis_echu');
    // Personne ne l'a demandée : le journal ne l'impute à aucun utilisateur.
    expect(derniere?.createdBy).toBeNull();
  });

  test('Le guard estPilote réserve les transitions pilotées aux pilotes', async () => {
    const fixture = await addTestCollectiviteAndUsers(db, {
      users: [
        { role: CollectiviteRole.EDITION },
        { role: CollectiviteRole.EDITION },
      ],
    });
    const pilote = getAuthUserFromUserCredentials(fixture.users[0]);
    const autreEditeur = getAuthUserFromUserCredentials(fixture.users[1]);
    const piloteCaller = router.createCaller({ user: pilote });
    const autreEditeurCaller = router.createCaller({ user: autreEditeur });

    const created = await piloteCaller.demarches.pcaet.create({
      collectiviteId: fixture.collectivite.id,
      pilotes: [{ userId: pilote.id, tagId: null }],
    });
    // `transmettre_pour_avis` cumule estPilote et dossierComplet : même pour le
    // pilote, elle reste indisponible tant que le dossier est vide.
    expect(listEnabledTransitions(created.transitions)).toEqual([]);
    // Le dossier est bien ouvert en écriture : c'est son contenu qui manque.
    expect(created.amontModifiable).toBe(true);

    await completeTestDossierPcaet(db, {
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });

    // Les transitions applicables sont calculées par utilisateur.
    const vuePilote = await piloteCaller.demarches.pcaet.get({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(vuePilote.transitions)).toEqual([
      'transmettre_pour_avis',
    ]);

    const vueAutreEditeur = await autreEditeurCaller.demarches.pcaet.get({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(vueAutreEditeur.transitions)).toEqual([]);

    // Un éditeur non pilote ne peut pas transmettre…
    await expect(
      autreEditeurCaller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: fixture.collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('NON_PILOTE');

    // …le pilote, oui.
    const transmise = await piloteCaller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');

    // La clôture, elle, n'obéit pas à cette règle : elle n'a pas d'acteur, donc
    // pas de guard `estPilote`. Le pilote reprend la main à la publication.
    await cloreTestInstructionPcaet(app, db, {
      collectiviteId: fixture.collectivite.id,
      demarcheId: created.id,
    });

    await expect(
      autreEditeurCaller.demarches.pcaet.publier({
        collectiviteId: fixture.collectivite.id,
        demarcheId: created.id,
        dateAdoption: '2026-01-15',
      })
    ).rejects.toThrow('NON_PILOTE');
  });

  test('Le guard dossierComplet exige les pièces requises et le programme d’actions', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    // Dossier vide : aucune pièce requise couverte, aucun plan rattaché.
    expect(listEnabledTransitions(created.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // Les pièces requises couvertes ne suffisent pas : sans programme d'actions
    // rattaché, le serveur refuse la transmission — et ne l'annonce pas.
    await coverTestDocumentsPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    const sansPlan = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(sansPlan.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // Le programme d'actions rattaché ne suffit pas non plus : le diagnostic
    // doit porter un résultat et un objectif sur chaque ligne requise.
    await attachTestPlanToDemarchePcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    const sansDiagnostic = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(sansDiagnostic.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // Les indicateurs du diagnostic ne suffisent pas davantage : la
    // vulnérabilité du territoire doit être déclarée pour chaque thématique du
    // socle.
    await completeTestDiagnosticIndicateursPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });

    const sansVulnerabilite = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(sansVulnerabilite.transitions)).toEqual([]);

    // Les quatre conditions réunies, la transition s'ouvre.
    await completeTestVulnerabilitePcaet(db, { demarcheId: created.id });

    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Un plan importé par IA se rattache, mais retient le dossier tant qu’il n’est pas vérifié', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    const imported = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      nom: 'Plan importé',
    });
    await db.db
      .update(axeTable)
      .set({
        source: PlanSourceEnum.IMPORT_IA,
        status: PlanStatusEnum.TO_VERIFY,
      })
      .where(eq(axeTable.id, imported.id));

    const nonVerifie = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(nonVerifie.planActionIds).toContain(imported.id);
    expect(nonVerifie.unverifiedPlanActionIds).toEqual([imported.id]);
    expect(listEnabledTransitions(nonVerifie.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    await caller.plans.plans.verify({ planId: imported.id });

    const verifie = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(verifie.unverifiedPlanActionIds).toEqual([]);
    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Des secteurs réglementaires à renseigner retiennent le dossier', async () => {
    const { caller, collectivite, user } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });
    await completeTestDossierPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    const plan = await attachTestPlanToDemarchePcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
      nom: 'Plan aux secteurs incomplets',
    });
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({ titre: 'Rénover les écoles', collectiviteId: collectivite.id })
      .returning({ id: ficheActionTable.id });
    await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: fiche.id, axeId: plan.id, createdBy: user.id });
    // Communs n'a pas su classer l'action : à la collectivité de le faire.
    await db.db.insert(ficheActionSecteurAttributionTable).values({
      ficheId: fiche.id,
      origine: OrigineSecteursEnum.INDISPONIBLE,
      secteurs: [],
    });

    const incomplet = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(incomplet.secteursARenseignerPlanActionIds).toEqual([plan.id]);
    expect(listEnabledTransitions(incomplet.transitions)).toEqual([]);
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    await caller.plans.fiches.upsertSecteurs({
      ficheId: fiche.id,
      secteurs: ['residentiel'],
    });

    const complet = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(complet.secteursARenseignerPlanActionIds).toEqual([]);
    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Le contournement de démonstration dispense le dossier de son diagnostic', async () => {
    const { caller, collectivite, user } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    // Dossier complet sauf le diagnostic : sans contournement, refusé.
    await coverTestDocumentsPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await attachTestPlanToDemarchePcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // Le bypass est piloté par le feature flag PostHog :
    const trackingService = app.get(TrackingService);
    const isFeatureEnabled =
      trackingService.isFeatureEnabled.bind(trackingService);
    const spy = vi
      .spyOn(trackingService, 'isFeatureEnabled')
      .mockImplementation(async (feature, ...args) =>
        feature === 'is-demarche-pcaet-bypass-diagnostic-enabled'
          ? true
          : isFeatureEnabled(feature, ...args)
      );
    onTestFinished(() => {
      spy.mockRestore();
    });

    const avecBypass = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(avecBypass.transitions)).toContain(
      'transmettre_pour_avis'
    );
    expect(spy).toHaveBeenCalledWith(
      'is-demarche-pcaet-bypass-diagnostic-enabled',
      user.id,
      collectivite.id,
      { requireExplicitActivation: true }
    );
    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Le contournement par variable d’environnement dispense aussi le dossier de son diagnostic', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await coverTestDocumentsPcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await attachTestPlanToDemarchePcaet(db, {
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    await expect(
      caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      })
    ).rejects.toThrow('DOSSIER_INCOMPLET');

    // DEMARCHE_PCAET_BYPASS_DIAGNOSTIC contourne sans PostHog : en local, le
    // feature flag n'est pas évaluable (ni clé, ni utilisateur connu du projet).
    const configurationService = app.get(ConfigurationService);
    const get = configurationService.get.bind(configurationService);
    const spy = vi
      .spyOn(configurationService, 'get')
      .mockImplementation((key) =>
        key === 'DEMARCHE_PCAET_BYPASS_DIAGNOSTIC' ? true : get(key)
      );
    onTestFinished(() => {
      spy.mockRestore();
    });

    const avecBypass = await caller.demarches.pcaet.get({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(listEnabledTransitions(avecBypass.transitions)).toContain(
      'transmettre_pour_avis'
    );
    const transmise = await caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: collectivite.id,
      demarcheId: created.id,
    });
    expect(transmise.status).toBe('transmis_pour_avis');
  });

  test('Une transition interdite depuis le statut courant est refusée', async () => {
    const { caller, collectivite } = await freshEditor();
    const created = await caller.demarches.pcaet.create({
      collectiviteId: collectivite.id,
    });

    await expect(
      caller.demarches.pcaet.publier({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        dateAdoption: '2026-01-15',
      })
    ).rejects.toThrow('TRANSITION_NOT_ALLOWED');
  });

  describe('Classeurs figés à la transmission', () => {
    test('fige le plan, sa variante sans fiche restreinte et les indicateurs', async () => {
      const { caller, collectivite } = await freshEditor();
      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      const plan = await attachTestPlanToDemarchePcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
        nom: 'Plan climat',
      });
      await addTestFichePcaet(caller, {
        collectiviteId: collectivite.id,
        titre: 'Rénover les écoles',
        axeId: plan.id,
      });
      const restreinteId = await addTestFichePcaet(caller, {
        collectiviteId: collectivite.id,
        titre: 'Fiche confidentielle',
        restreint: true,
        axeId: plan.id,
      });
      await addTestFichePcaet(caller, {
        collectiviteId: collectivite.id,
        titre: 'Sous-action de la fiche confidentielle',
        parentId: restreinteId,
      });

      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      const exports = await listTestDemarchePcaetExports(db, created.id);
      expect(
        exports.map(({ transition, type, storagePath }) => ({
          transition,
          type,
          storagePath,
        }))
      ).toEqual(
        ['plan', 'plan_expurge', 'indicateurs'].map((type) => ({
          transition: 'transmettre_pour_avis',
          type,
          storagePath: expect.stringMatching(
            new RegExp(
              `^${created.id}/transmettre_pour_avis/[0-9a-f-]{36}/${type}\\.xlsx$`
            )
          ),
        }))
      );
      const byType = Object.fromEntries(exports.map((row) => [row.type, row]));
      expect(byType.plan.filename).toMatch(
        /^PCAET_.+_Plan_transmis-pour-avis_\d{4}-\d{2}-\d{2}\.xlsx$/
      );
      // Le lecteur ne reçoit jamais que l'une des deux variantes : même nom.
      expect(byType.plan_expurge.filename).toBe(byType.plan.filename);
      expect(byType.indicateurs.filename).toMatch(
        /^PCAET_.+_Indicateurs_transmis-pour-avis_\d{4}-\d{2}-\d{2}\.xlsx$/
      );

      // Un onglet par plan lié, dans les deux variantes.
      const complet = await loadTestDemarchePcaetExportWorkbook(
        app,
        byType.plan
      );
      expect(complet.worksheets.map(({ name }) => name)).toEqual([
        'Programme d’actions du PCAET',
        'Plan climat',
      ]);
      const textesComplet = listTestWorksheetTexts(complet, 'Plan climat');
      expect(textesComplet).toEqual(
        expect.arrayContaining([
          'Rénover les écoles',
          'Fiche confidentielle',
          'Sous-action de la fiche confidentielle',
          'Secteurs réglementaires',
          'Résidentiel',
        ])
      );

      const expurge = await loadTestDemarchePcaetExportWorkbook(
        app,
        byType.plan_expurge
      );
      expect(expurge.worksheets.map(({ name }) => name)).toEqual([
        'Programme d’actions du PCAET',
        'Plan climat',
      ]);
      const textesExpurge = listTestWorksheetTexts(expurge, 'Plan climat');
      expect(textesExpurge).toContain('Rénover les écoles');
      expect(textesExpurge).not.toContain('Fiche confidentielle');
      expect(textesExpurge).not.toContain(
        'Sous-action de la fiche confidentielle'
      );

      const indicateurs = await loadTestDemarchePcaetExportWorkbook(
        app,
        byType.indicateurs
      );
      expect(indicateurs.worksheets.map(({ name }) => name)).toEqual([
        'Indicateurs',
        'Vulnérabilité',
      ]);
      const entetes = listTestWorksheetTexts(indicateurs, 'Indicateurs');
      expect(entetes).toContain('Catégorie');
      expect(entetes).not.toContain('Pilote');
      expect(entetes).not.toContain('Commentaire');
    });

    test('ne produit pas de variante quand aucune fiche n’est restreinte', async () => {
      const { caller, collectivite } = await freshEditor();
      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      const exports = await listTestDemarchePcaetExports(db, created.id);
      expect(exports.map(({ type }) => type)).toEqual(['plan', 'indicateurs']);
    });

    test('ne fige pas de classeur indicateurs quand le diagnostic est vide', async () => {
      const { caller, collectivite } = await freshEditor();
      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      // Dossier complet sauf le diagnostic, transmis grâce au contournement de
      // démonstration : ni valeur d'indicateur, ni ligne de vulnérabilité.
      await coverTestDocumentsPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      await attachTestPlanToDemarchePcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      const configurationService = app.get(ConfigurationService);
      const get = configurationService.get.bind(configurationService);
      const spy = vi
        .spyOn(configurationService, 'get')
        .mockImplementation((key) =>
          key === 'DEMARCHE_PCAET_BYPASS_DIAGNOSTIC' ? true : get(key)
        );
      onTestFinished(() => spy.mockRestore());

      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      const exports = await listTestDemarchePcaetExports(db, created.id);
      expect(exports.map(({ type }) => type)).toEqual(['plan']);
    });

    test('refuse la transmission si les classeurs ne peuvent pas être enregistrés', async () => {
      // Une DREAL couvre la déposante : sans l'échec, elle serait saisie.
      const regionCode = await pickFreeRegionCode(db, 'dreal');
      const { collectivite: dreal, cleanup } = await addTestCollectivite(db, {
        nom: 'dreal test classeurs',
        type: 'dreal',
        regionCode,
      });
      onTestFinished(async () => {
        await db.db
          .delete(pcaetDemandeAvisTable)
          .where(eq(pcaetDemandeAvisTable.instructeurCollectiviteId, dreal.id));
        await cleanup();
      });
      const { caller, collectivite } = await freshEditor({ regionCode });
      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      const listSaisines = () =>
        db.db
          .select({ id: pcaetDemandeAvisTable.id })
          .from(pcaetDemandeAvisTable)
          .where(eq(pcaetDemandeAvisTable.demarcheId, created.id));

      const stockage = vi
        .spyOn(app.get(SupabaseService), 'saveInStorage')
        .mockResolvedValue({ success: false, error: 'UPLOAD_STORAGE_ERROR' });
      onTestFinished(() => stockage.mockRestore());

      await expect(
        caller.demarches.pcaet.transmettrePourAvis({
          collectiviteId: collectivite.id,
          demarcheId: created.id,
        })
      ).rejects.toThrow('EXPORT_GENERATION_ERROR');

      // Rien n'est transmis : ni statut, ni saisine, ni ligne de suivi.
      const apres = await caller.demarches.pcaet.get({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      expect(apres.status).toBe('en_elaboration');
      expect(apres.transmittedAt).toBeNull();
      expect(await listSaisines()).toEqual([]);
      expect(await listTestDemarchePcaetExports(db, created.id)).toEqual([]);

      // Le stockage revenu, la collectivité réessaie et la transmission passe.
      stockage.mockRestore();
      const transmise = await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      expect(transmise.status).toBe('transmis_pour_avis');
      expect((await listSaisines()).length).toBeGreaterThan(0);
      expect(
        (await listTestDemarchePcaetExports(db, created.id)).map(
          ({ type }) => type
        )
      ).toEqual(['plan', 'indicateurs']);
    });

    // Prépare un dossier transmissible et espionne les envois au stockage.
    const prepareTransmission = async () => {
      const { caller, collectivite } = await freshEditor();
      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      const supabase = app.get(SupabaseService);
      const saveInStorageSpy = vi.spyOn(supabase, 'saveInStorage');
      onTestFinished(() => saveInStorageSpy.mockRestore());
      const isStored = async (path: string) =>
        (
          await supabase.client.storage
            .from(DEMARCHE_PCAET_EXPORTS_BUCKET)
            .download(path)
        ).data !== null;
      const transmettre = () =>
        caller.demarches.pcaet.transmettrePourAvis({
          collectiviteId: collectivite.id,
          demarcheId: created.id,
        });
      const writtenPaths = () =>
        saveInStorageSpy.mock.calls.map(([{ path }]) => path);
      return { created, transmettre, writtenPaths, isStored };
    };

    test('retire les classeurs écrits quand la transmission est annulée après coup', async () => {
      const { created, transmettre, writtenPaths, isStored } =
        await prepareTransmission();
      // Les classeurs sont écrits, puis l'enregistrement du statut échoue : la
      // transaction est annulée, rien ne désigne plus ces objets.
      const persistSpy = vi
        .spyOn(app.get(DemarchePcaetTransitionRepository), 'persistTransition')
        .mockResolvedValue(failure('DATABASE_ERROR'));
      onTestFinished(() => persistSpy.mockRestore());

      await expect(transmettre()).rejects.toThrow();

      expect(writtenPaths()).toHaveLength(2);
      for (const path of writtenPaths()) {
        expect(await isStored(path)).toBe(false);
      }
      expect(await listTestDemarchePcaetExports(db, created.id)).toEqual([]);
    });

    test("retire les classeurs écrits quand l'enregistrement de leurs lignes échoue", async () => {
      const { created, transmettre, writtenPaths, isStored } =
        await prepareTransmission();
      const replaceSpy = vi
        .spyOn(app.get(DemarchePcaetExportRepository), 'replaceForTransition')
        .mockRejectedValue(new Error('insertion impossible'));
      onTestFinished(() => replaceSpy.mockRestore());

      await expect(transmettre()).rejects.toThrow('EXPORT_GENERATION_ERROR');

      expect(writtenPaths()).toHaveLength(2);
      // Retrait en arrière-plan : la transaction ne l'attend pas.
      await vi.waitFor(async () => {
        for (const path of writtenPaths()) {
          expect(await isStored(path)).toBe(false);
        }
      });
      expect(await listTestDemarchePcaetExports(db, created.id)).toEqual([]);
    });
  });

  describe('Saisine des instructeurs à la transmission', () => {
    /**
     * Un instructeur de test, dans le périmètre géographique voulu.
     *
     * Nettoyé en fin de test : une DREAL est unique par région, donc laisser la
     * ligne derrière soi rendrait le test infaisable au second passage.
     */
    const addInstructeur = async (
      collectivite: Partial<Collectivite> & { type: CollectiviteType }
    ) => {
      const { collectivite: creee, cleanup } = await addTestCollectivite(db, {
        nom: `${collectivite.type} test saisine`,
        ...collectivite,
      });
      onTestFinished(async () => {
        await db.db
          .delete(pcaetDemandeAvisTable)
          .where(eq(pcaetDemandeAvisTable.instructeurCollectiviteId, creee.id));
        await cleanup();
      });
      return creee;
    };

    /**
     * Un territoire couvert en plus du principal. Rien à nettoyer : la ligne
     * cascade avec la collectivité.
     */
    const addPerimetreSecondaire = async (
      collectiviteId: number,
      perimetre: { regionCode: string } | { departementCode: string }
    ) => {
      await db.db.insert(collectivitePerimetreSecondaireTable).values({
        collectiviteId,
        source: 'import_service_etat',
        ...perimetre,
      });
    };

    const listDestinataires = async (demarcheId: number) =>
      db.db
        .select({
          instructeurCollectiviteId:
            pcaetDemandeAvisTable.instructeurCollectiviteId,
          source: pcaetDemandeAvisTable.source,
          perimetre: pcaetDemandeAvisTable.perimetre,
        })
        .from(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));

    // Des codes géographiques qu'aucun instructeur du seed n'occupe, et un par
    // test : la DREAL est unique par région, deux tests ne peuvent pas se
    // partager la même.
    test('atteint les instances régionales par la région, la DDT par le département, un service national partout', async () => {
      const region = '99';
      const departement = '99';
      const { caller, collectivite } = await freshEditor({
        regionCode: region,
        departementCode: departement,
      });

      const dreal = await addInstructeur({ type: 'dreal', regionCode: region });
      const conseilRegional = await addInstructeur({
        type: 'region',
        regionCode: region,
      });
      const ddt = await addInstructeur({
        type: 'ddt',
        regionCode: region,
        departementCode: departement,
      });
      const drAdeme = await addInstructeur({
        type: 'dr_ademe',
        regionCode: region,
      });
      const national = await addInstructeur({ type: 'service_national' });
      // Hors périmètre : ni la région ni le département.
      const drealAilleurs = await addInstructeur({
        type: 'dreal',
        regionCode: '98',
      });
      const drAdemeAilleurs = await addInstructeur({
        type: 'dr_ademe',
        regionCode: '98',
      });
      const ddtVoisine = await addInstructeur({
        type: 'ddt',
        regionCode: region,
        departementCode: '98',
      });

      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      const destinataires = await listDestinataires(created.id);
      const saisis = destinataires.map((d) => d.instructeurCollectiviteId);

      expect(saisis).toEqual(
        expect.arrayContaining([
          dreal.id,
          conseilRegional.id,
          ddt.id,
          drAdeme.id,
          national.id,
        ])
      );
      expect(saisis).not.toContain(drealAilleurs.id);
      expect(saisis).not.toContain(drAdemeAilleurs.id);
      expect(saisis).not.toContain(ddtVoisine.id);
      // Le seed n'a pas écrit ces lignes : c'est bien la transmission.
      expect(destinataires.every((d) => d.source === 'transmission')).toBe(
        true
      );
    });

    /**
     * Le cas de la DR ADEME Océan Indien : une seule ligne pour deux régions,
     * la seconde portée par un périmètre secondaire. Sans elle, le service ne
     * serait jamais saisi pour la moitié de son territoire.
     */
    test('saisit un service dont un périmètre secondaire couvre la déposante', async () => {
      const regionDeposante = 'S1';
      const { caller, collectivite } = await freshEditor({
        regionCode: regionDeposante,
        departementCode: 'S1',
      });

      // Sa région principale est ailleurs : seul le périmètre secondaire la relie.
      const drAdemeDeuxRegions = await addInstructeur({
        type: 'dr_ademe',
        regionCode: 'S2',
      });
      await addPerimetreSecondaire(drAdemeDeuxRegions.id, {
        regionCode: regionDeposante,
      });
      const drAdemeAilleurs = await addInstructeur({
        type: 'dr_ademe',
        regionCode: 'S3',
      });

      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      const destinataires = await listDestinataires(created.id);
      const saisis = destinataires.map((d) => d.instructeurCollectiviteId);
      expect(saisis).toContain(drAdemeDeuxRegions.id);
      expect(saisis).not.toContain(drAdemeAilleurs.id);

      // Le cas symétrique du précédent, et il ne se qualifie pas pareil : c'est
      // ici le périmètre du *service* qui est secondaire, pas celui de la
      // déposante. Or la déposante n'a qu'un territoire, son siège, et c'est lui
      // qui vaut la saisine — la DR ADEME est donc saisie au titre du principal.
      expect(
        destinataires.find(
          (d) => d.instructeurCollectiviteId === drAdemeDeuxRegions.id
        )?.perimetre
      ).toBe('principal');
    });

    /**
     * Et réciproquement, le cas de Redon Agglomération : un EPCI qui chevauche
     * plusieurs départements relève des instructeurs de chacun, pas seulement de
     * ceux de son siège.
     */
    test('saisit les instructeurs des territoires secondaires de la déposante', async () => {
      const { caller, collectivite } = await freshEditor({
        regionCode: 'S4',
        departementCode: 'S4',
      });
      await addPerimetreSecondaire(collectivite.id, {
        departementCode: 'S5',
      });
      await addPerimetreSecondaire(collectivite.id, { regionCode: 'S5' });

      const ddtDuSiege = await addInstructeur({
        type: 'ddt',
        regionCode: 'S4',
        departementCode: 'S4',
      });
      const ddtDebordee = await addInstructeur({
        type: 'ddt',
        regionCode: 'S5',
        departementCode: 'S5',
      });
      const drealDebordee = await addInstructeur({
        type: 'dreal',
        regionCode: 'S5',
      });
      const ddtAilleurs = await addInstructeur({
        type: 'ddt',
        regionCode: 'S6',
        departementCode: 'S6',
      });

      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      const destinataires = await listDestinataires(created.id);
      const saisis = destinataires.map((d) => d.instructeurCollectiviteId);
      expect(saisis).toEqual(
        expect.arrayContaining([
          ddtDuSiege.id,
          ddtDebordee.id,
          drealDebordee.id,
        ])
      );
      expect(saisis).not.toContain(ddtAilleurs.id);

      // Et chacun sait par quel territoire il a été atteint. C'est ce qui
      // décidera de son droit d'y déposer un avis, et de son poids dans la
      // clôture : le siège se prononce, les autres lisent.
      const perimetreDe = (id: number) =>
        destinataires.find((d) => d.instructeurCollectiviteId === id)
          ?.perimetre;

      expect(perimetreDe(ddtDuSiege.id)).toBe('principal');
      expect(perimetreDe(ddtDebordee.id)).toBe('secondaire');
      expect(perimetreDe(drealDebordee.id)).toBe('secondaire');
    });

    /**
     * Un dossier ne se transmet qu'une fois, mais l'écriture doit rester sûre
     * si elle est rejouée — une transaction reprise après incident ne doit ni
     * dupliquer les destinataires, ni déplacer la date de leur saisine.
     */
    test('saisir deux fois ne duplique pas les destinataires', async () => {
      const region = '97';
      const { caller, collectivite } = await freshEditor({
        regionCode: region,
        departementCode: '97',
      });
      await addInstructeur({ type: 'dreal', regionCode: region });

      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      const apresPremiere = await listDestinataires(created.id);
      expect(apresPremiere).not.toHaveLength(0);

      await app.get(PcaetInstructeursRepository).saisirInstructeurs({
        demarcheId: created.id,
        collectiviteId: collectivite.id,
      });

      expect(await listDestinataires(created.id)).toEqual(apresPremiere);
    });

    /**
     * Le piège que la lecture seule impose : `avisTousRendus` exige de chaque
     * demande ses titres attendus. Compter celle d'un destinataire en lecture —
     * dont aucun avis ne peut émaner — fermerait la clôture pour toujours.
     */
    test("un destinataire en lecture ne pèse pas dans l'achèvement des avis", async () => {
      const region = '96';
      const { caller, collectivite } = await freshEditor({
        regionCode: region,
        departementCode: '96',
      });
      const dreal = await addInstructeur({ type: 'dreal', regionCode: region });
      await addInstructeur({ type: 'region', regionCode: region });
      await addInstructeur({
        type: 'ddt',
        regionCode: region,
        departementCode: '96',
      });
      await addInstructeur({ type: 'dr_ademe', regionCode: region });
      await addInstructeur({ type: 'service_national' });

      const created = await caller.demarches.pcaet.create({
        collectiviteId: collectivite.id,
      });
      await completeTestDossierPcaet(db, {
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });
      await caller.demarches.pcaet.transmettrePourAvis({
        collectiviteId: collectivite.id,
        demarcheId: created.id,
      });

      // Les destinataires en lecture sont bien saisis…
      const destinataires = await listDestinataires(created.id);
      expect(destinataires.map((d) => d.instructeurCollectiviteId)).toContain(
        dreal.id
      );

      // …mais seules les deux saisies pour avis pèsent dans l'achèvement, avec
      // le titre attendu de chacune : le préfet de région pour la DREAL, le
      // président pour la région.
      const achevement = await app
        .get(PcaetAvisRepository)
        .listAchevementDemandes(created.id);
      expect(achevement).toHaveLength(2);
      expect(
        achevement.map(({ titresAttendus }) => [...titresAttendus].sort())
      ).toEqual(
        expect.arrayContaining([['prefet_region'], ['president_region']])
      );
    });
  });
});
