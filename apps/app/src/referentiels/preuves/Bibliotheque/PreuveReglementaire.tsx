import { AddPreuveReglementaire } from '@/app/referentiels/preuves/AddPreuveReglementaire';
import { InfoTooltip, VisibleWhen } from '@tet/ui';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import type { OnDuplicatedDocumentsAdded } from '../AddPreuveModal/types';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import { IdentifiantAction } from './IdentifiantAction';
import PreuveDoc from './PreuveDoc';
import { DocumentAttendu, DocumentReglementaire } from './types';

export type PreuveReglementaireProps = {
  attendu: DocumentAttendu;
  hideIdentifier?: boolean;
  displayInPanel?: boolean;
  getDuplicatedDocumentInformation?: (
    preuve: DocumentReglementaire
  ) => DuplicatedDocumentInformation | undefined;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
};

/**
 * Affiche une preuve règlementaire et les éventuels documents associés
 */
export const PreuveReglementaire = (props: PreuveReglementaireProps) => {
  const {
    attendu,
    hideIdentifier,
    displayInPanel,
    getDuplicatedDocumentInformation,
    onDuplicatedDocumentsAdded,
  } = props;
  const { action, preuve_reglementaire: definition, documents } = attendu;
  const { id: preuveId, nom, description } = definition;

  return (
    <div className="flex flex-col gap-5 pb-5">
      <div
        className="flex items-center justify-between gap-4"
        data-test="preuve"
      >
        {/* Titre du document + Identifiant de l'action associée */}
        <span
          data-test="desc"
          className="text-sm text-primary-9 font-bold flex flex-wrap gap-2 items-center uppercase max-w-80"
        >
          {nom}{' '}
          <VisibleWhen condition={!hideIdentifier}>
            <IdentifiantAction identifiant={action.identifiant} />
          </VisibleWhen>
          {description && (
            <InfoTooltip
              label={
                <div
                  className="max-w-sm [&_*]:leading-4"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(description),
                  }}
                />
              }
              activatedBy="click"
            />
          )}
        </span>

        {/* Modale d'ajout de documents */}
        <AddPreuveReglementaire
          preuve_id={preuveId}
          actionId={action.action_id}
          onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
        />
      </div>
      {/* Liens vers les documents */}
      <VisibleWhen condition={documents.length > 0}>
        <div>
          <div
            className={classNames('grid gap-5', {
              'md:grid-cols-2 lg:grid-cols-3': !displayInPanel,
            })}
          >
            {documents.map((preuve) => (
              <PreuveDoc
                key={preuve.id}
                preuve={preuve}
                duplicatedDocumentInformation={getDuplicatedDocumentInformation?.(
                  preuve
                )}
              />
            ))}
          </div>
        </div>
      </VisibleWhen>
    </div>
  );
};
