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
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { inArray } from 'drizzle-orm';
import { pickFreeRegionCode } from '../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('getContexteInstruction', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;

  /** Agent de la DREAL saisie sur le dossier de la déposante. */
  let camille: AuthenticatedUser;
  /** Agent de la déposante : membre de sa collectivité, jamais instructeur. */
  let marie: AuthenticatedUser;
  /** Agent d'une DREAL d'une autre région, membre d'aucun service concerné. */
  let nicolas: AuthenticatedUser;

  let drealId: number;
  let deposanteId: number;
  let autreDeposanteId: number;
  let demandeAvisId: number;
  let demandeAvisAutreCollectiviteId: number;

  // Un index unique interdit deux DREAL sur la même région : les codes sont
  // choisis parmi ceux que la base n'utilise pas, ce qui rend la suite
  // rejouable.
  let REGION: string;
  let AUTRE_REGION: string;

  const appeler = (
    user: AuthenticatedUser,
    input: { collectiviteId: number; demandeAvisId?: number; demarcheId?: number }
  ) =>
    router.createCaller({ user }).demarches.pcaet.getContexteInstruction(input);

  const demarcheIds: number[] = [];
  const demandeIds: number[] = [];

  const createDossierTransmis = async (collectiviteId: number) => {
    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId,
        type: 'pcaet',
        titre: 'PCAET test contexte instruction',
        status: 'transmis_pour_avis',
        transmittedAt: new Date().toISOString(),
      })
      .returning({ id: demarcheTable.id });
    demarcheIds.push(demarche.id);

    const [demande] = await db.db
      .insert(pcaetDemandeAvisTable)
      .values({
        demarcheId: demarche.id,
        instructeurCollectiviteId: drealId,
        source: 'seed',
      })
      .returning({ id: pcaetDemandeAvisTable.id });
    demandeIds.push(demande.id);

    return demande.id;
  };

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    REGION = await pickFreeRegionCode(db, 'dreal');
    AUTRE_REGION = await pickFreeRegionCode(db, 'dreal');
    while (AUTRE_REGION === REGION) {
      AUTRE_REGION = await pickFreeRegionCode(db, 'dreal');
    }

    const cleanups: Array<() => Promise<void>> = [];

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test contexte',
      },
    });
    cleanups.push(dreal.cleanup);
    camille = getAuthUserFromUserCredentials(dreal.user);
    drealId = dreal.collectivite.id;

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        regionCode: REGION,
        departementCode: '54',
        nom: 'Deposante test contexte',
      },
    });
    cleanups.push(deposante.cleanup);
    marie = getAuthUserFromUserCredentials(deposante.user);
    deposanteId = deposante.collectivite.id;

    const autreDeposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        regionCode: REGION,
        departementCode: '55',
        nom: 'Autre deposante test contexte',
      },
    });
    cleanups.push(autreDeposante.cleanup);
    autreDeposanteId = autreDeposante.collectivite.id;

    const autreDreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: AUTRE_REGION,
        nom: 'DREAL test contexte autre region',
      },
    });
    cleanups.push(autreDreal.cleanup);
    nicolas = getAuthUserFromUserCredentials(autreDreal.user);

    demandeAvisId = await createDossierTransmis(deposanteId);
    demandeAvisAutreCollectiviteId = await createDossierTransmis(
      autreDeposanteId
    );

    return async () => {
      // Les collectivités instructrices sont uniques par région : les laisser
      // derrière soi rétrécit à chaque exécution l'espace où `pickFreeRegionCode`
      // peut tomber. Les dossiers partent d'abord, ils les référencent.
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(inArray(pcaetDemandeAvisTable.id, demandeIds));
      await db.db
        .delete(demarcheTable)
        .where(inArray(demarcheTable.id, demarcheIds));
      for (const cleanup of cleanups.reverse()) {
        await cleanup();
      }
      await app.close();
    };
  });

  test("rend la saisine et le service au nom duquel l'agent consulte", async () => {
    const contexte = await appeler(camille, { collectiviteId: deposanteId });

    expect(contexte).toEqual({
      demandeAvisId,
      demarcheId: demarcheIds[0],
      instructeur: {
        collectiviteId: drealId,
        nom: 'DREAL test contexte',
        type: collectiviteTypeEnum.DREAL,
      },
      // La fixture n'insère aucun périmètre secondaire : la DREAL est saisie
      // au titre du siège de la déposante, et se prononce donc sur ce dossier.
      perimetre: 'principal',
    });
  });

  test("ne rend rien à un membre de la collectivité elle-même — il n'y est pas en instructeur", async () => {
    await expect(
      appeler(marie, { collectiviteId: deposanteId })
    ).resolves.toBeNull();
  });

  test("ne rend rien à l'agent d'un service qui ne couvre pas la collectivité", async () => {
    await expect(
      appeler(nicolas, { collectiviteId: deposanteId })
    ).resolves.toBeNull();
  });

  test('confirme une saisine explicitement visée', async () => {
    const contexte = await appeler(camille, {
      collectiviteId: deposanteId,
      demandeAvisId,
    });

    expect(contexte?.demandeAvisId).toBe(demandeAvisId);
  });

  test('refuse une saisine qui porte sur une autre collectivité', async () => {
    // Le cas de l'URL forgée : la saisine est bien celle de l'agent, mais elle
    // n'a rien à voir avec la collectivité dont l'écran afficherait le nom.
    await expect(
      appeler(camille, {
        collectiviteId: deposanteId,
        demandeAvisId: demandeAvisAutreCollectiviteId,
      })
    ).resolves.toBeNull();
  });

  test('rend null pour une collectivité sans aucune démarche', async () => {
    // La DREAL elle-même : elle instruit, elle ne dépose pas.
    await expect(
      appeler(camille, { collectiviteId: drealId })
    ).resolves.toBeNull();
  });

  /**
   * Un dépôt en élaboration n'a saisi personne : c'est le périmètre du service
   * qui ouvre le contexte, et la saisine y est nulle. Le dossier s'adresse alors
   * par sa démarche.
   */
  describe('quand une collectivité a un dépôt en élaboration', () => {
    let enElaborationId: number;
    let demarcheEnElaborationId: number;
    let cleanupEnElaboration: () => Promise<void>;

    beforeAll(async () => {
      const enElaboration = await addTestCollectiviteAndUser(db, {
        user: { role: CollectiviteRole.ADMIN },
        collectivite: {
          regionCode: REGION,
          departementCode: '54',
          nom: 'Deposante test contexte elaboration',
        },
      });
      cleanupEnElaboration = enElaboration.cleanup;
      enElaborationId = enElaboration.collectivite.id;

      const [demarche] = await db.db
        .insert(demarcheTable)
        .values({
          collectiviteId: enElaborationId,
          type: 'pcaet',
          titre: 'PCAET en elaboration',
          status: 'en_elaboration',
        })
        .returning({ id: demarcheTable.id });
      demarcheEnElaborationId = demarche.id;

      return async () => {
        await db.db
          .delete(demarcheTable)
          .where(inArray(demarcheTable.id, [demarcheEnElaborationId]));
        await cleanupEnElaboration();
      };
    });

    test("rend la démarche, sans saisine, au service qui couvre la collectivité", async () => {
      const contexte = await appeler(camille, {
        collectiviteId: enElaborationId,
      });

      expect(contexte).toEqual({
        demandeAvisId: null,
        demarcheId: demarcheEnElaborationId,
        instructeur: {
          collectiviteId: drealId,
          nom: 'DREAL test contexte',
          type: collectiviteTypeEnum.DREAL,
        },
        perimetre: 'principal',
      });
    });

    test('confirme une démarche explicitement visée', async () => {
      const contexte = await appeler(camille, {
        collectiviteId: enElaborationId,
        demarcheId: demarcheEnElaborationId,
      });

      expect(contexte?.demarcheId).toBe(demarcheEnElaborationId);
    });

    test('refuse une démarche qui porte sur une autre collectivité', async () => {
      await expect(
        appeler(camille, {
          collectiviteId: deposanteId,
          demarcheId: demarcheEnElaborationId,
        })
      ).resolves.toBeNull();
    });

    test("ne rend rien à l'agent d'un service qui ne couvre pas la collectivité", async () => {
      await expect(
        appeler(nicolas, { collectiviteId: enElaborationId })
      ).resolves.toBeNull();
    });

    test("ne rend rien à un membre de la collectivité elle-même", async () => {
      await expect(
        appeler(marie, { collectiviteId: enElaborationId })
      ).resolves.toBeNull();
    });
  });

  describe('quand une collectivité a plusieurs dossiers transmis', () => {
    let ancienneDemandeAvisId: number;

    beforeAll(async () => {
      // Transmis avant celui du `beforeAll` principal, donc jamais le contexte
      // par défaut : c'est ce qui rend le cas intéressant.
      const [demarche] = await db.db
        .insert(demarcheTable)
        .values({
          collectiviteId: deposanteId,
          type: 'pcaet',
          titre: 'PCAET precedent',
          status: 'archive',
          transmittedAt: new Date('2020-01-01').toISOString(),
        })
        .returning({ id: demarcheTable.id });
      demarcheIds.push(demarche.id);

      const [demande] = await db.db
        .insert(pcaetDemandeAvisTable)
        .values({
          demarcheId: demarche.id,
          instructeurCollectiviteId: drealId,
          source: 'seed',
        })
        .returning({ id: pcaetDemandeAvisTable.id });
      demandeIds.push(demande.id);
      ancienneDemandeAvisId = demande.id;
    });

    test('rend la plus récente quand aucune saisine n’est visée', async () => {
      const contexte = await appeler(camille, { collectiviteId: deposanteId });

      expect(contexte?.demandeAvisId).toBe(demandeAvisId);
    });

    test('rend celle qui est visée, même plus ancienne', async () => {
      // Ce que la bannière et la garde du dossier doivent lire de concert : sans
      // cela, ouvrir l'ancien dossier afficherait le contexte du récent.
      const contexte = await appeler(camille, {
        collectiviteId: deposanteId,
        demandeAvisId: ancienneDemandeAvisId,
      });

      expect(contexte?.demandeAvisId).toBe(ancienneDemandeAvisId);
    });
  });
});
