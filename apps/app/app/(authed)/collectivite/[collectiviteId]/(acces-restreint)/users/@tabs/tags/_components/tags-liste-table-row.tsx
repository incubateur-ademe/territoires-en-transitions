import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { useDeleteTag, useTagUpdate } from '@/app/ui/dropdownLists/tags';
import { CollectiviteRole } from '@tet/domain/users';
import {
  Badge,
  Button,
  DeleteOptionModal,
  DEPRECATED_TCell,
  DEPRECATED_TRow,
  Tooltip,
  UpdateOptionModal,
} from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { InviteMemberModal } from '../../../_components/invite-member.modal';
import { SendInvitationArgs } from '../../../_components/use-invite-member';
import { Tag } from '../../../_components/use-list-tags';
import LinkTagToAccountModal from './link-tag-to-account-modal';

type TagsListeTableRowProps = {
  tag: Tag;
  collectiviteId: number;
  currentUserAccess: CollectiviteRole;
  sendInvitation: (args: SendInvitationArgs) => void;
  refetch: () => void;
};

const TagsListeTableRow = ({
  tag,
  collectiviteId,
  currentUserAccess,
  sendInvitation,
  refetch,
}: TagsListeTableRowProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
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

  const isInvitationSent = !!tag.email;

  return (
    <>
      <DEPRECATED_TRow className={rowClassnames}>
        {/* Tag pilote */}
        <DEPRECATED_TCell className={cellClassnames}>
          <div className="text-sm text-primary-10 font-bold">{tag.tagNom}</div>
          {isInvitationSent && (
            <div className="text-xs text-grey-8">{tag.email}</div>
          )}
        </DEPRECATED_TCell>

        {/* Statut */}
        <DEPRECATED_TCell className={classNames(cellClassnames, 'w-56')}>
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
        </DEPRECATED_TCell>

        {/* Actions */}
        {(isAdmin || isEditor) && (
          <DEPRECATED_TCell className={classNames(cellClassnames, 'w-56')}>
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
                  onClick={() =>
                    isInvitationSent
                      ? tag.email &&
                        sendInvitation({
                          invitationId: tag.invitationId ?? undefined,
                          email: tag.email,
                        })
                      : setIsInviteModalOpen(true)
                  }
                  disabled={isInvitationSent && !tag.email}
                />
              </Tooltip>

              <Tooltip label="Associer ce tag à un compte">
                <Button
                  size="xs"
                  variant="grey"
                  icon="user-add-line"
                  disabled={isInvitationSent}
                  onClick={() => setIsLinkModalOpen(true)}
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
          </DEPRECATED_TCell>
        )}
      </DEPRECATED_TRow>

      <InviteMemberModal
        openState={{
          isOpen: isInviteModalOpen,
          setIsOpen: setIsInviteModalOpen,
        }}
        tagIds={[tag.tagId]}
      />

      {isLinkModalOpen && (
        <LinkTagToAccountModal
          openState={{
            isOpen: isLinkModalOpen,
            setIsOpen: setIsLinkModalOpen,
          }}
          tag={tag}
          collectiviteId={collectiviteId}
        />
      )}

      {isEditModalOpen && (
        <UpdateOptionModal
          openState={{ isOpen: isEditModalOpen, setIsOpen: setIsEditModalOpen }}
          tagName={tag.tagNom}
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
          tagName={tag.tagNom}
          title="Supprimer un tag pilote"
          message="En confirmant la suppression, cela supprimera également l’association de ce tag aux actions, indicateurs et mesures des référentiels."
          onDelete={() => deleteTag(tag.tagId)}
        />
      )}
    </>
  );
};

export default TagsListeTableRow;
