import { Tag } from '@/app/app/pages/collectivite/Users/tags-liste/tags-liste-table';
import { TNiveauAcces } from '@/app/types/alias';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { useDeleteTag, useTagUpdate } from '@/app/ui/dropdownLists/tags';
import {
  Badge,
  Button,
  DeleteOptionModal,
  TCell,
  TRow,
  Tooltip,
  UpdateOptionModal,
} from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';

type TagsListeTableRowProps = {
  tag: Tag;
  collectiviteId: number;
  currentUserAccess: TNiveauAcces;
  refetch: () => void;
};

const TagsListeTableRow = ({
  tag,
  collectiviteId,
  currentUserAccess,
  refetch,
}: TagsListeTableRowProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { mutate: updateTag } = useTagUpdate({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
    onSuccess: () => refetch(),
  });
  const { mutate: deleteTag } = useDeleteTag({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
    onSuccess: () => refetch(),
  });

  const rowClassnames = 'h-20';
  const cellClassnames = '!py-3 !px-4 !border-r-0';

  const isAdmin = currentUserAccess === 'admin';
  const isEditor = currentUserAccess === 'edition';

  const isInvitationSent = false;

  return (
    <>
      <TRow className={rowClassnames}>
        {/* Tag pilote */}
        <TCell className={cellClassnames}>
          <div className="text-sm text-primary-10 font-bold">{tag.nom}</div>
          {isInvitationSent && (
            <div className="text-xs text-grey-8">email@test.fr</div>
          )}
        </TCell>

        {/* Statut */}
        <TCell className={classNames(cellClassnames, 'w-56')}>
          <div className="flex justify-center items-center">
            {isInvitationSent && (
              <Badge
                title="Invitation envoyée"
                icon="hourglass-line"
                iconPosition="left"
                state="warning"
                size="sm"
              />
            )}
          </div>
        </TCell>

        {/* Actions */}
        {(isAdmin || isEditor) && (
          <TCell className={classNames(cellClassnames, 'w-56')}>
            <div className="flex gap-2 justify-center items-center">
              <Tooltip
                label={
                  isInvitationSent
                    ? "Renvoyer l'invitation"
                    : 'Inviter à créer un compte'
                }
              >
                <Button
                  size="xs"
                  variant="grey"
                  icon="mail-send-line"
                  onClick={() => {}}
                  disabled
                />
              </Tooltip>
              <Tooltip label="Associer ce tag à un compte">
                <Button
                  size="xs"
                  variant="grey"
                  icon="user-add-line"
                  onClick={() => {}}
                  // disabled={isInvitationSent}
                  disabled
                />
              </Tooltip>
              <Tooltip label="Éditer">
                <Button
                  size="xs"
                  variant="grey"
                  icon="edit-line"
                  onClick={() => setIsEditModalOpen(true)}
                />
              </Tooltip>
              {isAdmin && (
                <Tooltip label="Supprimer">
                  <DeleteButton
                    size="xs"
                    onClick={() => setIsDeleteModalOpen(true)}
                  />
                </Tooltip>
              )}
            </div>
          </TCell>
        )}
      </TRow>

      {isEditModalOpen && (
        <UpdateOptionModal
          openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
          tagName={tag.nom}
          title="Editer le tag pilote"
          fieldTitle="Nom du tag"
          onSave={(tagName) =>
            updateTag({
              collectiviteId,
              id: tag.tagId,
              nom: tagName,
            })
          }
        />
      )}

      {isDeleteModalOpen && (
        <DeleteOptionModal
          openState={{
            isOpen: isDeleteModalOpen,
            setIsOpen: setIsDeleteModalOpen,
          }}
          tagName={tag.nom}
          title="Supprimer un tag pilote"
          message="En confirmant la suppression, cela supprimera également l’association de ce tag aux fiches action, indicateurs et mesures des référentiels."
          onDelete={() => deleteTag(tag.tagId)}
        />
      )}
    </>
  );
};

export default TagsListeTableRow;
