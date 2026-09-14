import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// `vi.mock` est remonté en tête du module : les doublures doivent l'être aussi.
const { getCollectivite, notFound } = vi.hoisted(() => ({
  getCollectivite: vi.fn(),
  // `notFound()` interrompt le rendu en levant : la doublure doit en faire
  // autant, sinon le layout poursuivrait et rendrait les enfants d'un service.
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@tet/api/collectivites/index.server', () => ({ getCollectivite }));
vi.mock('next/navigation', () => ({ notFound }));

import StandardOnlyLayout from './standard-only.layout';

const rendre = (collectiviteType: string) => {
  getCollectivite.mockResolvedValue({ collectiviteType });
  return StandardOnlyLayout({
    children: 'contenu',
    params: Promise.resolve({ collectiviteId: '42' }),
  });
};

describe('StandardOnlyLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Un 404 et non un refus d'accès : ces espaces n'existent pas pour un service
   * de l'État, ce n'est donc pas une question de droits. « Vous n'avez pas les
   * permissions » laisserait croire à une page qu'un autre compte pourrait voir.
   */
  test.each([
    collectiviteTypeEnum.DREAL,
    collectiviteTypeEnum.DDT,
    collectiviteTypeEnum.DR_ADEME,
    collectiviteTypeEnum.SERVICE_NATIONAL,
  ])('rend un 404 pour une collectivité de type %s', async (type) => {
    await expect(rendre(type)).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  test('laisse passer une collectivité ordinaire', async () => {
    await expect(rendre(collectiviteTypeEnum.EPCI)).resolves.toBe('contenu');
    expect(notFound).not.toHaveBeenCalled();
  });

  /**
   * Le conseil régional instruit les dossiers de sa région sans cesser d'être
   * une collectivité de plein exercice : lui fermer ces routes lui ferait perdre
   * ses plans et ses référentiels.
   */
  test('laisse passer un conseil régional, instructeur mais collectivité', async () => {
    await expect(rendre(collectiviteTypeEnum.REGION)).resolves.toBe('contenu');
    expect(notFound).not.toHaveBeenCalled();
  });
});
