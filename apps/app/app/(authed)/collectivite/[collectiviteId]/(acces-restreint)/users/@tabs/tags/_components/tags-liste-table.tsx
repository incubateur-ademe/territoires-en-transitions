import { CollectiviteAccessLevel } from '@/domain/users';
import {
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_THeadCell,
  DEPRECATED_TRow,
} from '@/ui';
import classNames from 'classnames';
import {
  SendInvitationArgs,
  SendInvitationData,
} from '../../../_components/use-invite-member';
import { Tag, useListTags } from '../../../_components/use-list-tags';
import TagsListeTableRow from './tags-liste-table-row';

export type TagsListeTableProps = {
  collectiviteId: number;
  currentUserAccess: CollectiviteAccessLevel;
  sendData?: SendInvitationData;
  sendInvitation: (args: SendInvitationArgs) => void;
};

export const TagsListeTable = ({
  collectiviteId,
  currentUserAccess,
  sendData,
  sendInvitation,
}: TagsListeTableProps) => {
  const { data, isLoading, refetch } = useListTags(collectiviteId);

  const tags: Tag[] | undefined = data
    ?.sort((a: Tag, b: Tag) => {
      const nameA = a.tagNom.toUpperCase();
      const nameB = b.tagNom.toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    })
    .sort((a: Tag, b: Tag) => {
      if (a.email && !b.email) return -1;
      if (!a.email && b.email) return 1;
      return 0;
    });

  const isAdmin = currentUserAccess === 'admin';
  const isEditor = currentUserAccess === 'edition';

  const headCellClassnames =
    'whitespace-nowrap !text-sm !py-3 !px-4 !border-r-0';

  return (
    <>
      <div className="overflow-x-auto">
        <DEPRECATED_Table className="min-w-full bg-white">
          <DEPRECATED_THead>
            <DEPRECATED_TRow>
              <DEPRECATED_THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Tag pilote
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell className={headCellClassnames}>
                Statut
              </DEPRECATED_THeadCell>
              {(isAdmin || isEditor) && (
                <DEPRECATED_THeadCell className={headCellClassnames}>
                  Actions
                </DEPRECATED_THeadCell>
              )}
            </DEPRECATED_TRow>
          </DEPRECATED_THead>

          <DEPRECATED_TBody>
            {isLoading ? (
              // Chargement
              <DEPRECATED_TRow data-test="Loading">
                <DEPRECATED_TCell colSpan={3}>
                  <div className="text-center py-4 text-grey-8">
                    Chargement...
                  </div>
                </DEPRECATED_TCell>
              </DEPRECATED_TRow>
            ) : tags && tags.length > 0 ? (
              // Liste des tags
              tags.map((tag) => (
                <TagsListeTableRow
                  key={`${tag.tagId}-${tag.email}`}
                  tag={tag}
                  collectiviteId={collectiviteId}
                  currentUserAccess={currentUserAccess}
                  sendData={sendData}
                  sendInvitation={sendInvitation}
                  refetch={refetch}
                />
              ))
            ) : (
              // Liste vide
              <DEPRECATED_TRow>
                <DEPRECATED_TCell colSpan={3}>
                  <div className="text-center py-4 text-grey-8">
                    {"Aucun tag pilote n'est défini dans cette collectivité"}
                  </div>
                </DEPRECATED_TCell>
              </DEPRECATED_TRow>
            )}
          </DEPRECATED_TBody>
        </DEPRECATED_Table>
      </div>
    </>
  );
};
