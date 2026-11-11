import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { StatutTrajectoireSnbc3 } from '@tet/domain/indicateurs';
import { failure, success } from '@tet/backend/utils/result.type';
import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Snbc3Collectivite,
  TrajectoireSnbc3Repository,
} from './trajectoire-snbc3.repository';
import { TrajectoireSnbc3Service } from './trajectoire-snbc3.service';

/**
 * Le rattachement des arrondissements dépend des vraies communes de Paris,
 * Lyon et Marseille, déjà présentes dans la seed : on le teste avec un faux
 * repository plutôt qu'en e2e.
 */
describe('TrajectoireSnbc3Service.checkStatus : collectivité de rattachement', () => {
  const user = { id: 'user-id' } as AuthenticatedUser;
  const millesime = { metadonneeId: 42, dateVersion: '2026-10-01T00:00:00Z' };

  const paris = { id: 5587, nom: 'Paris' };
  const lyon = { id: 5482, nom: 'Ville de Lyon' };
  const metropoleDeLyon = { id: 4999, nom: 'Métropole de Lyon' };
  const ccDeLaCommune = { id: 3822, nom: 'CC de la commune' };

  const repository = {
    getCollectivite: vi.fn(),
    getMillesime: vi.fn(),
    hasValeurs: vi.fn(),
    findEpciParent: vi.fn(),
    findCommuneByCode: vi.fn(),
  } satisfies Partial<Record<keyof TrajectoireSnbc3Repository, unknown>>;

  const service = new TrajectoireSnbc3Service(
    repository as never,
    { isTrajectoireSnbc3Enabled: vi.fn().mockResolvedValue(true) } as never,
    { isAllowed: vi.fn().mockResolvedValue({ success: true }) } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never
  );

  const commune = (communeCode: string | null): Snbc3Collectivite => ({
    id: 1,
    nom: 'Commune',
    type: 'commune',
    natureInsee: null,
    regionCode: '11',
    communeCode,
  });

  /** Seules les collectivités listées sont dans le millésime. */
  const withMillesime = (...collectiviteIds: number[]) =>
    repository.hasValeurs.mockImplementation(async (collectiviteId: number) =>
      collectiviteIds.includes(collectiviteId)
    );

  const checkStatus = async (collectivite: Snbc3Collectivite) => {
    repository.getCollectivite.mockResolvedValue(collectivite);
    const result = await service.checkStatus(
      { collectiviteId: collectivite.id },
      { user }
    );
    if (!result.success) {
      throw new Error(`checkStatus a échoué : ${result.error}`);
    }
    expect(result.data.status).toBe(
      StatutTrajectoireSnbc3.COMMUNE_NON_SUPPORTEE
    );
    return result.data;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository.getMillesime.mockResolvedValue(millesime);
    repository.findCommuneByCode.mockImplementation(async (code: string) =>
      ({ '75056': paris, '69123': lyon })[code] ?? null
    );
    repository.findEpciParent.mockImplementation(
      async (collectiviteId: number) =>
        collectiviteId === lyon.id
          ? metropoleDeLyon
          : collectiviteId === 1
            ? ccDeLaCommune
            : null
    );
    withMillesime(paris.id);
  });

  it("propose l'EPCI parent d'une commune ordinaire", async () => {
    const data = await checkStatus(commune('01004'));

    expect(data.collectiviteRattachement).toEqual(ccDeLaCommune);
    expect(repository.findCommuneByCode).not.toHaveBeenCalled();
  });

  it("renvoie un arrondissement de Paris vers Paris, présente dans le millésime", async () => {
    const data = await checkStatus(commune('75101'));

    expect(data.collectiviteRattachement).toEqual(paris);
    expect(repository.findCommuneByCode).toHaveBeenCalledWith('75056');
  });

  it("renvoie un arrondissement de Lyon vers l'EPCI de Lyon, absente du millésime", async () => {
    const data = await checkStatus(commune('69381'));

    expect(data.collectiviteRattachement).toEqual(metropoleDeLyon);
    expect(repository.findEpciParent).toHaveBeenCalledWith(lyon.id);
  });

  it("passe par l'EPCI de la commune quand aucun millésime n'est importé", async () => {
    repository.getMillesime.mockResolvedValue(null);

    const data = await checkStatus(commune('75101'));

    expect(repository.hasValeurs).not.toHaveBeenCalled();
    expect(repository.findEpciParent).toHaveBeenCalledWith(paris.id);
    expect(data).not.toHaveProperty('collectiviteRattachement');
  });

  it("ne propose rien quand la commune de l'arrondissement est introuvable", async () => {
    const data = await checkStatus(commune('13201'));

    expect(data).not.toHaveProperty('collectiviteRattachement');
    expect(repository.findEpciParent).not.toHaveBeenCalled();
  });
});

describe('TrajectoireSnbc3Service.getMethodologie', () => {
  const user = { id: 'user-id' } as AuthenticatedUser;
  const featureFlag = { isTrajectoireSnbc3Enabled: vi.fn() };
  const releaseStorage = { getMethodologie: vi.fn() };

  const service = new TrajectoireSnbc3Service(
    {} as never,
    featureFlag as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    releaseStorage as never
  );

  const getMethodologie = () =>
    service.getMethodologie({ collectiviteId: 1 }, { user });

  beforeEach(() => {
    vi.clearAllMocks();
    featureFlag.isTrajectoireSnbc3Enabled.mockResolvedValue(true);
  });

  it('renvoie le flux et le nom du PDF de la release importée', async () => {
    const methodologie = {
      stream: Readable.from(['%PDF']),
      fileName: 'methodologie-snbc3.pdf',
    };
    releaseStorage.getMethodologie.mockResolvedValue(success(methodologie));

    expect(await getMethodologie()).toEqual(success(methodologie));
  });

  it("signale l'absence de méthodologie avant le premier import qui l'a stockée", async () => {
    releaseStorage.getMethodologie.mockResolvedValue(success(null));

    expect(await getMethodologie()).toEqual(
      failure('METHODOLOGIE_SNBC3_INDISPONIBLE')
    );
  });

  it('renvoie une erreur serveur quand la lecture du PDF échoue', async () => {
    releaseStorage.getMethodologie.mockResolvedValue(
      failure('READ_DOCUMENT_ERROR')
    );

    expect(await getMethodologie()).toEqual(failure('SERVER_ERROR'));
  });

  it('refuse sans le flag, sans lire le bucket', async () => {
    featureFlag.isTrajectoireSnbc3Enabled.mockResolvedValue(false);

    expect(await getMethodologie()).toEqual(
      failure('TRAJECTOIRE_SNBC3_NON_OUVERTE')
    );
    expect(releaseStorage.getMethodologie).not.toHaveBeenCalled();
  });
});
