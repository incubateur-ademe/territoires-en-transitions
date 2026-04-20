import { PanierCheckoutLine } from '@tet/domain/plans';
import { describe, expect, test } from 'vitest';
import { panierCheckoutLineToFicheAction } from './panier-checkout-line-to-fiche-action';

const baseLine: PanierCheckoutLine = {
  sourceActionImpactId: 42,
  titre: "Mettre en place une régie publique d'eau potable",
  description: 'Description courte',
  descriptionComplementaire: 'Description complémentaire',
  statut: null,
  fourchetteBudgetaireNom: '50k - 200k €',
  thematiqueIds: [1, 2],
  sousThematiqueIds: [10],
  indicateurIds: [100, 101],
  effetAttenduIds: [200],
  mesureIds: ['eci_2.1.1'],
  partenaireNoms: ['ADEME', 'Région'],
  liensExternes: [
    { url: 'https://example.org/rex', titre: "Retour d'expérience" },
    { url: 'https://example.org/ressource', titre: 'Ressource externe' },
  ],
};

const baseCtx = {
  collectiviteId: 1,
  planId: 99,
  partenaireTagsByName: new Map<string, number>([
    ['ADEME', 500],
    ['Région', 501],
  ]),
};

describe('panierCheckoutLineToFicheAction', () => {
  describe('mapping de la fiche (scalaires)', () => {
    test("propage le titre et le collectiviteId du contexte", () => {
      const { fiche } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(fiche.titre).toEqual(
        "Mettre en place une régie publique d'eau potable"
      );
      expect(fiche.collectiviteId).toEqual(1);
    });

    test('concatène description et descriptionComplementaire avec un saut de ligne', () => {
      const { fiche } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(fiche.description).toEqual('Description courte\nDescription complémentaire');
    });

    test('utilise le nom de fourchette budgétaire comme financements', () => {
      const { fiche } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(fiche.financements).toEqual('50k - 200k €');
    });

    test('propage null quand fourchetteBudgetaireNom est null', () => {
      const { fiche } = panierCheckoutLineToFicheAction(
        { ...baseLine, fourchetteBudgetaireNom: null },
        baseCtx
      );
      expect(fiche.financements).toEqual(null);
    });
  });

  describe('mapping du statut', () => {
    test('null devient "À venir"', () => {
      const { fiche } = panierCheckoutLineToFicheAction(
        { ...baseLine, statut: null },
        baseCtx
      );
      expect(fiche.statut).toEqual('À venir');
    });

    test('"en_cours" devient "En cours"', () => {
      const { fiche } = panierCheckoutLineToFicheAction(
        { ...baseLine, statut: 'en_cours' },
        baseCtx
      );
      expect(fiche.statut).toEqual('En cours');
    });

    test('"realise" devient "Réalisé"', () => {
      const { fiche } = panierCheckoutLineToFicheAction(
        { ...baseLine, statut: 'realise' },
        baseCtx
      );
      expect(fiche.statut).toEqual('Réalisé');
    });
  });

  describe('mapping des relations', () => {
    test('rattache la fiche au plan via axes', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.axes).toEqual([{ id: 99 }]);
    });

    test('mappe les thématiques en { id }[]', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.thematiques).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test('mappe les sous-thématiques en { id }[]', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.sousThematiques).toEqual([{ id: 10 }]);
    });

    test('mappe les indicateurs en { id }[]', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.indicateurs).toEqual([{ id: 100 }, { id: 101 }]);
    });

    test('mappe les effets attendus en { id }[]', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.effetsAttendus).toEqual([{ id: 200 }]);
    });

    test('mappe les mesures (actions du référentiel) en { id }[]', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.mesures).toEqual([{ id: 'eci_2.1.1' }]);
    });

    test('lie la fiche à son action_impact source via actionsImpact', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.actionsImpact).toEqual([{ id: 42 }]);
    });
  });

  describe('résolution des partenaires', () => {
    test('résout les noms en tag ids via la map fournie', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, baseCtx);
      expect(ficheFields.partenaires).toEqual([{ id: 500 }, { id: 501 }]);
    });

    test('ignore silencieusement les partenaires absents de la map', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(baseLine, {
        ...baseCtx,
        partenaireTagsByName: new Map([['ADEME', 500]]),
      });
      expect(ficheFields.partenaires).toEqual([{ id: 500 }]);
    });

    test('retourne une liste vide quand aucun partenaire', () => {
      const { ficheFields } = panierCheckoutLineToFicheAction(
        { ...baseLine, partenaireNoms: [] },
        baseCtx
      );
      expect(ficheFields.partenaires).toEqual([]);
    });
  });

});
