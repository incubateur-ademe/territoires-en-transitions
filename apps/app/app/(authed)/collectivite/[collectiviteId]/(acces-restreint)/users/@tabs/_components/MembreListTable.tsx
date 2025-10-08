import { useMembres } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { useUpdateMembres } from '@/app/referentiels/tableau-de-bord/referents/useUpdateMembres';
import { TNiveauAcces } from '@/app/types/alias';
import { Pagination, TBody, TCell, THead, THeadCell, TRow, Table } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { SendInvitationArgs } from '../../_components/use-invite-member';
import MembresListeTableRow from './membres-liste-table-row';

export type MembreListTableProps = {
  collectiviteId: number;
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  sendInvitation: (args: SendInvitationArgs) => void;
};

const MembreListTable = ({
  collectiviteId,
  currentUserId,
  currentUserAccess,
  sendInvitation,
}: MembreListTableProps) => {
  const PAGE_SIZE = 30;

  const [currentPage, setCurrentPage] = useState(1);

  const { data: membresResponse, isLoading } = useMembres({
    collectiviteId,
    queryOptions: {
      page: currentPage,
      limit: PAGE_SIZE,
    },
    inclureInvitations: true,
  });
  const { mutate: updateMembres } = useUpdateMembres();

  const membres = membresResponse?.data;
  const count = membresResponse?.count;

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
                Nom et adresse mail
              </THeadCell>
              <THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Fonction
                <div className="text-xs font-normal">
                  dans cette collectivité
                </div>
              </THeadCell>
              <THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                {"Champ d'intervention"}
                <div className="text-xs font-normal">
                  dans cette collectivité
                </div>
              </THeadCell>
              <THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Intitulé de poste
                <div className="text-xs font-normal">
                  dans cette collectivité
                </div>
              </THeadCell>
              <THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Accès
              </THeadCell>
              <THeadCell className={headCellClassnames}>Statut</THeadCell>
              <THeadCell className={headCellClassnames}>Actions</THeadCell>
            </TRow>
          </THead>

          <TBody>
            {isLoading ? (
              // Chargement
              <TRow data-test="Loading">
                <TCell colSpan={6}>
                  <div className="text-center py-4 text-grey-8">
                    Chargement...
                  </div>
                </TCell>
              </TRow>
            ) : membres ? (
              // Liste des membres
              membres.map((membre) => (
                <MembresListeTableRow
                  key={membre.email}
                  collectiviteId={collectiviteId}
                  membre={membre}
                  currentUserAccess={currentUserAccess}
                  currentUserId={currentUserId}
                  updateMembres={updateMembres}
                  sendInvitation={sendInvitation}
                />
              ))
            ) : (
              // Liste vide
              <TRow>
                <TCell colSpan={6}>
                  <div className="text-center py-4 text-grey-8">
                    {"Aucun membre n'est rattaché à cette collectivité"}
                  </div>
                </TCell>
              </TRow>
            )}
          </TBody>
        </Table>
      </div>
      {/* Pagination */}
      {count && (
        <Pagination
          className="mx-auto mt-8"
          selectedPage={currentPage}
          nbOfElements={count}
          maxElementsPerPage={PAGE_SIZE}
          idToScrollTo="app-header"
          onChange={setCurrentPage}
        />
      )}
    </>
  );
};

export default MembreListTable;
