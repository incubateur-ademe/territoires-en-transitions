import {TPreuveComplementaire, TPreuveReglementaire} from './types';
import {PreuveReglementaire} from './PreuveReglementaire';
import {AddPreuveComplementaire} from 'ui/shared/actions/AddPreuve/AddPreuveComplementaire';
import {PreuveComplementaire} from './PreuveComplementaire';
import {TActionDef} from './usePreuves';

export type TPreuvesActionProps = {
  /** Identifiant de l'action ou de la sous-action concernée */
  action: TActionDef;
  /** indique si les preuves associées aux sous-actions sont également chargées */
  withSubActions?: boolean;
  /** indique si l'avertissement "toutes les preuves ajoutées seront
   * visibles..." doit être affiché */
  showWarning?: boolean;
  /** indique si l'identifiant de l'action doit être masqué */
  noIdentifiant?: boolean;
  /** les preuves réglementaires */
  reglementaires?: TPreuveReglementaire[];
  /** les preuves complémentaires */
  complementaires?: TPreuveComplementaire[];
};

/**
 * Affiche la liste des preuves associées à une action, en regroupant pour les
 * preuves réglementaires celles associées au même id de définition
 */
export const PreuvesAction = (props: TPreuvesActionProps) => {
  const {
    action,
    withSubActions,
    reglementaires,
    complementaires,
    showWarning,
    noIdentifiant,
  } = props;
  const preuvesParId = reglementaires?.length
    ? Array.from(groupByPreuveDefinitionId(reglementaires))
    : null;

  return (
    <div data-test={`preuves-${action.id}`}>
      {preuvesParId ? (
        <>
          <h5>Preuves attendues</h5>
          <div data-test="attendues" className="divide-y divide-[#ddd] -mt-2">
            {preuvesParId.map(([preuveDefId, preuvesList]) => (
              <PreuveReglementaire
                key={preuveDefId}
                preuves={preuvesList}
                noIdentifiant={noIdentifiant}
              />
            ))}
          </div>
          <YellowDivider />
        </>
      ) : (
        <p className="fr-text--sm">
          Il n'y a pas de preuve attendue pour cette{' '}
          {withSubActions ? 'action' : 'sous-action'} du référentiel.
        </p>
      )}
      <h5>Preuves complémentaires</h5>
      <AddPreuveComplementaire
        action={action}
        addToSubAction={withSubActions}
      />
      <div data-test="complementaires" className="divide-y divide-[#ddd]">
        {complementaires?.map(preuve => (
          <PreuveComplementaire
            key={preuve.id}
            preuve={preuve}
            noIdentifiant={noIdentifiant}
          />
        ))}
      </div>
      {showWarning ? (
        <>
          <YellowDivider />
          <p>
            Toutes les preuves ajoutées seront visibles par les membres de la
            communauté Territoires en Transitions
          </p>
        </>
      ) : null}
    </div>
  );
};

const YellowDivider = () => (
  <div className="border-solid border-t-[1px] border-[#FCC63A] my-4" />
);

// regrouve les preuves réglementaires par l'identifiant de leur définition
const groupByPreuveDefinitionId = (preuves: TPreuveReglementaire[]) => {
  // on utilise une Map pour conserver l'ordre d'insertion
  const byId = new Map<string, TPreuveReglementaire[]>();

  preuves.forEach(preuve => {
    const {id} = preuve.preuve_reglementaire;
    byId.set(id, [...(byId.get(id) || []), preuve]);
  });

  return byId;
};
