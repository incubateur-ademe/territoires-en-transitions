import { AddPreuveComplementaire } from '@/app/referentiels/preuves/AddPreuveComplementaire';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert, Divider } from '@tet/ui';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, Fragment } from 'react';
import PreuveDoc from './Bibliotheque/PreuveDoc';
import { PreuveReglementaire } from './Bibliotheque/PreuveReglementaire';
import {
  TPreuveComplementaire,
  TPreuveReglementaire,
} from './Bibliotheque/types';
import { TActionDef } from './usePreuves';

export interface TPreuvesActionProps extends ComponentPropsWithoutRef<'div'> {
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
  /** Affichage sur une colonne pour les preuves dans le panneau latéral */
  displayInPanel?: boolean;
}

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
    displayInPanel,
    ...otherProps
  } = props;

  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canEditReferentiel = hasCollectivitePermission('referentiels.mutate');

  const showComplementaires =
    canEditReferentiel ||
    (!canEditReferentiel && complementaires && complementaires.length > 0);

  // groupe les preuves réglementaires par id de sous-action
  const reglementairesParActionId = reglementaires?.length
    ? Array.from(groupByActionId(reglementaires))
    : null;

  return (
    <div data-test={`preuves-${action.id}`} {...otherProps}>
      {/* Preuves attendues */}
      {reglementairesParActionId ? (
        <div data-test="attendues">
          {
            /** Il peut y avoir plusieurs preuves réglementaires elles même
             * potentiellement attachées à plusieurs sous-actions, il faut
             * donc une double boucle (par id de sous-action puis par id de
             * preuve) pour faire l'affichage de tous les items voulus */
            reglementairesParActionId.map(([, preuvesList]) => {
              const preuvesParDefinitionId = Array.from(
                groupByPreuveDefinitionId(preuvesList)
              );
              return preuvesParDefinitionId.map(
                ([preuveId, preuvesSubList], idx) => (
                  <Fragment key={preuveId}>
                    <PreuveReglementaire
                      preuves={preuvesSubList}
                      hideIdentifier={hideIdentifier}
                      displayInPanel={displayInPanel}
                    />
                    {(showComplementaires ||
                      (idx !== preuvesParDefinitionId.length - 1 &&
                        !showComplementaires)) && <Divider color="light" />}
                  </Fragment>
                )
              );
            })
          }
        </div>
      ) : (
        <Alert
          title={`Il n'y a pas de document attendu pour cette ${
            withSubActions ? 'action' : 'sous-action'
          } du référentiel.`}
          className="mb-5"
        />
      )}

      {/* Preuves complémentaires */}
      {showComplementaires && (
        <div className="flex flex-col gap-5">
          <div
            className="flex items-center justify-between gap-4"
            data-test="preuve"
          >
            <span className="text-sm text-primary-9 font-medium flex gap-2 items-center uppercase">
              Documents complémentaires
            </span>

            {/* Modale d'ajout de documents */}
            <AddPreuveComplementaire
              action={action}
              addToSubAction={withSubActions}
            />
          </div>

          {complementaires?.length ? (
            <div>
              <div
                data-test="complementaires"
                className={classNames('grid gap-5', {
                  'md:grid-cols-2 lg:grid-cols-3': !displayInPanel,
                })}
              >
                {complementaires?.map((preuve) => (
                  <PreuveDoc
                    key={preuve.id}
                    preuve={preuve}
                    displayIdentifier={!(hideIdentifier ?? false)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Message d'avertissement */}
      {showWarning && (
        <Alert
          state="warning"
          className="mt-5"
          description="Tous les documents sont visibles par les membres de la communauté
            Territoires en Transitions, en dehors des documents confidentiels."
        />
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

  preuves.forEach((preuve) => {
    const { action_id } = preuve.action;
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

  preuves.forEach((preuve) => {
    const { id } = preuve.preuve_reglementaire;
    byId.set(id, [...(byId.get(id) || []), preuve]);
  });

  return byId;
};
