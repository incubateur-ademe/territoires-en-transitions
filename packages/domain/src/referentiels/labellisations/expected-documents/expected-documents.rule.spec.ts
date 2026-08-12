import { describe, expect, it } from 'vitest';
import { ObjetPreuveEnum } from '../objet-preuve.enum.schema';
import {
  areExpectedDocumentsDeposited,
  getExpectedDocuments,
  selectPreuvesByObjet,
} from './expected-documents.rule';

const LES_DEUX_OBJETS = [
  ObjetPreuveEnum.ACTE_ENGAGEMENT,
  ObjetPreuveEnum.CANDIDATURE,
];

describe('getExpectedDocuments', () => {
  it("attend l'acte d'engagement tant que la première étoile n'est pas obtenue", () => {
    expect(
      getExpectedDocuments({
        isCot: false,
        premiereEtoileObtenue: false,
        etoile: 1,
      })
    ).toEqual([ObjetPreuveEnum.ACTE_ENGAGEMENT]);
  });

  it("n'attend plus l'acte d'engagement une fois la première étoile obtenue", () => {
    expect(
      getExpectedDocuments({
        isCot: false,
        premiereEtoileObtenue: true,
        etoile: 2,
      })
    ).toEqual([ObjetPreuveEnum.CANDIDATURE]);
  });

  it("n'attend pas d'acte d'engagement d'une collectivité COT", () => {
    expect(
      getExpectedDocuments({
        isCot: true,
        premiereEtoileObtenue: false,
        etoile: 1,
      })
    ).toEqual([]);
  });

  it('attend les deux pièces sans étoile obtenue quand la labellisation est déjà visée', () => {
    expect(
      getExpectedDocuments({
        isCot: false,
        premiereEtoileObtenue: false,
        etoile: 3,
      })
    ).toEqual(LES_DEUX_OBJETS);
  });
});

describe('areExpectedDocumentsDeposited', () => {
  const acte = { objet: ObjetPreuveEnum.ACTE_ENGAGEMENT };
  const candidature = { objet: ObjetPreuveEnum.CANDIDATURE };
  const sansObjet = { objet: null };

  it('exige chacune des pièces attendues', () => {
    expect(
      areExpectedDocumentsDeposited({
        preuves: [candidature],
        expectedDocuments: LES_DEUX_OBJETS,
      })
    ).toBe(false);
    expect(
      areExpectedDocumentsDeposited({
        preuves: [acte],
        expectedDocuments: LES_DEUX_OBJETS,
      })
    ).toBe(false);
    expect(
      areExpectedDocumentsDeposited({
        preuves: [acte, candidature],
        expectedDocuments: LES_DEUX_OBJETS,
      })
    ).toBe(true);
  });

  it('une preuve sans objet ne satisfait aucune pièce attendue', () => {
    expect(
      areExpectedDocumentsDeposited({
        preuves: [sansObjet],
        expectedDocuments: LES_DEUX_OBJETS,
      })
    ).toBe(false);
    expect(
      areExpectedDocumentsDeposited({
        preuves: [sansObjet],
        expectedDocuments: [ObjetPreuveEnum.CANDIDATURE],
      })
    ).toBe(false);
  });

  it('une preuve sans objet ne bloque pas quand les pièces attendues sont là', () => {
    expect(
      areExpectedDocumentsDeposited({
        preuves: [sansObjet, candidature],
        expectedDocuments: [ObjetPreuveEnum.CANDIDATURE],
      })
    ).toBe(true);
  });

  it("n'exige rien quand aucune pièce n'est attendue", () => {
    expect(
      areExpectedDocumentsDeposited({ preuves: [], expectedDocuments: [] })
    ).toBe(true);
  });
});

describe('selectPreuvesByObjet', () => {
  const acte = { id: 1, objet: ObjetPreuveEnum.ACTE_ENGAGEMENT };
  const candidature = { id: 2, objet: ObjetPreuveEnum.CANDIDATURE };
  const sansObjet = { id: 3, objet: null };
  const preuves = [acte, candidature, sansObjet];

  it('ne retient que les preuves explicitement typées', () => {
    expect(
      selectPreuvesByObjet({
        preuves,
        objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
      })
    ).toEqual([acte]);
    expect(
      selectPreuvesByObjet({ preuves, objet: ObjetPreuveEnum.CANDIDATURE })
    ).toEqual([candidature]);
  });

  it("n'expose une preuve sans objet dans aucune section", () => {
    const actes = selectPreuvesByObjet({
      preuves,
      objet: ObjetPreuveEnum.ACTE_ENGAGEMENT,
    });
    const candidatures = selectPreuvesByObjet({
      preuves,
      objet: ObjetPreuveEnum.CANDIDATURE,
    });

    expect([...actes, ...candidatures]).not.toContain(sansObjet);
  });
});
