import { isMoreRecentIndicateurSourceValeur } from './indicateur-source-valeur-recency.rules';

describe('isMoreRecentIndicateurSourceValeur', () => {
  test('priorise la version de jeu de données la plus récente', () => {
    expect(
      isMoreRecentIndicateurSourceValeur(
        { dateVersion: '2026-02-01', metadonneeId: 1 },
        { dateVersion: '2026-01-01', metadonneeId: 100 }
      )
    ).toBe(true);
  });

  test("utilise l'identifiant de métadonnée pour départager une même version", () => {
    expect(
      isMoreRecentIndicateurSourceValeur(
        { dateVersion: '2026-01-01', metadonneeId: 2 },
        { dateVersion: '2026-01-01', metadonneeId: 1 }
      )
    ).toBe(true);
  });

  test('considère les valeurs absentes comme les plus anciennes', () => {
    expect(
      isMoreRecentIndicateurSourceValeur(
        { dateVersion: null, metadonneeId: null },
        { dateVersion: '2026-01-01', metadonneeId: 1 }
      )
    ).toBe(false);
    expect(
      isMoreRecentIndicateurSourceValeur(
        { dateVersion: undefined, metadonneeId: 2 },
        { dateVersion: undefined, metadonneeId: 1 }
      )
    ).toBe(true);
  });
});
