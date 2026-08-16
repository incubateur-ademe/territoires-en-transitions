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
import { PcaetAvisAuTitreDe, PcaetAvisSens } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

describe('upsertAvis', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let router: Awaited<ReturnType<typeof getTestRouter>>;
  let camille: AuthenticatedUser;
  let marie: AuthenticatedUser;
  let drealCollectiviteId: number;
  let demarcheId: number;
  let demandeAvisId: number;

  const REGION = '84';

  beforeAll(async () => {
    app = await getTestApp();
    db = await getTestDatabase(app);
    router = await getTestRouter(app);

    const deposante = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: REGION, nom: 'Agglo test upsert avis' },
    });
    marie = getAuthUserFromUserCredentials(deposante.user);

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: 'dreal',
        regionCode: REGION,
        nom: 'DREAL test upsert avis',
      },
    });
    camille = getAuthUserFromUserCredentials(dreal.user);
    drealCollectiviteId = dreal.collectivite.id;

    const [demarche] = await db.db
      .insert(demarcheTable)
      .values({
        collectiviteId: deposante.collectivite.id,
        type: 'pcaet',
        titre: 'PCAET test upsert avis',
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

  const upsert = (
    user: AuthenticatedUser,
    input: {
      auTitreDe: PcaetAvisAuTitreDe;
      sens: PcaetAvisSens;
      fichierRef: string | null;
    }
  ) =>
    router.createCaller({ user }).demarches.pcaet.upsertAvis({
      demandeAvisId,
      ...input,
    });

  it('dépose un brouillon sans pièce jointe', async () => {
    const avis = await upsert(camille, {
      auTitreDe: 'prefet_region',
      sens: 'favorable',
      fichierRef: null,
    });

    expect(avis).toHaveLength(1);
    expect(avis[0]).toMatchObject({
      demandeAvisId,
      auTitreDe: 'prefet_region',
      sens: 'favorable',
      fichierRef: null,
      valideLe: null,
      deposePar: camille.id,
      modifieLe: null,
    });

    const [row] = await db.db
      .select({ emetteurCollectiviteId: pcaetAvisTable.emetteurCollectiviteId })
      .from(pcaetAvisTable)
      .where(eq(pcaetAvisTable.id, avis[0].id));
    expect(row.emetteurCollectiviteId).toBe(drealCollectiviteId);
  });

  it("modifie l'avis du même titre sans créer de doublon", async () => {
    const avis = await upsert(camille, {
      auTitreDe: 'prefet_region',
      sens: 'avec_reserves',
      fichierRef: 'avis-prefet.pdf',
    });

    expect(avis).toHaveLength(1);
    expect(avis[0].sens).toBe('avec_reserves');
    expect(avis[0].fichierRef).toBe('avis-prefet.pdf');
    expect(avis[0].deposePar).toBe(camille.id);
    expect(avis[0].modifieLe).not.toBeNull();
  });

  it('accepte un avis par titre, la même pièce jointe pouvant être partagée', async () => {
    const avis = await upsert(camille, {
      auTitreDe: 'autorite_environnementale',
      sens: 'favorable',
      fichierRef: 'avis-prefet.pdf',
    });

    expect(avis).toHaveLength(2);
    expect(avis.map((a) => a.auTitreDe)).toEqual([
      'prefet_region',
      'autorite_environnementale',
    ]);
    expect(avis.map((a) => a.fichierRef)).toEqual([
      'avis-prefet.pdf',
      'avis-prefet.pdf',
    ]);
  });

  it("refuse de retirer la pièce jointe d'un avis validé", async () => {
    await db.db
      .update(pcaetAvisTable)
      .set({ valideLe: new Date().toISOString() })
      .where(
        and(
          eq(pcaetAvisTable.demandeAvisId, demandeAvisId),
          eq(pcaetAvisTable.auTitreDe, 'prefet_region')
        )
      );

    await expect(
      upsert(camille, {
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: null,
      })
    ).rejects.toThrow('Un avis validé doit conserver sa pièce jointe');
  });

  it("modifie un avis validé tant que la fenêtre d'avis est ouverte", async () => {
    const avis = await upsert(camille, {
      auTitreDe: 'prefet_region',
      sens: 'defavorable',
      fichierRef: 'avis-prefet-v2.pdf',
    });

    const avisPrefet = avis.find((a) => a.auTitreDe === 'prefet_region');
    expect(avisPrefet?.sens).toBe('defavorable');
    expect(avisPrefet?.fichierRef).toBe('avis-prefet-v2.pdf');
    expect(avisPrefet?.valideLe).not.toBeNull();
  });

  it("refuse l'agente de la collectivité déposante", async () => {
    await expect(
      upsert(marie, {
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: null,
      })
    ).rejects.toThrow();
  });

  it("refuse quand la fenêtre d'avis est fermée", async () => {
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      })
      .where(eq(demarcheTable.id, demarcheId));

    await expect(
      upsert(camille, {
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: 'avis-prefet-v3.pdf',
      })
    ).rejects.toThrow();
  });
});
