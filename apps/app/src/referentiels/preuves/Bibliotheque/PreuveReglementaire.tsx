import { AddPreuveReglementaire } from '@/app/referentiels/preuves/AddPreuveReglementaire';
import { InfoTooltip, VisibleWhen } from '@tet/ui';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import type { OnDuplicatedDocumentsAdded } from '../AddPreuveModal/types';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import { IdentifiantAction } from './IdentifiantAction';
import PreuveDoc from './PreuveDoc';
import { DocumentReglementaire, Preuve } from './types';

export type PreuveReglementaireProps = {
  preuves: DocumentReglementaire[];
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
    preuves,
    hideIdentifier,
    displayInPanel,
    getDuplicatedDocumentInformation,
    onDuplicatedDocumentsAdded,
  } = props;

  // n'affiche rien quand la liste est vide
  if (!preuves.length) {
    return null;
  }

  // lit les informations du 1er item (identiques aux suivants)
  const first = preuves[0];
  const { action, preuve_reglementaire, fichier, lien } = first;
  const { id: preuve_id, nom, description } = preuve_reglementaire;
  const haveDoc = !!fichier || !!lien;

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
          preuve_id={preuve_id}
          actionId={action.action_id}
          onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
        />
      </div>
      {/* Liens vers les documents */}
      {haveDoc && (
        <div>
          <div
            className={classNames('grid gap-5', {
              'md:grid-cols-2 lg:grid-cols-3': !displayInPanel,
            })}
          >
            {preuves.map((preuve) => (
              <PreuveDoc
                key={preuve.id}
                preuve={preuve as Preuve}
                duplicatedDocumentInformation={getDuplicatedDocumentInformation?.(
                  preuve
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
