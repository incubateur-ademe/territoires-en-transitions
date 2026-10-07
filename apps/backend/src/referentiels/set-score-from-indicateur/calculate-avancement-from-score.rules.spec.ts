import { calculateAvancementFromScore } from './calculate-avancement-from-score.rules';

describe('calculateAvancementFromScore', () => {
  it('répartit un score partiel entre la part faite et la part pas faite', () => {
    expect(calculateAvancementFromScore(0.5)).toEqual([0.5, 0, 0.5]);
  });

  it('donne une action entièrement faite pour un score de 1', () => {
    expect(calculateAvancementFromScore(1)).toEqual([1, 0, 0]);
  });

  it('bride un score au-delà du plafond de la formule', () => {
    expect(calculateAvancementFromScore(1.3)).toEqual([1, 0, 0]);
  });

  it('donne une action pas faite pour un score de 0', () => {
    expect(calculateAvancementFromScore(0)).toEqual([0, 0, 1]);
  });

  it('bride un score négatif', () => {
    expect(calculateAvancementFromScore(-0.2)).toEqual([0, 0, 1]);
  });

  it('ne dérive aucun avancement quand le score est absent', () => {
    expect(calculateAvancementFromScore(null)).toBeNull();
    expect(calculateAvancementFromScore(undefined)).toBeNull();
  });

  it('ne dérive aucun avancement quand le score n’est pas un nombre fini', () => {
    expect(calculateAvancementFromScore(NaN)).toBeNull();
    expect(calculateAvancementFromScore(Infinity)).toBeNull();
  });

  it('conserve la pleine précision du score et somme toujours à 1', () => {
    const avancement = calculateAvancementFromScore(0.123456789);

    expect(avancement).toEqual([0.123456789, 0, 0.876543211]);
    expect(avancement?.reduce((total, part) => total + part, 0)).toBe(1);
  });

  it('n’arrondit pas au pas du sélecteur de statut', () => {
    const avancement = calculateAvancementFromScore(0.42);

    expect(avancement?.[0]).toBe(0.42);
    expect(avancement?.[2]).toBeCloseTo(0.58, 10);
  });
});
