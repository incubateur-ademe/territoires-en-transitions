import { IndicateurDefinition } from '@tet/api/indicateurs/domain';
import { useIndicateurDefinitions } from 'app/pages/collectivite/Indicateurs/Indicateur/useIndicateurDefinition';
import { IndicateurEnfant } from './IndicateurEnfant';

/**
 * Affiche le détail d'un indicateur composé
 */
export const IndicateurCompose = ({
  definition,
}: {
  definition: IndicateurDefinition;
}) => {
  const { enfants: enfantIds } = definition;
  const enfants = useIndicateurDefinitions(definition.id, enfantIds || []);

  if (!enfants?.length) return null;

  const actionsLieesCommunes = findCommonLinkedActions([
    definition,
    ...enfants,
  ]);

  const enfantsTries = enfants.sort((a, b) => {
    if (!a.identifiant || !b.identifiant) {
      return 0;
    }
    return a.identifiant.localeCompare(b.identifiant);
  });

  return (
    <>
      {/** TODO : ajouter ici le graphe combinant les indicateurs "enfant" */}

      {/** indicateur parent (sauf si il est marqué "sans valeur") */}
      {!definition.sansValeur && (
        <IndicateurEnfant
          key={definition.id}
          definition={definition}
          actionsLieesCommunes={actionsLieesCommunes}
          isOpen
          className="fr-mb-4w"
        />
      )}

      {
        /** indicateurs enfants */
        enfantsTries.map((enfant) => (
          <IndicateurEnfant
            key={enfant.id}
            definition={enfant}
            actionsLieesCommunes={actionsLieesCommunes}
          />
        ))
      }
    </>
  );
};
// détermine les actions liées communes à un ensemble de définitions
const findCommonLinkedActions = (definitions: IndicateurDefinition[]) => {
  // extrait les tableaux d'ids
  const actionsIds = definitions.map(({ actions }) => actions.map((a) => a.id));

  return (
    actionsIds
      // enlève les tableaux vides
      .filter((a) => a?.length)
      // détermine le sous-ensemble des ids communs
      .reduce((a, b) => a.filter((c) => b.includes(c)), [])
  );
};
