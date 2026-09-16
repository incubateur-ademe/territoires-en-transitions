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
import AlerteSuppression from './AlerteSuppression';
import { CarteDocumentAction } from './carte-document-action';
import { CarteDocumentProvider } from './carte-document.context';
import {
  Actions,
  Author,
  Comment,
  Duplicate,
  Identifier,
  Title,
  VisitDate,
} from './carte-document.slots';
import { EditerDocumentModal } from './EditerDocumentModal';
import { EditerLienModal } from './EditerLienModal';
import { Preuve } from './types';
import { useOpenPreuve } from './use-open-preuve';
import { useEditPreuve } from './useEditPreuve';
import { useReplaceAuditReportFile } from './useReplaceAuditReportFile';

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
      `CarteDocument only accepts its own slots as direct children, got ${describeChild(
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
      `CarteDocument renders each of its slots at most once, got ${describeChild(
        duplicatedSlot
      )} twice`
    );
  }

  return slots;
};

type CarteDocumentProps = {
  document: Preuve;
  children: ReactNode;
};

const CarteDocument = ({
  document,
  children,
}: CarteDocumentProps): JSX.Element | null => {
  const openPreuve = useOpenPreuve({ collectiviteId: document.collectiviteId });
  const { remove, editComment } = useEditPreuve(document);
  const replaceAuditReport = useReplaceAuditReportFile(document.collectiviteId);
  const [openAction, setOpenAction] = useState<CarteDocumentAction | null>(
    null
  );
  const closeAction = () => setOpenAction(null);

  const { fichier, lien } = document;
  const slots = toSlots(children);
  const slotOfType = (type: ElementType): ReactNode =>
    slots.find((slot) => slot.type === type);

  if (!fichier && !lien) return null;

  return (
    <CarteDocumentProvider
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
    </CarteDocumentProvider>
  );
};

CarteDocument.Title = Title;
CarteDocument.Identifier = Identifier;
CarteDocument.Author = Author;
CarteDocument.Duplicate = Duplicate;
CarteDocument.Comment = Comment;
CarteDocument.VisitDate = VisitDate;
CarteDocument.Actions = Actions;

export default CarteDocument;
