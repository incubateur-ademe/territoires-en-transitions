import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { Card, Modal, Notification, Tooltip, VisibleWhen } from '@tet/ui';
import {
  Children,
  ElementType,
  isValidElement,
  JSX,
  ReactElement,
  ReactNode,
  useState,
} from 'react';
import { DeleteConfirmationAlert } from '../delete-confirmation.alert';
import { DocumentCardAction } from './action';
import { DocumentCardProvider } from './context';
import {
  Actions,
  Author,
  Comment,
  Duplicate,
  Identifier,
  Title,
  VisitDate,
} from './slots';
import { EditDocumentModal } from '../edit-document.modal';
import { Preuve } from '../types';
import { useOpenPreuve } from '../use-open-preuve';
import { useEditPreuve } from '../use-edit-preuve';
import { useReplaceAuditReportFile } from '../use-replace-audit-report-file';

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

const describeChild = (child: ReactNode): string => {
  if (!isValidElement(child)) {
    return String(child);
  }
  const { type } = child;
  if (typeof type === 'string') {
    return `<${type}>`;
  }
  if (typeof type === 'function') {
    return 'displayName' in type && typeof type.displayName === 'string'
      ? type.displayName
      : type.name;
  }
  return 'an anonymous component';
};

const SLOTS: readonly unknown[] = [
  Actions,
  Author,
  Comment,
  Duplicate,
  Identifier,
  Title,
  VisitDate,
];

const isRenderedAsNothing = (child: ReactNode): boolean =>
  child === null ||
  child === undefined ||
  typeof child === 'boolean' ||
  child === '';

const isSlot = (child: ReactNode): child is ReactElement =>
  isValidElement(child) && SLOTS.includes(child.type);

const toSlots = (children: ReactNode): ReactElement[] => {
  const childList: ReactNode[] = [];
  Children.forEach(children, (child) => childList.push(child));

  const renderedChildren = childList.filter(
    (child) => !isRenderedAsNothing(child)
  );
  const unknownChild = renderedChildren.find((child) => !isSlot(child));
  if (unknownChild !== undefined) {
    throw new Error(
      `DocumentCard only accepts its own slots as direct children, got ${describeChild(
        unknownChild
      )}`
    );
  }

  const slots = renderedChildren.filter(isSlot);
  const duplicatedSlot = slots.find(
    (slot, index) =>
      slots.findIndex((other) => other.type === slot.type) !== index
  );
  if (duplicatedSlot !== undefined) {
    throw new Error(
      `DocumentCard renders each of its slots at most once, got ${describeChild(
        duplicatedSlot
      )} twice`
    );
  }

  return slots;
};

type DocumentCardProps = {
  document: Preuve;
  children: ReactNode;
};

export const DocumentCard = ({
  document,
  children,
}: DocumentCardProps): JSX.Element | null => {
  const openPreuve = useOpenPreuve({ collectiviteId: document.collectiviteId });
  const { remove, editComment } = useEditPreuve(document);
  const replaceAuditReport = useReplaceAuditReportFile(document.collectiviteId);
  const [openAction, setOpenAction] = useState<DocumentCardAction | null>(null);
  const closeAction = () => setOpenAction(null);

  const { fichier, lien } = document;
  const slots = toSlots(children);
  const slotOfType = (type: ElementType): ReactNode =>
    slots.find((slot) => slot.type === type);

  if (!fichier && !lien) return null;

  return (
    <DocumentCardProvider
      value={{
        document,
        open: () => openPreuve(document),
        editComment,
        setOpenAction,
      }}
    >
      <div className="relative group max-w-screen-md" data-test="carte-doc">
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
        {slotOfType(Actions)}

        <Card className="p-4 h-full gap-1">
          {slotOfType(Title)}
          {slotOfType(Identifier)}
          {slotOfType(Author)}
          {slotOfType(Duplicate)}
          {slotOfType(Comment)}
          {slotOfType(VisitDate)}
        </Card>
      </div>
      {openAction === 'delete' && (
        <DeleteConfirmationAlert
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
        <EditDocumentModal
          isOpen={openAction === 'edit'}
          setIsOpen={closeAction}
          document={document}
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
    </DocumentCardProvider>
  );
};

DocumentCard.Title = Title;
DocumentCard.Identifier = Identifier;
DocumentCard.Author = Author;
DocumentCard.Duplicate = Duplicate;
DocumentCard.Comment = Comment;
DocumentCard.VisitDate = VisitDate;
DocumentCard.Actions = Actions;
