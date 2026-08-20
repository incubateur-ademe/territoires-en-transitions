import { describe, expect, it } from 'vitest';
import {
  getCurrentUserLabel,
  isPersonneFilterKey,
} from './personne-filter-label';

const currentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  prenom: 'Camille',
  nom: 'Dupont',
};

const otherPersonneId = '00000000-0000-4000-8000-000000000002';

describe('isPersonneFilterKey', () => {
  it('reconnaît les clés portant des identifiants de personne', () => {
    expect(isPersonneFilterKey('utilisateurPiloteIds')).toBe(true);
    expect(isPersonneFilterKey('utilisateurReferentIds')).toBe(true);
  });

  it('écarte les autres clés de filtre', () => {
    expect(isPersonneFilterKey('planActionIds')).toBe(false);
    expect(isPersonneFilterKey('servicePiloteIds')).toBe(false);
  });
});

describe('getCurrentUserLabel', () => {
  it("rend le nom complet quand l'identifiant est celui de l'utilisateur connecté", () => {
    expect(getCurrentUserLabel(currentUser, currentUser.id)).toBe(
      'Camille Dupont'
    );
  });

  it("ne rend rien pour l'identifiant d'une autre personne", () => {
    expect(getCurrentUserLabel(currentUser, otherPersonneId)).toBeUndefined();
  });

  it("ne confond pas un identifiant de tag numérique avec l'utilisateur connecté", () => {
    expect(getCurrentUserLabel(currentUser, 42)).toBeUndefined();
  });
});
