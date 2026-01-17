import {
  PAGE_SIZE,
  useCollectiviteMembres,
} from '@/app/app/pages/collectivite/Users/useCollectiviteMembres';
import { useUpdateCollectiviteMembre } from '@/app/app/pages/collectivite/Users/useUpdateCollectiviteMembre';
import { CollectiviteRole } from '@tet/domain/users';
import {
  DEPRECATED_Table,
  DEPRECATED_TBody,
  DEPRECATED_TCell,
  DEPRECATED_THead,
  DEPRECATED_THeadCell,
  DEPRECATED_TRow,
  Pagination,
} from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { SendInvitationArgs } from '../../_components/use-invite-member';
import MembresListeTableRow from './membres-liste-table-row';

export type MembreListTableProps = {
  collectiviteId: number;
  currentUserId: string;
  currentUserAccess: CollectiviteRole;
  sendInvitation: (args: SendInvitationArgs) => void;
};

const MembreListTable = ({
  collectiviteId,
  currentUserId,
  currentUserAccess,
  sendInvitation,
}: MembreListTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useCollectiviteMembres(currentPage);
  const { updateMembre } = useUpdateCollectiviteMembre();

  const { membres, count } = data;

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
                Nom et adresse mail
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Fonction
                <div className="text-xs font-normal">
                  dans cette collectivité
                </div>
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                {"Champ d'intervention"}
                <div className="text-xs font-normal">
                  dans cette collectivité
                </div>
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Intitulé de poste
                <div className="text-xs font-normal">
                  dans cette collectivité
                </div>
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell
                className={classNames(headCellClassnames, 'text-left')}
              >
                Accès
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell className={headCellClassnames}>
                Statut
              </DEPRECATED_THeadCell>
              <DEPRECATED_THeadCell className={headCellClassnames}>
                Actions
              </DEPRECATED_THeadCell>
            </DEPRECATED_TRow>
          </DEPRECATED_THead>

          <DEPRECATED_TBody>
            {isLoading ? (
              // Chargement
              <DEPRECATED_TRow data-test="Loading">
                <DEPRECATED_TCell colSpan={6}>
                  <div className="text-center py-4 text-grey-8">
                    Chargement...
                  </div>
                </DEPRECATED_TCell>
              </DEPRECATED_TRow>
            ) : membres ? (
              // Liste des membres
              membres.map((membre) => (
                <MembresListeTableRow
                  key={membre.email}
                  collectiviteId={collectiviteId}
                  membre={membre}
                  currentUserAccess={currentUserAccess}
                  currentUserId={currentUserId}
                  updateMembre={updateMembre}
                  sendInvitation={sendInvitation}
                />
              ))
            ) : (
              // Liste vide
              <DEPRECATED_TRow>
                <DEPRECATED_TCell colSpan={6}>
                  <div className="text-center py-4 text-grey-8">
                    {"Aucun membre n'est rattaché à cette collectivité"}
                  </div>
                </DEPRECATED_TCell>
              </DEPRECATED_TRow>
            )}
          </DEPRECATED_TBody>
        </DEPRECATED_Table>
      </div>
      {/* Pagination */}
      <Pagination
        className="mx-auto mt-8"
        selectedPage={currentPage}
        nbOfElements={count}
        maxElementsPerPage={PAGE_SIZE}
        idToScrollTo="app-header"
        onChange={setCurrentPage}
      />
    </>
  );
};

export default MembreListTable;
