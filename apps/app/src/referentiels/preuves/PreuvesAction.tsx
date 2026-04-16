import { appLabels } from '@/app/labels/catalog';
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
  action: TActionDef;
  withSubActions?: boolean;
  showWarning?: boolean;
  hideIdentifier?: boolean;
  reglementaires?: TPreuveReglementaire[];
  complementaires?: TPreuveComplementaire[];
  displayInPanel?: boolean;
}

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

  const reglementairesParActionId = reglementaires?.length
    ? Array.from(groupByActionId(reglementaires))
    : null;

  return (
    <div data-test={`preuves-${action.id}`} {...otherProps}>
      {reglementairesParActionId ? (
        <div data-test="attendues">
          {reglementairesParActionId.map(([, preuvesList]) => {
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
                      !showComplementaires)) && (
                    <Divider className="mb-6 border-grey-3" />
                  )}
                </Fragment>
              )
            );
          })}
        </div>
      ) : (
        <Alert
          title={
            withSubActions
              ? appLabels.pasDocumentAttenduAction
              : appLabels.pasDocumentAttenduSousAction
          }
          className="mb-5"
        />
      )}

      {showComplementaires && (
        <div className="flex flex-col gap-5">
          <div
            className="flex items-center justify-between gap-4"
            data-test="preuve"
          >
            <span className="text-sm text-primary-9 font-bold flex gap-2 items-center uppercase max-w-80">
              {appLabels.documentsComplementaires}
            </span>

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

      {showWarning && (
        <Alert
          state="warning"
          className="mt-5"
          description={appLabels.documentsVisiblesAvertissement}
        />
      )}
    </div>
  );
};

const groupByActionId = (preuves: TPreuveReglementaire[]) => {
  const byId = new Map<string, TPreuveReglementaire[]>();
  preuves.forEach((preuve) => {
    const { action_id } = preuve.action;
    byId.set(action_id, [...(byId.get(action_id) || []), preuve]);
  });
  return byId;
};

const groupByPreuveDefinitionId = (preuves: TPreuveReglementaire[]) => {
  const byId = new Map<string, TPreuveReglementaire[]>();
  preuves.forEach((preuve) => {
    const { id } = preuve.preuve_reglementaire;
    byId.set(id, [...(byId.get(id) || []), preuve]);
  });
  return byId;
};
