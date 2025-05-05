import { Tag } from '@/app/app/pages/collectivite/Users/tags-liste/tags-liste-table';
import { TNiveauAcces } from '@/app/types/alias';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Badge, Button, TCell, TRow, Tooltip } from '@/ui';
import classNames from 'classnames';

type TagsListeTableRowProps = {
  tag: Tag;
  currentUserAccess: TNiveauAcces;
};

const TagsListeTableRow = ({
  tag,
  currentUserAccess,
}: TagsListeTableRowProps) => {
  const rowClassnames = 'h-20';
  const cellClassnames = '!py-3 !px-4 !border-r-0';

  const isAdmin = currentUserAccess === 'admin';
  const isEditor = currentUserAccess === 'edition';

  const isInvitationSent = false;

  return (
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
              />
            </Tooltip>
            <Tooltip label="Associer ce tag à un compte">
              <Button
                size="xs"
                variant="grey"
                icon="user-add-line"
                onClick={() => {}}
                disabled={isInvitationSent}
              />
            </Tooltip>
            <Tooltip label="Éditer">
              <Button
                size="xs"
                variant="grey"
                icon="edit-line"
                onClick={() => {}}
              />
            </Tooltip>
            {isAdmin && (
              <Tooltip label="Supprimer">
                <DeleteButton size="xs" onClick={() => {}} />
              </Tooltip>
            )}
          </div>
        </TCell>
      )}
    </TRow>
  );
};

export default TagsListeTableRow;
