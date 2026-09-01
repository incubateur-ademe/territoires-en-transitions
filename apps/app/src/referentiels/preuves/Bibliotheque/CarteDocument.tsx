import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import {
  getTextFormattedDate,
  getTruncatedText,
} from '@/app/utils/formatUtils';
import {
  Button,
  Card,
  Icon,
  Modal,
  Notification,
  Tooltip,
  VisibleWhen,
} from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import type { DuplicatedDocumentInformation } from '../duplicated-document-state.utils';
import AlerteSuppression from './AlerteSuppression';
import {
  CarteDocumentAction,
  isActionCarriedBy,
} from './carte-document-action';
import DocumentInput from './DocumentInput';
import { ReclassifyDocumentModal } from '@/app/referentiels/documents/reclassify-document/reclassify-document.modal';
import { DuplicatedDocumentAlert } from './duplicated-document.alert';
import { EditerDocumentModal } from './EditerDocumentModal';
import { EditerLienModal } from './EditerLienModal';
import MenuCarteDocument from './MenuCarteDocument';
import { openPreuve } from './openPreuve';
import { Preuve } from './types';
import { useEditPreuve } from './useEditPreuve';
import { useReplaceAuditReportFile } from './useReplaceAuditReportFile';
import { getAuthorAndDate, getFormattedTitle } from './utils';

const EditPreuveModal = ({
  isOpen,
  setIsOpen,
  preuve,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  preuve: Preuve;
}) =>
  preuve.fichier ? (
    <EditerDocumentModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      preuve={preuve}
    />
  ) : (
    <EditerLienModal isOpen={isOpen} setIsOpen={setIsOpen} preuve={preuve} />
  );

const ReplaceAuditReportModal = ({
  isOpen,
  setIsOpen,
  onReplace,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onReplace: (fichierId: number) => Promise<void>;
}) => (
  <Modal
    size="lg"
    openState={{ isOpen, setIsOpen }}
    title={appLabels.remplacerLeFichier}
    render={({ close }) => (
      <AddPreuveModal
        onClose={close}
        handlers={{ addFileFromLib: onReplace }}
      />
    )}
  />
);

type CarteDocumentProps = {
  document: Preuve;
  allowedActions: readonly CarteDocumentAction[];
  displayIdentifier?: boolean;
  classComment?: string;
  duplicatedDocumentInformation?: DuplicatedDocumentInformation;
};

const CarteDocument = ({
  document,
  allowedActions,
  displayIdentifier,
  classComment,
  duplicatedDocumentInformation,
}: CarteDocumentProps) => {
  const {
    commentaire,
    created_at: dateCreation,
    created_by_nom: auteur,
    fichier,
    lien,
    action,
    rapport,
  } = document;
  const dateVisite = rapport?.date;
  const replaceAuditReport = useReplaceAuditReportFile(
    document.collectivite_id
  );

  const shownActions = allowedActions.filter((allowedAction) =>
    isActionCarriedBy(allowedAction, document.preuve_type)
  );
  const isShown = (action: CarteDocumentAction) =>
    shownActions.includes(action);

  const handlers = useEditPreuve(document);
  const { remove, editComment } = handlers;

  const [openAction, setOpenAction] = useState<CarteDocumentAction | null>(
    null
  );
  const closeAction = () => setOpenAction(null);
  const [isFullCommentaire, setIsFullCommentaire] = useState(false);
  const isEditingComment = editComment.isEditing;

  const { truncatedText: truncatedCom, isTextTruncated: isComTruncated } =
    getTruncatedText(commentaire, 160);

  if (!fichier && !lien) return null;

  return (
    <>
      <div
        className={classNames('relative group max-w-screen-md')}
        data-test="carte-doc"
      >
        {fichier?.confidentiel && (
          <Tooltip label={appLabels.fichierModePrive}>
            <div
              data-test="carte-doc-confidentiel"
              className="absolute -top-3 left-5"
            >
              <Notification icon="lock-fill" size="xs" classname="w-6 h-6" />
            </div>
          </Tooltip>
        )}
        {shownActions.length > 0 && !isEditingComment && (
          <MenuCarteDocument
            document={document}
            className="absolute top-4 right-4 invisible group-hover:visible"
            actions={{
              edit: isShown('edit') ? () => setOpenAction('edit') : undefined,
              comment: isShown('comment')
                ? () => editComment.enter()
                : undefined,
              replace: isShown('replace')
                ? () => setOpenAction('replace')
                : undefined,
              reclassify: isShown('reclassify')
                ? () => setOpenAction('reclassify')
                : undefined,
              delete: isShown('delete')
                ? () => setOpenAction('delete')
                : undefined,
            }}
          />
        )}

        <Card className="p-4 h-full gap-1">
          <span
            className="text-primary-9 hover:text-primary-8 transition text-base font-bold cursor-pointer"
            data-test="name"
            title={
              fichier ? appLabels.telechargerFichier : appLabels.ouvrirLien
            }
            onClick={() => openPreuve(document)}
          >
            {getFormattedTitle(document)}
          </span>

          {displayIdentifier && action && (
            <span className="text-grey-6 leading-6 flex gap-2">
              {action.identifiant}
            </span>
          )}

          <span className="text-grey-8 text-sm font-medium">
            {getAuthorAndDate(dateCreation, auteur)}
          </span>

          {duplicatedDocumentInformation && (
            <DuplicatedDocumentAlert
              storedFilenameKept={
                duplicatedDocumentInformation.storedFilenameKept
              }
            />
          )}

          {!isEditingComment ? (
            !!commentaire &&
            commentaire.length > 0 && (
              <div className="flex flex-col gap-2 leading-5">
                <div className="h-px bg-primary-3" />
                <div className="flex gap-1 items-start">
                  <Icon
                    icon="discuss-line"
                    size="xs"
                    className="text-grey-7 mt-0.5"
                  />
                  <span
                    className={classNames(
                      'text-grey-8 text-xs font-medium italic whitespace-pre-wrap',
                      classComment
                    )}
                    data-test="comment"
                  >
                    {isFullCommentaire || !isComTruncated
                      ? commentaire
                      : truncatedCom}
                  </span>
                </div>
                {isComTruncated && (
                  <Button
                    variant="underlined"
                    size="xs"
                    className="ml-auto"
                    onClick={() =>
                      setIsFullCommentaire((prevState) => !prevState)
                    }
                  >
                    {isFullCommentaire
                      ? appLabels.voirMoins
                      : appLabels.voirPlus}
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-2 leading-5">
              <div className="h-px bg-primary-3" />
              <DocumentInput editElement={editComment} type="textarea" />
            </div>
          )}

          {!!dateVisite && (
            <p className="text-xs text-grey-8 font-normal mb-1 pl-2">
              {appLabels.visiteEffectuee({
                dateVisite: getTextFormattedDate({ date: dateVisite }),
              })}
            </p>
          )}
        </Card>
      </div>

      {document.preuve_type === 'labellisation' && (
        <VisibleWhen condition={openAction === 'reclassify'}>
          <ReclassifyDocumentModal
            preuveId={document.id}
            collectiviteId={document.collectivite_id}
            objet={document.objet}
            isOpen={openAction === 'reclassify'}
            setIsOpen={closeAction}
          />
        </VisibleWhen>
      )}
      {openAction === 'delete' && (
        <AlerteSuppression
          isOpen={true}
          setIsOpen={closeAction}
          title={appLabels.supprimerDocument}
          message={appLabels.supprimerDocumentMessage}
          onDelete={() => {
            remove();
          }}
        />
      )}

      <VisibleWhen condition={openAction === 'edit'}>
        <EditPreuveModal
          isOpen={openAction === 'edit'}
          setIsOpen={closeAction}
          preuve={document}
        />
      </VisibleWhen>

      <VisibleWhen condition={openAction === 'replace'}>
        <ReplaceAuditReportModal
          isOpen={openAction === 'replace'}
          setIsOpen={closeAction}
          onReplace={async (fichierId) => {
            await replaceAuditReport.mutateAsync({
              preuveId: document.id,
              fichierId,
            });
          }}
        />
      </VisibleWhen>
    </>
  );
};

export default CarteDocument;
