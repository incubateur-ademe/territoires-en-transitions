'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import {
  DEMARCHE_PCAET_STATUT_VARIANTS,
  formatDemarcheStatut,
} from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { RouterOutput } from '@tet/api';
import {
  Badge,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import Link from 'next/link';
import { DemarchePcaetActionsMenu } from './demarche-pcaet-actions.menu';

type Demarche = RouterOutput['demarches']['pcaet']['list'][number];

const formatDate = (date: string | null) =>
  date ? getTextFormattedDate({ date }) : '—';

export const DemarchesPcaetTable = ({
  demarches,
}: {
  demarches: Demarche[];
}) => (
  <div className="max-xl:overflow-x-auto bg-white rounded-xl border border-grey-3">
    <Table>
      <colgroup>
        <col />
        <col className="w-56" />
        <col className="w-48" />
        <col className="w-32" />
        <col className="w-32" />
        <col className="w-32" />
        <col className="w-16" />
      </colgroup>
      <TableHead>
        <tr>
          <TableHeaderCell title={appLabels.demarchePcaetListeColonneTitre} />
          <TableHeaderCell title={appLabels.demarchePcaetListeColonnePilotes} />
          <TableHeaderCell title={appLabels.demarchePcaetListeColonneStatut} />
          <TableHeaderCell
            title={appLabels.demarchePcaetListeColonneCreation}
          />
          <TableHeaderCell title={appLabels.demarchePcaetListeColonneDebut} />
          <TableHeaderCell
            title={appLabels.demarchePcaetListeColonneModification}
          />
          <TableHeaderCell title="" />
        </tr>
      </TableHead>
      <tbody>
        {demarches.map((demarche) => (
          <TableRow key={demarche.id}>
            <TableCell>
              <Link
                href={makeCollectiviteDemarchePcaetRootUrl({
                  collectiviteId: demarche.collectiviteId,
                  demarchePcaetId: demarche.id,
                })}
                className="font-medium text-primary-9 hover:underline"
              >
                {demarche.titre}
              </Link>
            </TableCell>
            <TableCell>
              {demarche.pilotes.map((pilote) => pilote.nom).join(', ') || '—'}
            </TableCell>
            <TableCell>
              <Badge
                title={formatDemarcheStatut(demarche.status)}
                variant={DEMARCHE_PCAET_STATUT_VARIANTS[demarche.status]}
                size="sm"
              />
            </TableCell>
            <TableCell>{formatDate(demarche.createdAt)}</TableCell>
            <TableCell>{formatDate(demarche.launchedAt)}</TableCell>
            <TableCell>{formatDate(demarche.modifiedAt)}</TableCell>
            <TableCell>
              <DemarchePcaetActionsMenu demarche={demarche} />
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </div>
);
