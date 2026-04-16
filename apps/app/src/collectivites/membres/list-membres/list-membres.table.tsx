'use client';

import { appLabels } from '@/app/labels/catalog';
import { useListMembres } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { useUpdateMembre } from '@/app/collectivites/membres/use-update-membre';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  Table,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableLoading,
  TableRow,
  VisibleWhen,
} from '@tet/ui';
import ListMembresTableRow from './list-membres.table-row';

const MEMBRES_COLUMNS = [
  'nom',
  'fonction',
  'champ',
  'details',
  'acces',
  'actions',
];

export function ListmembresTable() {
  const { data: membres = [], isLoading: isLoadingMembres } = useListMembres();
  const { updateMembre } = useUpdateMembre();

  const { hasCollectivitePermission, user } = useCurrentCollectivite();

  const canMutateTags = hasCollectivitePermission('collectivites.tags.mutate');
  const canMutateMembres = hasCollectivitePermission(
    'collectivites.membres.mutate'
  );
  const isCurrentUserIncludedInMembres = membres.some(
    (membre) => membre.userId === user?.id
  );

  return (
    <section>
      <h2 className="text-lg font-bold text-primary-10 mb-3">
        {appLabels.membres}
      </h2>
      <div className="p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{appLabels.membreNomEtAdresseMail}</TableHeaderCell>
              <TableHeaderCell>{appLabels.membreRole}</TableHeaderCell>
              <TableHeaderCell>{appLabels.membreIntitulePoste}</TableHeaderCell>
              <TableHeaderCell>{appLabels.membreChampIntervention}</TableHeaderCell>
              <TableHeaderCell className="w-[12%]">
                {appLabels.membreAcces}
              </TableHeaderCell>

              <VisibleWhen
                condition={
                  canMutateMembres ||
                  canMutateTags ||
                  isCurrentUserIncludedInMembres
                }
              >
                <TableHeaderCell className="w-[10%]">
                  {appLabels.actions}
                </TableHeaderCell>
              </VisibleWhen>
            </TableRow>
          </TableHead>
          <tbody>
            {isLoadingMembres ? (
              <TableLoading columnIds={MEMBRES_COLUMNS} nbOfRows={5} />
            ) : membres.length > 0 ? (
              membres.map((membre) => (
                <ListMembresTableRow
                  key={membre.userId}
                  membre={membre}
                  updateMembre={updateMembre}
                  canMutateMembres={canMutateMembres}
                  canMutateTags={canMutateTags}
                  isCurrentUserRow={membre.userId === user.id}
                />
              ))
            ) : (
              <TableEmpty
                columnIds={MEMBRES_COLUMNS}
                description={appLabels.aucunMembreRattacheCollectivite}
              />
            )}
          </tbody>
        </Table>
      </div>
    </section>
  );
}
