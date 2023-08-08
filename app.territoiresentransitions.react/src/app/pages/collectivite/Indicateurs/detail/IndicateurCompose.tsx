import {IndicateurEnfant} from './IndicateurEnfant';
import {TIndicateurReferentielDefinition} from '../types';

/**
 * Affiche le détail d'un indicateur composé
 */
export const IndicateurCompose = ({
  definition,
  enfants,
}: {
  definition: TIndicateurReferentielDefinition;
  enfants: TIndicateurReferentielDefinition[];
}) => {
  const actionsLieesCommunes = findCommonLinkedActions([
    definition,
    ...enfants,
  ]);

  const enfantsTries = enfants.sort((a, b) => {
    if (a.identifiant === null || b.identifiant === null) return 0;
    return a.identifiant.localeCompare(b.identifiant);
  });

  return (
    <>
      {/** TODO : ajouter ici le graphe combinant les indicateurs "enfant" */}

      {/** indicateur parent (sauf si il est marqué "sans valeur") */}
      {!definition.sans_valeur && (
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
        enfantsTries.map(enfant => (
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
const findCommonLinkedActions = (
  definitions: TIndicateurReferentielDefinition[]
) => {
  // extrait les tableaux d'ids
  const actionsIds = definitions.map(({actions}) => actions);

  return (
    actionsIds
      // enlève les tableaux vides
      .filter(a => a?.length)
      // détermine le sous-ensemble des ids communs
      .reduce((a, b) => a.filter(c => b.includes(c)), [])
  );
};
