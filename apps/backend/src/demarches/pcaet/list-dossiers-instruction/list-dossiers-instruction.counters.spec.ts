import { PcaetStatutInstructionEnum } from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  compterCharge,
  type LigneComptable,
} from './list-dossiers-instruction.counters';

const JOURS = 24 * 60 * 60 * 1000;

const comptable = (
  attributs: Partial<LigneComptable> = {}
): LigneComptable => ({
  statut: PcaetStatutInstructionEnum.EN_INSTRUCTION,
  relveDeSaCharge: true,
  transmittedAt: null,
  dernierAvisValideLe: null,
  ...attributs,
});

/** Une instruction de `jours` jours, transmission et validation comprises. */
const instruiteEn = (jours: number, attributs: Partial<LigneComptable> = {}) =>
  comptable({
    statut: PcaetStatutInstructionEnum.INSTRUIT,
    transmittedAt: new Date(0).toISOString(),
    dernierAvisValideLe: new Date(jours * JOURS).toISOString(),
    ...attributs,
  });

describe('compterCharge', () => {
  it('compte par statut, tous les statuts étant présents', () => {
    const { countByStatut } = compterCharge(
      [
        comptable(),
        comptable(),
        comptable({ statut: PcaetStatutInstructionEnum.INSTRUIT }),
      ],
      { serviceSePrononce: true }
    );

    expect(countByStatut[PcaetStatutInstructionEnum.EN_INSTRUCTION]).toBe(2);
    expect(countByStatut[PcaetStatutInstructionEnum.INSTRUIT]).toBe(1);
    expect(countByStatut[PcaetStatutInstructionEnum.AUCUN_DEPOT]).toBe(0);
  });

  /**
   * Ce qu'une DREAL lit sans avoir la main dessus — le dossier d'un territoire
   * limitrophe, ou un dossier transmis avant qu'elle n'entre dans le dispositif
   * — avance sans elle : le compter lui ferait surestimer son travail.
   */
  it('écarte de la charge les lignes dont le service ne répond pas', () => {
    const { countByStatut } = compterCharge(
      [comptable(), comptable({ relveDeSaCharge: false })],
      { serviceSePrononce: true }
    );

    expect(countByStatut[PcaetStatutInstructionEnum.EN_INSTRUCTION]).toBe(1);
  });

  /** Un service qui ne se prononce jamais suit tout : c'est un suivi, pas une charge. */
  it('compte tout pour un service qui ne dépose aucun avis', () => {
    const { countByStatut } = compterCharge(
      [
        comptable({ relveDeSaCharge: false }),
        comptable({ relveDeSaCharge: false }),
      ],
      { serviceSePrononce: false }
    );

    expect(countByStatut[PcaetStatutInstructionEnum.EN_INSTRUCTION]).toBe(2);
  });

  it('moyenne le délai des instructions abouties', () => {
    const { stats } = compterCharge([instruiteEn(10), instruiteEn(20)], {
      serviceSePrononce: true,
    });

    expect(stats.delaiMoyenJours).toBe(15);
  });

  it('ignore les instructions en cours, qui n’ont pas encore de durée', () => {
    const { stats } = compterCharge([instruiteEn(10), comptable()], {
      serviceSePrononce: true,
    });

    expect(stats.delaiMoyenJours).toBe(10);
  });

  it('ne rend aucun délai quand rien n’a abouti, plutôt qu’un zéro', () => {
    const { stats } = compterCharge([comptable()], { serviceSePrononce: true });

    expect(stats.delaiMoyenJours).toBeNull();
  });

  /** Le même biais que les compteurs : une instruction menée ailleurs n'est pas une performance. */
  it('n’agrège que le délai des dossiers dont le service répond', () => {
    const { stats } = compterCharge(
      [instruiteEn(10), instruiteEn(200, { relveDeSaCharge: false })],
      { serviceSePrononce: true }
    );

    expect(stats.delaiMoyenJours).toBe(10);
  });

  /**
   * Une validation antérieure à la transmission — une reprise de données, une
   * horloge qui recule — ne doit pas rendre une moyenne négative.
   */
  it('plancher à zéro plutôt qu’une durée négative', () => {
    const { stats } = compterCharge([instruiteEn(-5)], {
      serviceSePrononce: true,
    });

    expect(stats.delaiMoyenJours).toBe(0);
  });
});
