import { INestApplication } from '@nestjs/common';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectivitePerimetreSecondaireTable } from '@tet/backend/collectivites/shared/models/collectivite-perimetre-secondaire.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { DGEC_SIREN } from '@tet/domain/demarches';
import { CollectiviteRole, Dcp } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { pickFreeRegionCode } from '../demarches-pcaet.test-fixture';

const ADEME_NATIONALE_SIREN = '385290309';

type TestUser = Dcp & { password: string };

describe('Référents PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  const cleanups: (() => Promise<void>)[] = [];

  let dgecId: number;
  let regionCode: string;
  let drealId: number;
  let crId: number;
  let ddtSiegeId: number;
  let ddtVoisineId: number;
  let drealMembre: TestUser;
  let ddtMembre: TestUser;
  let deposanteId: number;

  type Caller = ReturnType<TrpcRouter['createCaller']>;
  let dgecEditeur: Caller;
  let dgecLecteur: Caller;
  let ademeNationale: Caller;
  let drealAgent: Caller;
  let deposanteLecteur: Caller;

  const callerFor = (user: TestUser) =>
    router.createCaller({ user: getAuthUserFromUserCredentials(user) });

  const membreDe = async (collectiviteId: number, role: CollectiviteRole) => {
    const { user, cleanup } = await addTestUser(db, { collectiviteId, role });
    cleanups.push(cleanup);
    return user;
  };

  const serviceNational = async (siren: string) => {
    const [row] = await db.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable)
      .where(
        and(
          eq(collectiviteTable.type, collectiviteTypeEnum.SERVICE_NATIONAL),
          eq(collectiviteTable.siren, siren)
        )
      )
      .limit(1);
    if (!row) {
      throw new Error(`Service national ${siren} absent du seed`);
    }
    return row.id;
  };

  const organisme = async (
    type: (typeof collectiviteTypeEnum)[keyof typeof collectiviteTypeEnum],
    nom: string,
    departementCode?: string
  ) => {
    const { collectivite, cleanup } = await addTestCollectivite(db, {
      type,
      nom,
      regionCode,
      departementCode: departementCode ?? null,
    });
    cleanups.push(cleanup);
    return collectivite.id;
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = await app.get(TrpcRouter);
    db = await getTestDatabase(app);

    dgecId = await serviceNational(DGEC_SIREN);
    dgecEditeur = callerFor(await membreDe(dgecId, CollectiviteRole.EDITION));
    dgecLecteur = callerFor(await membreDe(dgecId, CollectiviteRole.LECTURE));
    ademeNationale = callerFor(
      await membreDe(
        await serviceNational(ADEME_NATIONALE_SIREN),
        CollectiviteRole.ADMIN
      )
    );

    regionCode = await pickFreeRegionCode(db, collectiviteTypeEnum.DREAL);
    drealId = await organisme(
      collectiviteTypeEnum.DREAL,
      'DREAL test référents'
    );
    crId = await organisme(
      collectiviteTypeEnum.REGION,
      'Région test référents'
    );
    ddtSiegeId = await organisme(
      collectiviteTypeEnum.DDT,
      'DDT test référents siège',
      `${regionCode}A`
    );
    ddtVoisineId = await organisme(
      collectiviteTypeEnum.DDT,
      'DDT test référents voisine',
      `${regionCode}B`
    );

    drealMembre = await membreDe(drealId, CollectiviteRole.EDITION);
    drealAgent = callerFor(drealMembre);
    ddtMembre = await membreDe(ddtSiegeId, CollectiviteRole.LECTURE);

    // Une déposante du département siège, qui déborde sur le voisin.
    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.LECTURE },
      collectivite: {
        type: collectiviteTypeEnum.EPCI,
        nom: 'EPCI test référents',
        regionCode,
        departementCode: `${regionCode}A`,
      },
    });
    cleanups.push(deposante.cleanup);
    deposanteId = deposante.collectivite.id;
    deposanteLecteur = callerFor(deposante.user);
    await db.db.insert(collectivitePerimetreSecondaireTable).values({
      collectiviteId: deposanteId,
      source: 'import_service_etat',
      departementCode: `${regionCode}B`,
    });

    return async () => {
      for (const cleanup of cleanups.reverse()) {
        await cleanup();
      }
      await app.close();
    };
  });

  describe('accès', () => {
    it('la DGEC en édition gère, en lecture consulte seulement', async () => {
      expect(
        await dgecEditeur.demarches.pcaet.referents.getAccess({
          collectiviteId: dgecId,
        })
      ).toEqual({ canRead: true, canMutate: true });
      expect(
        await dgecLecteur.demarches.pcaet.referents.getAccess({
          collectiviteId: dgecId,
        })
      ).toEqual({ canRead: true, canMutate: false });
    });

    it("l'ADEME nationale, autre service national, n'a aucun accès", async () => {
      const ademeId = await serviceNational(ADEME_NATIONALE_SIREN);
      expect(
        await ademeNationale.demarches.pcaet.referents.getAccess({
          collectiviteId: ademeId,
        })
      ).toEqual({ canRead: false, canMutate: false });
      await expect(
        ademeNationale.demarches.pcaet.referents.listOrganismes({
          collectiviteId: dgecId,
          regionCode,
        })
      ).rejects.toThrow();
    });

    it('une DREAL ne désigne pas ses propres référents', async () => {
      await expect(
        drealAgent.demarches.pcaet.referents.add({
          collectiviteId: dgecId,
          organismeId: drealId,
          userId: drealMembre.id,
        })
      ).rejects.toThrow();
    });

    it('la DGEC en lecture ne peut rien modifier', async () => {
      await expect(
        dgecLecteur.demarches.pcaet.referents.add({
          collectiviteId: dgecId,
          organismeId: crId,
          libelle: 'Boîte PCAET',
          email: 'pcaet@region.test',
        })
      ).rejects.toThrow();
    });
  });

  describe('désignation', () => {
    it('liste la DREAL, le conseil régional puis les DDT de la région', async () => {
      const organismes =
        await dgecLecteur.demarches.pcaet.referents.listOrganismes({
          collectiviteId: dgecId,
          regionCode,
        });
      expect(organismes.map(({ organisme }) => organisme.id)).toEqual([
        drealId,
        crId,
        ddtSiegeId,
        ddtVoisineId,
      ]);
      const dreal = organismes.find(
        ({ organisme }) => organisme.id === drealId
      );
      expect(dreal?.membres.map(({ userId }) => userId)).toEqual([
        drealMembre.id,
      ]);
    });

    it('ajoute un membre et un contact hors plateforme, sans doublon, puis les retire', async () => {
      const referents = dgecEditeur.demarches.pcaet.referents;
      await referents.add({
        collectiviteId: dgecId,
        organismeId: drealId,
        userId: drealMembre.id,
      });
      await referents.add({
        collectiviteId: dgecId,
        organismeId: drealId,
        userId: drealMembre.id,
      });
      await referents.add({
        collectiviteId: dgecId,
        organismeId: drealId,
        libelle: 'Boîte fonctionnelle PCAET',
        email: 'PCAET.Dreal@Test.gouv.fr',
      });

      const [dreal] = await referents.listOrganismes({
        collectiviteId: dgecId,
        regionCode,
      });
      expect(dreal.referents).toEqual([
        expect.objectContaining({
          userId: drealMembre.id,
          nom: `${drealMembre.prenom} ${drealMembre.nom}`,
          email: drealMembre.email,
        }),
        expect.objectContaining({
          userId: null,
          nom: 'Boîte fonctionnelle PCAET',
          email: 'pcaet.dreal@test.gouv.fr',
        }),
      ]);
      expect(dreal.membres).toEqual([]);

      for (const { id } of dreal.referents) {
        await referents.remove({ collectiviteId: dgecId, referentId: id });
      }
      const [apres] = await referents.listOrganismes({
        collectiviteId: dgecId,
        regionCode,
      });
      expect(apres.referents).toEqual([]);
    });

    it("refuse quelqu'un qui n'est pas membre de l'organisme", async () => {
      await expect(
        dgecEditeur.demarches.pcaet.referents.add({
          collectiviteId: dgecId,
          organismeId: crId,
          userId: drealMembre.id,
        })
      ).rejects.toThrow("n'est pas membre");
    });

    it("refuse un organisme qui n'est ni DREAL, ni conseil régional, ni DDT", async () => {
      await expect(
        dgecEditeur.demarches.pcaet.referents.add({
          collectiviteId: dgecId,
          organismeId: deposanteId,
          libelle: 'Contact EPCI',
          email: 'contact@epci.test',
        })
      ).rejects.toThrow('DREAL');
    });
  });

  describe('contacts de la collectivité déposante', () => {
    it('donne les référents des organismes qui la couvrent, siège en premier', async () => {
      const referents = dgecEditeur.demarches.pcaet.referents;
      await referents.add({
        collectiviteId: dgecId,
        organismeId: ddtSiegeId,
        userId: ddtMembre.id,
      });
      await referents.add({
        collectiviteId: dgecId,
        organismeId: ddtVoisineId,
        libelle: 'DDT voisine',
        email: 'ddt-voisine@test.gouv.fr',
      });

      const contacts = await deposanteLecteur.demarches.pcaet.listContacts({
        collectiviteId: deposanteId,
      });

      expect(contacts).toEqual([
        { organisme: expect.objectContaining({ id: drealId }), contacts: [] },
        { organisme: expect.objectContaining({ id: crId }), contacts: [] },
        {
          organisme: expect.objectContaining({ id: ddtSiegeId }),
          contacts: [
            {
              nom: `${ddtMembre.prenom} ${ddtMembre.nom}`,
              email: ddtMembre.email,
            },
          ],
        },
        {
          organisme: expect.objectContaining({ id: ddtVoisineId }),
          contacts: [{ nom: 'DDT voisine', email: 'ddt-voisine@test.gouv.fr' }],
        },
      ]);
    });

    it("ne s'ouvre pas à un compte vérifié qui n'en est pas membre", async () => {
      const { user, cleanup } = await addTestUser(db, { collectiviteId: null });
      cleanups.push(cleanup);

      await expect(
        callerFor(user).demarches.pcaet.listContacts({
          collectiviteId: deposanteId,
        })
      ).rejects.toThrow();
    });

    it("un membre qui quitte l'organisme n'est plus affiché", async () => {
      await db.db
        .update(utilisateurCollectiviteAccessTable)
        .set({ isActive: false })
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, ddtMembre.id),
            eq(utilisateurCollectiviteAccessTable.collectiviteId, ddtSiegeId)
          )
        );

      const contacts = await deposanteLecteur.demarches.pcaet.listContacts({
        collectiviteId: deposanteId,
      });
      const ddtSiege = contacts.find(
        ({ organisme }) => organisme.id === ddtSiegeId
      );
      expect(ddtSiege?.contacts).toEqual([]);
    });
  });
});
