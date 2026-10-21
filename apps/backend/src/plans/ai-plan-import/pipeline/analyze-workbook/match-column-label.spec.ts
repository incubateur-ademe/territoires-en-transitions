import { describe, expect, it } from 'vitest';
import {
  areCompatibleRoles,
  matchColumnLabel,
  matchFieldLabel,
} from './match-column-label';

describe('matchColumnLabel', () => {
  it.each([
    ['Objectifs stratégiques', 'hierarchie'],
    ['Orientation', 'hierarchie'],
    ['Axe (x)', 'hierarchie'],
    ["Titre de l'action", 'titre'],
    ['Intitulé', 'titre'],
    ['Titre de la sous-action', 'sousAction'],
    ['n°', 'numero'],
    ['Porteur', 'structurePilote'],
    ['PILOTE', 'structurePilote'],
    ['Personne pilote', 'personnePilote'],
    ['Direction ou service pilote', 'servicePilote'],
    ['Service référent', 'servicePilote'],
    ['Élu référent', 'personnePilote'],
    ['État d’avancement', 'statut'],
    ['Échéance', 'dateFin'],
    ['CALENDRIER · 2021', 'calendrier'],
    ['SUIVI BUDGETAIRE · Budget consommé', 'budgetConsomme'],
    ['SUIVI BUDGETAIRE · Part subventionnable', 'financements'],
    ['Budget prévisionnel total € HT', 'budget'],
    ['Indicateurs de suivi', 'indicateur'],
    ['Valeurs cibles', 'cible'],
    ['COMMENTAIRES', 'commentaire'],
  ])('« %s » annonce %s', (label, role) => {
    expect(matchColumnLabel(label)).toBe(role);
  });

  it('ne reconnaît pas un libellé inconnu', () => {
    expect(matchColumnLabel('Gain carbone estimé')).toBeNull();
    expect(matchColumnLabel('')).toBeNull();
  });
});

describe('matchFieldLabel', () => {
  it('lit un libellé de fiche-formulaire sans ses deux-points', () => {
    expect(matchFieldLabel('Intitulé de l’action :')).toBe('titre');
    expect(matchFieldLabel('Étapes :')).toBe('sousAction');
  });
});

describe('areCompatibleRoles', () => {
  it('ne voit pas de contradiction entre deux sortes de pilotes', () => {
    expect(areCompatibleRoles('structurePilote', 'personnePilote')).toBe(true);
    expect(areCompatibleRoles('budget', 'financements')).toBe(true);
    expect(areCompatibleRoles('structurePilote', 'sousAction')).toBe(false);
  });
});
