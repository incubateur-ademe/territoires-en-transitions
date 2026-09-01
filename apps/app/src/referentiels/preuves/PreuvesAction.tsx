import { appLabels } from '@/app/labels/catalog';
import { AddPreuveComplementaire } from '@/app/referentiels/preuves/AddPreuveComplementaire';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Alert, Divider } from '@tet/ui';
import classNames from 'classnames';
import { ComponentPropsWithoutRef, Fragment } from 'react';
import PreuveDoc from './Bibliotheque/PreuveDoc';
import { PreuveReglementaire } from './Bibliotheque/PreuveReglementaire';
import { DocumentAttendu, PreuveComplementaire } from './Bibliotheque/types';
import { useDuplicatedDocumentState } from './duplicated-document-state.utils';
import { ActionDef } from '../actions/use-list-actions';

export interface PreuvesActionProps extends ComponentPropsWithoutRef<'div'> {
  action: ActionDef;
  withSubActions?: boolean;
  showWarning?: boolean;
  hideIdentifier?: boolean;
  attendus?: DocumentAttendu[];
  complementaires?: PreuveComplementaire[];
  displayInPanel?: boolean;
}

export const PreuvesAction = (props: PreuvesActionProps) => {
  const {
    action,
    withSubActions,
    attendus = [],
    complementaires,
    showWarning,
    hideIdentifier,
    displayInPanel,
    ...otherProps
  } = props;

  const { hasReferentielPermission } = useCurrentCollectivite();
  const referentielId = getReferentielIdFromActionId(action.actionId);
  const canEditReferentiel = hasReferentielPermission(
    'referentiels.mutate',
    referentielId
  );

  const showComplementaires =
    canEditReferentiel ||
    (!canEditReferentiel && complementaires && complementaires.length > 0);
  const { registerDuplicatedDocuments, getDuplicatedDocumentInformation } =
    useDuplicatedDocumentState();

  const hasAttendus = attendus.length > 0;

  return (
    <div data-test={`preuves-${action.actionId}`} {...otherProps}>
      {hasAttendus ? (
        <div data-test="attendues">
          {attendus.map((attendu, index) => {
            const actionId = attendu.action.action_id;
            const hasMoreAttendusForAction = attendus
              .slice(index + 1)
              .some((next) => next.action.action_id === actionId);
            const showDivider = showComplementaires || hasMoreAttendusForAction;
            return (
              <Fragment key={`${actionId}/${attendu.preuve_reglementaire.id}`}>
                <PreuveReglementaire
                  attendu={attendu}
                  hideIdentifier={hideIdentifier}
                  displayInPanel={displayInPanel}
                  getDuplicatedDocumentInformation={
                    getDuplicatedDocumentInformation
                  }
                  onDuplicatedDocumentsAdded={registerDuplicatedDocuments}
                />
                {showDivider && <Divider className="mb-6 border-grey-3" />}
              </Fragment>
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
              onDuplicatedDocumentsAdded={registerDuplicatedDocuments}
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
                    duplicatedDocumentInformation={getDuplicatedDocumentInformation(
                      preuve
                    )}
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
