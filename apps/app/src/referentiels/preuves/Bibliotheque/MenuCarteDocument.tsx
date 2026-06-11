import { appLabels } from '@/app/labels/catalog';
import { AddPreuveModal } from '@/app/referentiels/preuves/AddPreuveModal';
import { EditerDocumentModal } from '@/app/referentiels/preuves/Bibliotheque/EditerDocumentModal';
import { TPreuve } from '@/app/referentiels/preuves/Bibliotheque/types';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Button, Modal } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { EditerLienModal } from './EditerLienModal';
import { useReplaceAuditReportFile } from './useReplaceAuditReportFile';

type MenuCarteDocumentProps = {
  document: Pick<
    TPreuve,
    'id' | 'fichier' | 'lien' | 'collectivite_id' | 'preuve_type' | 'audit'
  >;
  className?: string;
  onComment: () => void;
  onDelete: () => void;
};

const MenuCarteDocument = ({
  document,
  className,
  onComment,
  onDelete,
}: MenuCarteDocumentProps) => {
  const { fichier, lien } = document;
  const [isOpen, setIsOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const isAuditReport = document.preuve_type === 'audit';
  const replaceFile = useReplaceAuditReportFile(
    document.collectivite_id,
    document.audit?.id
  );

  if (!fichier && !lien) return null;

  return (
    <>
      <div className={classNames('flex gap-2', className)}>
        {/* Modifier le titre du document */}
        <Button
          data-test="btn-edit"
          icon="edit-line"
          title={fichier ? appLabels.editerDocument : appLabels.editerLien}
          variant="grey"
          size="xs"
          onClick={() => setIsOpen(true)}
        />
        {isOpen &&
          (fichier ? (
            <EditerDocumentModal
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              preuve={document}
            />
          ) : (
            <EditerLienModal
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              preuve={document}
            />
          ))}

        {isAuditReport && fichier && (
          <Modal
            size="lg"
            openState={{ isOpen: isReplaceOpen, setIsOpen: setIsReplaceOpen }}
            title={appLabels.remplacerLeFichier}
            render={({ close }) => (
              <AddPreuveModal
                onClose={close}
                handlers={{
                  addFileFromLib: async (fichierId) => {
                    await replaceFile.mutateAsync({
                      preuveId: document.id,
                      fichierId,
                    });
                    close();
                  },
                }}
              />
            )}
          >
            <Button
              data-test="btn-replace"
              icon="file-transfer-line"
              title={appLabels.remplacerLeFichier}
              variant="grey"
              size="xs"
              onClick={() => setIsReplaceOpen(true)}
            />
          </Modal>
        )}

        {/* Commenter */}
        <Button
          data-test="btn-comment"
          icon="discuss-line"
          title={appLabels.commenter}
          variant="grey"
          size="xs"
          onClick={onComment}
        />

        {/* Supprimer le document */}
        <DeleteButton
          data-test="btn-delete"
          title={appLabels.supprimer}
          size="xs"
          onClick={onDelete}
        />
      </div>
    </>
  );
};

export default MenuCarteDocument;
