import { UserDetails } from '@/api/users/user-details.fetch.server';
import InvitationModal from '@/app/app/pages/collectivite/Users/invitation/invitation-modal';
import LinkTagToAccountModal from '@/app/app/pages/collectivite/Users/link-tag-to-account/link-tag-to-account-modal';
import { Tag } from '@/app/app/pages/collectivite/Users/tags-liste/use-tags-list';
import {
  SendInvitationArgs,
  SendInvitationData,
} from '@/app/app/pages/collectivite/Users/useSendInvitation';
import { CurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
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
  collectivite: CurrentCollectivite;
  currentUser: UserDetails;
  currentUserAccess: TNiveauAcces;
  sendData?: SendInvitationData;
  sendInvitation: (args: SendInvitationArgs) => void;
  refetch: () => void;
};

const TagsListeTableRow = ({
  tag,
  collectivite,
  currentUser,
  currentUserAccess,
  sendData,
  sendInvitation,
  refetch,
}: TagsListeTableRowProps) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { mutate: updateTag } = useTagUpdate({
    key: ['personnes', collectivite.collectiviteId],
    tagTableName: 'personne_tag',
    onSuccess: () => refetch(),
  });
  const { mutate: deleteTag } = useDeleteTag({
    key: ['personnes', collectivite.collectiviteId],
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
      <TRow className={rowClassnames}>
        {/* Tag pilote */}
        <TCell className={cellClassnames}>
          <div className="text-sm text-primary-10 font-bold">{tag.tagNom}</div>
          {isInvitationSent && (
            <div className="text-xs text-grey-8">{tag.email}</div>
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
                  onClick={() =>
                    tag.email &&
                    (isInvitationSent
                      ? sendInvitation({
                          invitationId: tag.invitationId,
                          email: tag.email,
                        })
                      : setIsInviteModalOpen(true))
                  }
                  disabled={!tag.email}
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
          </TCell>
        )}
      </TRow>

      <InvitationModal
        openState={{
          isOpen: isInviteModalOpen,
          setIsOpen: setIsInviteModalOpen,
        }}
        collectivite={collectivite}
        currentUser={currentUser}
        niveauAcces={currentUserAccess}
        sendData={sendData}
        tagIds={[tag.tagId]}
      />

      {isLinkModalOpen && (
        <LinkTagToAccountModal
          openState={{
            isOpen: isLinkModalOpen,
            setIsOpen: setIsLinkModalOpen,
          }}
          tag={tag}
          collectivite={collectivite}
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
              collectiviteId: collectivite.collectiviteId,
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
          message="En confirmant la suppression, cela supprimera également l’association de ce tag aux fiches action, indicateurs et mesures des référentiels."
          onDelete={() => deleteTag(tag.tagId)}
        />
      )}
    </>
  );
};

export default TagsListeTableRow;
