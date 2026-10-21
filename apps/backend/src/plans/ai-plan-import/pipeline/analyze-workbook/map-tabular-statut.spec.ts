import { StatutEnum } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import {
  aggregateFicheStatut,
  describeTabularStatutTable,
  isKnownStatutLabel,
  mapProgressValue,
  mapStatutCell,
  mapTabularStatut,
} from './map-tabular-statut';

describe('mapTabularStatut', () => {
  it.each([
    ['Non engagée', StatutEnum.A_VENIR],
    ['En projet', StatutEnum.A_VENIR],
    ['En cours', StatutEnum.EN_COURS],
    ['Terminée', StatutEnum.REALISE],
    ['Annulée', StatutEnum.ABANDONNE],
    ['  NON ENGAGEE ', StatutEnum.A_VENIR],
    ['terminé', StatutEnum.REALISE],
    ['Annulées', StatutEnum.ABANDONNE],
  ])('« %s » donne %s', (value, statut) => {
    expect(mapTabularStatut(value)).toBe(statut);
  });

  it('ne donne aucun statut à une case vide ou inconnue', () => {
    expect(mapTabularStatut('')).toBeNull();
    expect(mapTabularStatut('À voir avec les élus')).toBeNull();
  });

  it.each([
    ['Réalisée', StatutEnum.REALISE],
    ['Bloquée', StatutEnum.BLOQUE],
    ['Encours', StatutEnum.EN_COURS],
    ['A discuter', StatutEnum.A_DISCUTER],
  ])('rapproche « %s » d’un statut de la plateforme', (value, statut) => {
    expect(mapTabularStatut(value)).toBe(statut);
  });

  it.each([
    ['Non démarré', StatutEnum.A_VENIR],
    ['Pas commencé', StatutEnum.A_VENIR],
    ['À faire', StatutEnum.A_VENIR],
    ['Prévu', StatutEnum.A_VENIR],
    ['Programmé', StatutEnum.A_VENIR],
    ['Démarré', StatutEnum.EN_COURS],
    ['Engagé', StatutEnum.EN_COURS],
    ['Lancé', StatutEnum.EN_COURS],
    ['Achevé', StatutEnum.REALISE],
    ['Fait', StatutEnum.REALISE],
    ['Clos', StatutEnum.REALISE],
    ['Finalisé', StatutEnum.REALISE],
    ['Suspendu', StatutEnum.EN_PAUSE],
    ['En attente', StatutEnum.EN_PAUSE],
    ['Reporté', StatutEnum.EN_PAUSE],
  ])('lit « %s », synonyme courant des tableurs de suivi', (value, statut) => {
    expect(mapTabularStatut(value)).toBe(statut);
  });

  it('ne lit pas un taux d’avancement : il faut savoir que la colonne en est une', () => {
    expect(mapTabularStatut('0.5')).toBeNull();
    expect(mapTabularStatut('100 %')).toBeNull();
  });
});

describe('mapProgressValue', () => {
  it.each([
    ['0', StatutEnum.A_VENIR],
    ['0 %', StatutEnum.A_VENIR],
    ['0.5', StatutEnum.EN_COURS],
    ['0,25', StatutEnum.EN_COURS],
    ['40 %', StatutEnum.EN_COURS],
    ['60', StatutEnum.EN_COURS],
    ['1', StatutEnum.REALISE],
    ['100 %', StatutEnum.REALISE],
  ])('« %s » donne %s', (value, statut) => {
    expect(mapProgressValue(value)).toBe(statut);
  });

  it('ne lit ni un texte ni un nombre hors de 0 à 100 %', () => {
    expect(mapProgressValue('En cours')).toBeNull();
    expect(mapProgressValue('250')).toBeNull();
  });
});

describe('mapStatutCell', () => {
  it('lit un libellé, puis un taux', () => {
    expect(mapStatutCell('Terminée')).toBe(StatutEnum.REALISE);
    expect(mapStatutCell('0.5')).toBe(StatutEnum.EN_COURS);
    expect(mapStatutCell('À voir avec les élus')).toBeNull();
  });
});

describe('isKnownStatutLabel', () => {
  it('reconnaît un statut écrit tel quel, pas un libellé de colonne', () => {
    expect(isKnownStatutLabel('En cours')).toBe(true);
    expect(isKnownStatutLabel('Réalisé')).toBe(true);
    expect(isKnownStatutLabel('Statut')).toBe(false);
    expect(isKnownStatutLabel('Actions en cours')).toBe(false);
  });
});

describe('aggregateFicheStatut', () => {
  const { A_VENIR, EN_COURS, REALISE, ABANDONNE, EN_PAUSE } = StatutEnum;

  it.each([
    [[REALISE, ABANDONNE, null], REALISE],
    [[A_VENIR, REALISE], EN_COURS],
    [[A_VENIR, EN_COURS, null], EN_COURS],
    [[A_VENIR, ABANDONNE], A_VENIR],
    [[ABANDONNE, ABANDONNE], ABANDONNE],
    [[EN_PAUSE, EN_PAUSE], EN_PAUSE],
    [[null, null], null],
    [[], null],
  ])('%j donne %s', (statuts, statut) => {
    expect(aggregateFicheStatut(statuts)).toBe(statut);
  });
});

describe('describeTabularStatutTable', () => {
  it('regroupe les libellés par statut, pour le prompt', () => {
    expect(describeTabularStatutTable()).toBe(
      '"Non engagée", "En projet", "Non démarrée", "Non commencée", "Pas commencée", "À faire", "À lancer", "Prévue", "Planifiée", "Programmée" donnent "À venir" ; "En cours", "Démarrée", "Engagée", "Lancée" donnent "En cours" ; "Terminée", "Achevée", "Faite", "Close", "Clôturée", "Finalisée" donnent "Réalisé" ; "Suspendue", "En attente", "Reportée" donnent "En pause" ; "Annulée" donne "Abandonné"'
    );
  });
});
