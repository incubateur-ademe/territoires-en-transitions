import {
  COLLECTIVITE_SOURCE_ID,
  IndicateurAvecValeurs,
  IndicateurAvecValeursParSource,
  IndicateurDefinition,
  IndicateurDefinitionTiny,
  IndicateurSource,
  IndicateurSourceMetadonnee,
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurGroupee,
  IndicateurValeursGroupeeParSource,
} from '@tet/domain/indicateurs';
import { groupBy, isNil, keyBy, omitBy } from 'es-toolkit';
import { isMoreRecentIndicateurSourceValeur } from './indicateur-source-valeur-recency.rules';

export function deduplicateIndicateurValeursBySource(
  indicateurValeurs: IndicateurValeurAvecMetadonnesDefinition[]
): IndicateurValeurAvecMetadonnesDefinition[] {
  const initialAcc: {
    [key: string]: IndicateurValeurAvecMetadonnesDefinition;
  } = {};
  const uniqueIndicateurValeurs = Object.values(
    indicateurValeurs.reduce((acc, v) => {
      const cleUnicite = `${v.indicateurValeur.indicateurId}_${
        v.indicateurValeur.collectiviteId
      }_${v.indicateurValeur.dateValeur}_${
        v.indicateurSourceMetadonnee?.sourceId || COLLECTIVITE_SOURCE_ID
      }`;
      if (!acc[cleUnicite]) {
        acc[cleUnicite] = v;
      } else {
        const current = acc[cleUnicite];
        if (
          isMoreRecentIndicateurSourceValeur(
            {
              dateVersion: v.indicateurSourceMetadonnee?.dateVersion,
              metadonneeId: v.indicateurValeur.metadonneeId,
            },
            {
              dateVersion: current.indicateurSourceMetadonnee?.dateVersion,
              metadonneeId: current.indicateurValeur.metadonneeId,
            }
          )
        ) {
          acc[cleUnicite] = v;
        }
      }
      return acc;
    }, initialAcc)
  ) as IndicateurValeurAvecMetadonnesDefinition[];
  return uniqueIndicateurValeurs;
}

export function groupIndicateurValeurs(
  indicateurValeurs: IndicateurValeur[],
  indicateurDefinitions: IndicateurDefinitionTiny[],
  commentairesNonInclus = false
): IndicateurAvecValeurs[] {
  const initialDefinitionsAcc: {
    [key: string]: IndicateurDefinitionTiny;
  } = {};
  const uniqueIndicateurDefinitions = Object.values(
    indicateurDefinitions.reduce((acc, def) => {
      if (def?.id) {
        acc[def.id.toString()] = def;
      }
      return acc;
    }, initialDefinitionsAcc)
  );

  const indicateurAvecValeurs = uniqueIndicateurDefinitions.map(
    (indicateurDefinition) => {
      const valeurs = indicateurValeurs
        .filter((v) => v.indicateurId === indicateurDefinition.id)
        .map((v) => {
          const indicateurValeurGroupee: IndicateurValeurGroupee = {
            id: v.id,
            collectiviteId: v.collectiviteId,
            dateValeur: v.dateValeur,
            resultat: v.resultat,
            objectif: v.objectif,
            metadonneeId: null,
          };
          if (!commentairesNonInclus) {
            indicateurValeurGroupee.resultatCommentaire = v.resultatCommentaire;
            indicateurValeurGroupee.objectifCommentaire = v.objectifCommentaire;
          }
          return omitBy(
            indicateurValeurGroupee,
            isNil
          ) as IndicateurValeurGroupee;
        });
      // Trie les valeurs par date
      valeurs.sort((a, b) => {
        return a.dateValeur.localeCompare(b.dateValeur);
      });
      const indicateurAvecValeurs: IndicateurAvecValeurs = {
        definition: indicateurDefinition,
        valeurs,
      };
      return indicateurAvecValeurs;
    }
  );
  return indicateurAvecValeurs.filter((i) => i.valeurs.length > 0);
}

export function groupIndicateurValeursBySource(
  indicateurValeurs: (IndicateurValeur & { confidentiel?: boolean | null })[],
  indicateurDefinitions: Pick<IndicateurDefinition, 'id'>[],
  indicateurMetadonnees: IndicateurSourceMetadonnee[],
  sources: IndicateurSource[],
  supprimeIndicateursSansValeurs = true
): IndicateurAvecValeursParSource[] {
  const initialDefinitionsAcc: {
    [key: string]: Pick<IndicateurDefinition, 'id'>;
  } = {};
  const uniqueIndicateurDefinitions = Object.values(
    indicateurDefinitions.reduce((acc, def) => {
      if (def?.id) {
        acc[def.id.toString()] = def;
      }
      return acc;
    }, initialDefinitionsAcc)
  );

  const sourcesParId = sources?.length ? keyBy(sources, (item) => item.id) : {};

  const indicateurAvecValeurs = uniqueIndicateurDefinitions.map(
    (indicateurDefinition) => {
      const valeurs = indicateurValeurs
        .filter((v) => v.indicateurId === indicateurDefinition.id)
        .map((v) => {
          const indicateurValeurGroupee: IndicateurValeurGroupee = {
            id: v.id,
            collectiviteId: v.collectiviteId,
            dateValeur: v.dateValeur,
            resultat: v.resultat,
            resultatCommentaire: v.resultatCommentaire,
            objectif: v.objectif,
            objectifCommentaire: v.objectifCommentaire,
            metadonneeId: v.metadonneeId,
            confidentiel: v.confidentiel,
            calculAuto: v.calculAuto ? v.calculAuto : undefined,
            calculAutoIdentifiantsManquants: v.calculAutoIdentifiantsManquants,
          };

          return omitBy(
            indicateurValeurGroupee,
            isNil
          ) as IndicateurValeurGroupee;
        });

      const metadonneesUtilisees: Record<
        string,
        Record<string, IndicateurSourceMetadonnee>
      > = {};
      const valeursParSource = groupBy(valeurs, (valeur) => {
        if (!valeur.metadonneeId) {
          return COLLECTIVITE_SOURCE_ID;
        }
        const metadonnee = indicateurMetadonnees.find(
          (m) => m.id === valeur.metadonneeId
        );
        if (!metadonnee) {
          return 'unknown';
        } else {
          if (!metadonneesUtilisees[metadonnee.sourceId]) {
            metadonneesUtilisees[metadonnee.sourceId] = {};
          }
          if (!metadonneesUtilisees[metadonnee.sourceId][metadonnee.id]) {
            metadonneesUtilisees[metadonnee.sourceId][metadonnee.id] =
              metadonnee;
          }
          return metadonnee.sourceId;
        }
      });
      const sourceMap: Record<string, IndicateurValeursGroupeeParSource> = {};
      for (const sourceId of Object.keys(valeursParSource)) {
        // Trie les valeurs par date
        valeursParSource[sourceId] = valeursParSource[sourceId].sort((a, b) => {
          return a.dateValeur.localeCompare(b.dateValeur);
        });
        sourceMap[sourceId] = {
          source: sourceId,
          metadonnees: Object.values(metadonneesUtilisees[sourceId] || {}),
          valeurs: valeursParSource[sourceId],
          libelle: sourcesParId[sourceId]?.libelle ?? '',
          ordreAffichage: sourcesParId[sourceId]?.ordreAffichage ?? null,
        };
      }
      const IndicateurAvecValeursParSource: IndicateurAvecValeursParSource = {
        definition: indicateurDefinition as IndicateurDefinition,
        totalValeursCount: valeurs.length,
        totalFilledValeursCount: valeurs.filter(
          (v) => !isNil(v.resultat) || !isNil(v.objectif)
        ).length,
        sources: sourceMap,
      };
      return IndicateurAvecValeursParSource;
    }
  );

  if (supprimeIndicateursSansValeurs) {
    return indicateurAvecValeurs.filter(
      (i) => Object.keys(i.sources).length > 0
    );
  } else {
    return indicateurAvecValeurs;
  }
}
