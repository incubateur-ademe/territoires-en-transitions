import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import { makeConsumedInvitationsLanding } from './consume-pending-invitations.landing';

describe('makeConsumedInvitationsLanding', () => {
  it('ne donne aucune destination sans invitation reprise', () => {
    expect(makeConsumedInvitationsLanding([])).toBeNull();
  });

  it('mène un service déconcentré à ses demandes d’avis', () => {
    expect(
      makeConsumedInvitationsLanding([
        { collectiviteId: 12, collectiviteType: collectiviteTypeEnum.DDT },
      ])
    ).toBe('/collectivite/12/demandes-avis');
  });

  it('mène une collectivité au tableau de bord de la première reprise', () => {
    expect(
      makeConsumedInvitationsLanding([
        { collectiviteId: 7, collectiviteType: collectiviteTypeEnum.COMMUNE },
        { collectiviteId: 8, collectiviteType: collectiviteTypeEnum.DDT },
      ])
    ).toBe('/collectivite/7/tableau-de-bord');
  });
});
