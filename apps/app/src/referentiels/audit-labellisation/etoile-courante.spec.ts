import { ParcoursLabellisation } from '@tet/domain/referentiels';
import { describe, expect, it } from 'vitest';
import { toEtoileCourante } from './etoile-courante';

const toParcours = ({
  status = 'non_demandee',
  etoilesObtenues = null,
  obtenueLe = '2020-01-01T00:00:00.000Z',
  demande = null,
}: {
  status?: ParcoursLabellisation['status'];
  etoilesObtenues?: number | null;
  obtenueLe?: string;
  demande?: Partial<NonNullable<ParcoursLabellisation['demande']>> | null;
}): Pick<ParcoursLabellisation, 'status' | 'demande' | 'labellisation'> => ({
  status,
  labellisation:
    etoilesObtenues === null
      ? null
      : ({
          etoiles: etoilesObtenues,
          obtenueLe,
        } as ParcoursLabellisation['labellisation']),
  demande: demande as ParcoursLabellisation['demande'],
});

describe('toEtoileCourante', () => {
  it('vise la première étoile pour une collectivité sans étoile, même avec un score qui permettrait la quatrième', () => {
    expect(toEtoileCourante(toParcours({}))).toBe(1);
  });

  it("vise la deuxième étoile pour une collectivité qui n'a que la première, qui ne se renouvelle pas", () => {
    expect(toEtoileCourante(toParcours({ etoilesObtenues: 1 }))).toBe(2);
  });

  it("vise l'étoile obtenue pour la renouveler : une collectivité labellisée trois étoiles voit la troisième", () => {
    expect(toEtoileCourante(toParcours({ etoilesObtenues: 3 }))).toBe(3);
  });

  it('vise la cinquième étoile pour une collectivité labellisée cinq étoiles, la plus haute qui se renouvelle', () => {
    expect(toEtoileCourante(toParcours({ etoilesObtenues: 5 }))).toBe(5);
  });

  it("vise une étoile demandée inférieure à l'étoile obtenue, pendant que l'ADEME traite la demande", () => {
    expect(
      toEtoileCourante(
        toParcours({
          status: 'demande_envoyee',
          etoilesObtenues: 4,
          demande: { etoiles: '2', sujet: 'labellisation' },
        })
      )
    ).toBe(2);
  });

  it("vise l'étoile de la demande envoyée, pendant que l'ADEME la traite", () => {
    expect(
      toEtoileCourante(
        toParcours({
          status: 'demande_envoyee',
          etoilesObtenues: 2,
          demande: { etoiles: '4', sujet: 'labellisation' },
        })
      )
    ).toBe(4);
  });

  it("ignore un brouillon de demande tant qu'il n'est pas envoyé", () => {
    expect(
      toEtoileCourante(
        toParcours({
          status: 'non_demandee',
          etoilesObtenues: 3,
          demande: { etoiles: '5', sujet: 'labellisation' },
        })
      )
    ).toBe(3);
  });

  it("revient à l'étoile obtenue une fois la labellisation demandée acquise", () => {
    expect(
      toEtoileCourante(
        toParcours({
          status: 'audit_valide',
          etoilesObtenues: 3,
          demande: {
            etoiles: '3',
            sujet: 'labellisation',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
          },
          obtenueLe: '2026-06-01T00:00:00.000Z',
        })
      )
    ).toBe(3);
  });

  it("garde l'étoile demandée tant que la labellisation n'est pas actée après l'audit", () => {
    expect(
      toEtoileCourante(
        toParcours({
          status: 'audit_valide',
          etoilesObtenues: 2,
          demande: {
            etoiles: '3',
            sujet: 'labellisation',
            envoyeeLe: '2026-01-01T00:00:00.000Z',
          },
          obtenueLe: '2025-06-01T00:00:00.000Z',
        })
      )
    ).toBe(3);
  });

  it("revient à l'étoile obtenue pendant un audit COT seul, qui n'a pas d'étoile", () => {
    expect(
      toEtoileCourante(
        toParcours({
          status: 'audit_en_cours',
          etoilesObtenues: 2,
          demande: { etoiles: null, sujet: 'cot' },
        })
      )
    ).toBe(2);
  });
});
