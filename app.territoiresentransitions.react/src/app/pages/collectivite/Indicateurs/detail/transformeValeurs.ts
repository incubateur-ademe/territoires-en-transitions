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
        | 'source'
      >[]
    | undefined,
  sourceId?: string
) {
  const objectifs: TIndicateurValeur[] = [];
  const resultats: TIndicateurValeur[] = [];
  let derniereSourceVersion = 0;
  let derniereSource = null;

  valeursBrutes?.forEach(
    ({
      id,
      annee,
      objectif,
      resultat,
      objectifCommentaire,
      resultatCommentaire,
      source,
    }) => {
      if (typeof objectif === 'number') {
        objectifs.push({
          id,
          annee,
          valeur: objectif,
          commentaire: objectifCommentaire || '',
          type: 'objectif',
          source: sourceId || null,
        });
      }

      if (typeof resultat === 'number') {
        resultats.push({
          id,
          annee,
          valeur: resultat,
          commentaire: resultatCommentaire || '',
          type: 'resultat',
          source: sourceId || null,
        });
      }
      if (source) {
        const version = new Date(source.dateVersion).getTime();
        if (version > derniereSourceVersion) {
          derniereSourceVersion = version;
          derniereSource = source;
        }
      }
    }
  );

  // Assemblage des données pour le graphique
  return {
    valeurs: [...objectifs, ...resultats],
    objectifs,
    resultats,
    // dernière métadonnées disponibles pour la source voulue
    metadonnee: derniereSource as Indicateurs.domain.Valeur['source'] | null,
  };
}
