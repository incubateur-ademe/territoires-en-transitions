import {TIndicateurValeur} from 'app/pages/collectivite/Indicateurs/useIndicateurValeurs';
import {Indicateurs} from '@tet/api';

/** Sépare les données objectifs/résultats */
export function transformeValeurs(
  valeursBrutes:
    | Pick<
        Indicateurs.domain.Valeur,
        | 'id'
        | 'annee'
        | 'resultat'
        | 'objectif'
        | 'objectifCommentaire'
        | 'resultatCommentaire'
      >[]
    | undefined,
  source?: string
) {
  const objectifs: TIndicateurValeur[] = [];
  const resultats: TIndicateurValeur[] = [];

  valeursBrutes?.forEach(
    ({
      id,
      annee,
      objectif,
      resultat,
      objectifCommentaire,
      resultatCommentaire,
    }) => {
      if (typeof objectif === 'number') {
        objectifs.push({
          id,
          annee,
          valeur: objectif,
          commentaire: objectifCommentaire || '',
          type: 'objectif',
          source: source || null,
        });
      }

      if (typeof resultat === 'number') {
        resultats.push({
          id,
          annee,
          valeur: resultat,
          commentaire: resultatCommentaire || '',
          type: 'resultat',
          source: source || null,
        });
      }
    }
  );

  // Assemblage des données pour le graphique
  return {
    valeurs: [...objectifs, ...resultats],
    objectifs,
    resultats,
  };
}
