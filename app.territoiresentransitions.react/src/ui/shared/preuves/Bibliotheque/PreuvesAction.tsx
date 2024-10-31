import {TPreuveComplementaire, TPreuveReglementaire} from './types';
import {PreuveReglementaire} from './PreuveReglementaire';
import {AddPreuveComplementaire} from 'ui/shared/actions/AddPreuve/AddPreuveComplementaire';
import {TActionDef} from './usePreuves';
import {YellowDivider} from 'ui/dividers/YellowDivider';
import PreuveDoc from './PreuveDoc';

export type TPreuvesActionProps = {
  /** Identifiant de l'action ou de la sous-action concernée */
  action: TActionDef;
  /** indique si les preuves associées aux sous-actions sont également chargées */
  withSubActions?: boolean;
  /** indique si l'avertissement "toutes les preuves ajoutées seront
   * visibles..." doit être affiché */
  showWarning?: boolean;
  /** indique si l'identifiant de l'action doit être masqué */
  hideIdentifier?: boolean;
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
    hideIdentifier,
  } = props;

  // groupe les preuves réglementaires par id de sous-action
  const reglementairesParActionId = reglementaires?.length
    ? Array.from(groupByActionId(reglementaires))
    : null;

  return (
    <div data-test={`preuves-${action.id}`}>
      {/* Preuves attendues */}
      {reglementairesParActionId ? (
        <>
          <div data-test="attendues" className="divide-y divide-[#ddd]">
            {
              /** Il peut y avoir plusieurs preuves réglementaires elles même
               * potentiellement attachées à plusieurs sous-actions, il faut
               * donc une double boucle (par id de sous-action puis par id de
               * preuve) pour faire l'affichage de tous les items voulus */
              reglementairesParActionId.map(([preuveActionId, preuvesList]) => {
                const preuvesParDefinitionId = Array.from(
                  groupByPreuveDefinitionId(preuvesList)
                );
                return preuvesParDefinitionId.map(
                  ([preuveId, preuvesSubList]) => (
                    <PreuveReglementaire
                      key={preuveId}
                      preuves={preuvesSubList}
                      hideIdentifier={hideIdentifier}
                    />
                  )
                );
              })
            }
          </div>
          <YellowDivider />
        </>
      ) : (
        <p className="fr-text--sm !mb-0 py-4">
          Il n'y a pas de document attendu pour cette{' '}
          {withSubActions ? 'action' : 'sous-action'} du référentiel.
        </p>
      )}

      {/* Preuves complémentaires */}
      <div className="flex flex-col gap-4 py-4">
        <AddPreuveComplementaire
          action={action}
          addToSubAction={withSubActions}
        />
        {complementaires?.length ? (
          <div data-test="complementaires" className="flex flex-col gap-3">
            {complementaires?.map((preuve) => (
              <PreuveDoc
                key={preuve.id}
                preuve={preuve}
                displayIdentifier={!(hideIdentifier ?? false)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Message d'avertissement */}
      {showWarning && (
        <>
          <YellowDivider />
          <p className="text-xs grey-6 py-4 mb-0">
            Tous les documents sont visibles par les membres de la communauté
            Territoires en Transitions, sauf les documents confidentiels
          </p>
        </>
      )}
    </div>
  );
};

/**
 * Regroupe les preuves réglementaires par l'identifiant de l'action associée
 */
const groupByActionId = (preuves: TPreuveReglementaire[]) => {
  // on utilise une Map pour conserver l'ordre d'insertion
  const byId = new Map<string, TPreuveReglementaire[]>();

  preuves.forEach(preuve => {
    const {action_id} = preuve.action;
    byId.set(action_id, [...(byId.get(action_id) || []), preuve]);
  });

  return byId;
};

/**
 * Regroupe les preuves réglementaires par l'identifiant de leur définition
 */
const groupByPreuveDefinitionId = (preuves: TPreuveReglementaire[]) => {
  // on utilise une Map pour conserver l'ordre d'insertion
  const byId = new Map<string, TPreuveReglementaire[]>();

  preuves.forEach(preuve => {
    const {id} = preuve.preuve_reglementaire;
    byId.set(id, [...(byId.get(id) || []), preuve]);
  });

  return byId;
};
