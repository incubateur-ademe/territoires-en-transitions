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

  // Un code propre à cette spec, dans l'espace réservé aux codes figés — une
  // lettre puis un chiffre. Voir `pickFreeRegionCode` pour les trois espaces.
  const REGION = 'U1';

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

  // Un avis validé est un acte rendu : le réécrire changerait son sens ou sa
  // pièce en lui laissant sa date de validation, sans que la collectivité — qui
  // l'a reçu — en sache rien.
  it('refuse de modifier un avis validé', async () => {
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
        sens: 'defavorable',
        fichierRef: 'avis-prefet-v2.pdf',
      })
    ).rejects.toThrow('Un avis validé ne peut plus être modifié');

    // Le refus vaut aussi, et surtout, pour le retrait de la pièce jointe.
    await expect(
      upsert(camille, {
        auTitreDe: 'prefet_region',
        sens: 'favorable',
        fichierRef: null,
      })
    ).rejects.toThrow('Un avis validé ne peut plus être modifié');
  });

  // Le verrou porte sur l'avis, pas sur la demande : l'autre titre attendu reste
  // déposable après validation du premier.
  it('laisse déposer l’autre titre après un premier avis validé', async () => {
    const avis = await upsert(camille, {
      auTitreDe: 'autorite_environnementale',
      sens: 'avec_reserves',
      fichierRef: 'avis-ae.pdf',
    });

    const avisAe = avis.find(
      (a) => a.auTitreDe === 'autorite_environnementale'
    );
    expect(avisAe?.sens).toBe('avec_reserves');
    expect(avisAe?.valideLe).toBeNull();
  });

  /**
   * Les trois titres ne sont pas ouverts à tous : la DREAL répond du préfet de
   * région et de l'autorité environnementale, le conseil régional de son
   * président. Sans ce contrôle, l'une signerait pour l'autre.
   */
  it("refuse un titre dont l'instructeur ne répond pas", async () => {
    await expect(
      upsert(camille, {
        auTitreDe: 'president_region',
        sens: 'favorable',
        fichierRef: null,
      })
    ).rejects.toThrow("Cet instructeur ne rend pas d'avis à ce titre");
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
