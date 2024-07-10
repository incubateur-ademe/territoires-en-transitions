import {TIndicateurValeur} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';

export const fakeIndicateurValeurs: TIndicateurValeur[] = [
  {source: null, commentaire: null, annee: 2016, valeur: 3, type: 'objectif'},
  {source: null, commentaire: null, annee: 2018, valeur: 5, type: 'objectif'},
  {source: null, commentaire: null, annee: 2019, valeur: 7, type: 'objectif'},
  {source: null, commentaire: null, annee: 2020, valeur: 8, type: 'objectif'},
  {source: null, commentaire: null, annee: 2021, valeur: 10, type: 'objectif'},
  {source: null, commentaire: null, annee: 2022, valeur: 15, type: 'objectif'},
  {
    source: null,
    commentaire: null,
    annee: 2023,
    valeur: 56555.6,
    type: 'objectif',
  },
  {source: null, commentaire: null, annee: 2016, valeur: 1, type: 'resultat'},
  {source: null, commentaire: null, annee: 2016, valeur: 3, type: 'resultat'},
  {
    source: 'id-source',
    commentaire: null,
    annee: 2016,
    valeur: 4,
    type: 'import',
  },
  {source: null, commentaire: null, annee: 2018, valeur: 3, type: 'resultat'},
  {source: null, commentaire: null, annee: 2019, valeur: 5, type: 'resultat'},
  {source: null, commentaire: null, annee: 2020, valeur: 1, type: 'resultat'},
  {source: null, commentaire: null, annee: 2021, valeur: 0, type: 'resultat'},
];
