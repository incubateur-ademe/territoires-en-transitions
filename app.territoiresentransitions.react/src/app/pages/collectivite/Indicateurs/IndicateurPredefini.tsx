import {BadgeACompleter} from 'ui/shared/Badge/BadgeACompleter';
import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {Badge} from 'ui/shared/Badge';
import {referentielToName} from 'app/labels';
import {useIndicateur, useIndicateursEnfants} from './useIndicateurDefinitions';
import {ActionsLieesCards} from '../PlansActions/FicheAction/FicheActionForm/ActionsLiees';
import {IndicateurSidePanel} from './IndicateurSidePanel';
import IndicateurChart from './charts/IndicateurChart';
import {HeaderIndicateur} from './Header';
import {IndicateurValuesTabs} from './IndicateurValuesTabs';
import {IndicateurEnfant} from './IndicateurEnfant';
import {TIndicateurReferentielDefinition} from './types';
import {FichesActionLiees} from './FichesActionLiees';

/** Charge et affiche le détail d'un indicateur prédéfini et de ses éventuels "enfants" */
export const IndicateurPredefini = ({indicateurId}: {indicateurId: string}) => {
  const definition = useIndicateur(indicateurId);
  const enfants = useIndicateursEnfants(indicateurId);
  if (!definition) return null;

  return (
    <>
      <HeaderIndicateur title={definition.nom} />
      <div className="px-10 py-4">
        <div className="flex flex-row justify-end fr-mb-2w">
          <IndicateurSidePanel definition={definition} />
        </div>
        {/** affiche les indicateurs "enfants" */}
        {enfants.length ? (
          <IndicateurCompose definition={definition} enfants={enfants} />
        ) : (
          /** ou juste le détail si il n'y a pas d'enfants */
          <IndicateurDetail definition={definition} />
        )}
        <ScrollTopButton className="fr-mt-4w" />
      </div>
    </>
  );
};

/**
 * Affiche le détail d'un indicateur sans enfant
 */
const IndicateurDetail = ({
  definition,
}: {
  definition: TIndicateurReferentielDefinition & {a_completer: boolean};
}) => {
  const {a_completer, actions} = definition;

  // converti la liste d'id en liste d'objets pour être compatible avec `ActionsLieesCards`
  const actionsLiees = actions?.map(id => ({id}));

  return (
    <>
      <IndicateurChart variant="zoomed" definition={definition} />
      <div className="flex items-center fr-mt-5w fr-mb-3w gap-4">
        <BadgeACompleter a_completer={a_completer} />
        {definition.participation_score && (
          <Badge className="!normal-case" status="no-icon">
            Participe au score {referentielToName.cae}
          </Badge>
        )}
      </div>
      <IndicateurValuesTabs definition={definition} />
      <div className="fr-mt-5w ">
        {/** TODO: personne et direction pilote */}
        {
          /** actions liées */
          actionsLiees?.length ? (
            <>
              <p className="fr-mb-1w font-medium">
                {actionsLiees.length > 1 ? 'Actions liées' : 'Action liée'}
              </p>
              <ActionsLieesCards actions={actionsLiees} />
            </>
          ) : null
        }
        <FichesActionLiees definition={definition} />
      </div>
    </>
  );
};

/**
 * Affiche le détail d'un indicateur composé
 */
const IndicateurCompose = ({
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
      .reduce((a, b) => a.filter(c => b.includes(c)))
  );
};
