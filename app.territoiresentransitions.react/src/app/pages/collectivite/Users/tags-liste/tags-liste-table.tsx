import { RouterOutput } from '@/api/utils/trpc/client';
import TagsListeTableRow from '@/app/app/pages/collectivite/Users/tags-liste/tags-liste-table-row';
import { PAGE_SIZE } from '@/app/app/pages/collectivite/Users/useCollectiviteMembres';
import { TNiveauAcces } from '@/app/types/alias';
import { usePersonneListe } from '@/app/ui/dropdownLists/PersonnesDropdown/usePersonneListe';
import { Pagination, TBody, TCell, THead, THeadCell, TRow, Table } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';

export type Tag = RouterOutput['collectivites']['personnes']['list'][1];

export type TagsListeTableProps = {
  currentUserAccess: TNiveauAcces;
};

const TagsListeTable = ({ currentUserAccess }: TagsListeTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = usePersonneListe();

  const tags: Tag[] | undefined = data
    ?.filter((d: Tag) => !d.userId)
    .sort((a: Tag, b: Tag) => {
      const nameA = a.nom.toUpperCase();
      const nameB = b.nom.toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
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
                  key={tag.tagId}
                  tag={tag}
                  currentUserAccess={currentUserAccess}
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

      {/* Pagination */}
      <Pagination
        className="mx-auto mt-8"
        selectedPage={currentPage}
        nbOfElements={tags?.length ?? 0}
        maxElementsPerPage={PAGE_SIZE}
        idToScrollTo="app-header"
        onChange={setCurrentPage}
      />
    </>
  );
};

export default TagsListeTable;
