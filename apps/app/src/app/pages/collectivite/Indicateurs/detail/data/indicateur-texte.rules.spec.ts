import { describe, expect, it } from 'vitest';
import { toTexteUpdate } from './indicateur-texte.rules';

const indicateur = {
  titre: 'Bornes de recharge',
  unite: 'km',
  commentaire: 'Source locale',
};

describe('toTexteUpdate', () => {
  it('renvoie le texte nettoyé quand il diffère de la valeur actuelle', () => {
    expect(
      toTexteUpdate({ indicateur, field: 'titre', texte: '  Nouveau titre ' })
    ).toEqual({ titre: 'Nouveau titre' });
  });

  it('ne renvoie rien quand le texte nettoyé est identique à la valeur actuelle', () => {
    expect(
      toTexteUpdate({ indicateur, field: 'unite', texte: ' km ' })
    ).toBeNull();
  });

  it('cible le champ demandé', () => {
    expect(
      toTexteUpdate({ indicateur, field: 'commentaire', texte: 'Autre' })
    ).toEqual({ commentaire: 'Autre' });
  });
});
