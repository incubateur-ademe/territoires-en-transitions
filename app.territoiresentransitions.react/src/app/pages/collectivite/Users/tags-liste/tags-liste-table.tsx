import TagsListeTableRow from '@/app/app/pages/collectivite/Users/tags-liste/tags-liste-table-row';
import {
  Tag,
  useTagsList,
} from '@/app/app/pages/collectivite/Users/tags-liste/use-tags-list';
import {
  SendInvitationArgs,
  SendInvitationData,
} from '@/app/app/pages/collectivite/Users/useSendInvitation';
import { TNiveauAcces } from '@/app/types/alias';
import { TBody, TCell, THead, THeadCell, TRow, Table } from '@/ui';
import classNames from 'classnames';

export type TagsListeTableProps = {
  collectiviteId: number;
  currentUserAccess: TNiveauAcces;
  sendData?: SendInvitationData;
  sendInvitation: (args: SendInvitationArgs) => void;
};

const TagsListeTable = ({
  collectiviteId,
  currentUserAccess,
  sendData,
  sendInvitation,
}: TagsListeTableProps) => {
  const { data, isLoading, refetch } = useTagsList(collectiviteId);

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
        <Table className="min-w-full bg-white">
          <THead>
            <TRow>
              <THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Tag pilote
              </THeadCell>
              <THeadCell className={headCellClassnames}>Statut</THeadCell>
              {(isAdmin || isEditor) && (
                <THeadCell className={headCellClassnames}>Actions</THeadCell>
              )}
            </TRow>
          </THead>

          <TBody>
            {isLoading ? (
              // Chargement
              <TRow data-test="Loading">
                <TCell colSpan={3}>
                  <div className="text-center py-4 text-grey-8">
                    Chargement...
                  </div>
                </TCell>
              </TRow>
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
              <TRow>
                <TCell colSpan={3}>
                  <div className="text-center py-4 text-grey-8">
                    Aucun tag pilote n'est défini dans cette collectivité
                  </div>
                </TCell>
              </TRow>
            )}
          </TBody>
        </Table>
      </div>
    </>
  );
};

export default TagsListeTable;
