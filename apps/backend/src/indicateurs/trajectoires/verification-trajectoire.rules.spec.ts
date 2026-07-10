import { VerificationTrajectoireStatus } from '@tet/domain/indicateurs';
import { DataInputForTrajectoireCompute } from './donnees-calcul-trajectoire-a-remplir.dto';
import { VerificationTrajectoireRules } from './verification-trajectoire.rules';

describe('VerificationTrajectoireRules', () => {
  const rules = new VerificationTrajectoireRules();

  const baseDonneesEntree = {
    sources: [],
    emissionsGes: { valeurs: [], colonnes: [], lignes: [] },
    consommationsFinales: { valeurs: [], colonnes: [], lignes: [] },
    sequestrations: { valeurs: [], colonnes: [], lignes: [] },
  } as unknown as DataInputForTrajectoireCompute;

  describe('getStatus', () => {
    it('retourne DONNEES_MANQUANTES si canTrajectoireBeComputed est false', () => {
      const result = rules.getStatus({
        canTrajectoireBeComputed: false,
        donneesEntree: { ...baseDonneesEntree, lastModifiedAt: '2026-07-01T00:00:00.000Z' },
        existingTrajectoireData: { modifiedAt: '2026-06-01T00:00:00.000Z' },
      });
      expect(result).toBe(VerificationTrajectoireStatus.DONNEES_MANQUANTES);
    });

    it('retourne PRET_A_CALCULER si aucune trajectoire existante', () => {
      const result = rules.getStatus({
        canTrajectoireBeComputed: true,
        donneesEntree: { ...baseDonneesEntree, lastModifiedAt: '2026-07-01T00:00:00.000Z' },
        existingTrajectoireData: { modifiedAt: undefined },
      });
      expect(result).toBe(VerificationTrajectoireStatus.PRET_A_CALCULER);
    });

    it('retourne DEJA_CALCULE si lastModifiedAt des données entrée est null', () => {
      const result = rules.getStatus({
        canTrajectoireBeComputed: true,
        donneesEntree: { ...baseDonneesEntree, lastModifiedAt: null },
        existingTrajectoireData: { modifiedAt: '2026-07-01T00:00:00.000Z' },
      });
      expect(result).toBe(VerificationTrajectoireStatus.DEJA_CALCULE);
    });

    it('retourne DEJA_CALCULE si les données entrée ont la même date que la trajectoire existante', () => {
      // Régression : l'ancienne comparaison isEqual(!==) retournait MISE_A_JOUR_DISPONIBLE même pour des dates égales
      const sameDate = '2026-07-02T01:00:00.000Z';
      const result = rules.getStatus({
        canTrajectoireBeComputed: true,
        donneesEntree: { ...baseDonneesEntree, lastModifiedAt: sameDate },
        existingTrajectoireData: { modifiedAt: sameDate },
      });
      expect(result).toBe(VerificationTrajectoireStatus.DEJA_CALCULE);
    });

    it('retourne DEJA_CALCULE si les données entrée sont plus anciennes que la trajectoire existante', () => {
      const result = rules.getStatus({
        canTrajectoireBeComputed: true,
        donneesEntree: { ...baseDonneesEntree, lastModifiedAt: '2026-06-01T00:00:00.000Z' },
        existingTrajectoireData: { modifiedAt: '2026-07-02T01:00:00.000Z' },
      });
      expect(result).toBe(VerificationTrajectoireStatus.DEJA_CALCULE);
    });

    it('retourne MISE_A_JOUR_DISPONIBLE si les données entrée sont plus récentes que la trajectoire existante', () => {
      const result = rules.getStatus({
        canTrajectoireBeComputed: true,
        donneesEntree: { ...baseDonneesEntree, lastModifiedAt: '2026-07-03T00:00:00.000Z' },
        existingTrajectoireData: { modifiedAt: '2026-07-02T01:00:00.000Z' },
      });
      expect(result).toBe(VerificationTrajectoireStatus.MISE_A_JOUR_DISPONIBLE);
    });
  });
});
