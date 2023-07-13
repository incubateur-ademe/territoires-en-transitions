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

  const enfantsTries = enfants.sort((a, b) =>
    a.identifiant.localeCompare(b.identifiant)
  );

  return (
    <>
      {/** TODO : ajouter ici le graphe combinant les indicateurs "enfant" */}
      <IndicateurEnfant
        key={definition.id}
        definition={definition}
        actionsLieesCommunes={actionsLieesCommunes}
        isOpen
        className="fr-mb-4w"
      />

      {enfantsTries.map(enfant => (
        <IndicateurEnfant
          key={enfant.id}
          definition={enfant}
          actionsLieesCommunes={actionsLieesCommunes}
        />
      ))}
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
