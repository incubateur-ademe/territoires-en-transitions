/** Typologies SINOE : code publié par SINOE → id interne + libellé */
export const TYPOLOGIES_SINOE = [
  { codeSinoe: 'D', id: 'dense', libelle: 'Urbain dense' },
  { codeSinoe: 'U', id: 'urbain', libelle: 'Urbain' },
  { codeSinoe: 'M1', id: 'mixte_urbain', libelle: 'Mixte à dominante urbaine' },
  { codeSinoe: 'M2', id: 'mixte_rural', libelle: 'Mixte à dominante rurale' },
  {
    codeSinoe: 'R1',
    id: 'rural_ville_centre',
    libelle: 'Rural avec ville centre',
  },
  { codeSinoe: 'R2', id: 'rural_disperse', libelle: 'Rural dispersé' },
  { codeSinoe: 'T1', id: 'touristique', libelle: 'Très touristique' },
  { codeSinoe: 'T2', id: 'touristique_urbain', libelle: 'Touristique urbain' },
  { codeSinoe: 'T3', id: 'autre_touristique', libelle: 'Autre touristique' },
  { codeSinoe: 'NP', id: 'non_precise', libelle: 'Non précisé' },
] as const;
