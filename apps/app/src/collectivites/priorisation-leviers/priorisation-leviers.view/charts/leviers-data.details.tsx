import { appLabels } from '@/app/labels/catalog';
import {
  Icon,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { orderBy } from 'es-toolkit';
import { JSX } from 'react';
import { LevierPlace, toQuadrant } from '../data/to-matrix-points';

type LeviersDataDetailsProps = {
  places: LevierPlace[];
};

export const LeviersDataDetails = ({
  places,
}: LeviersDataDetailsProps): JSX.Element => (
  <details className="group mt-3">
    <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-normal text-primary-8 marker:hidden">
      <Icon
        icon="arrow-right-s-line"
        size="sm"
        className="transition-transform group-open:rotate-90"
        aria-hidden
      />
      {appLabels.voirLesDonneesDuGraphique}
    </summary>
    <Table className="mt-3 text-sm">
      <TableHead>
        <TableRow>
          <TableHeaderCell title={appLabels.levier} />
          <TableHeaderCell title={appLabels.levierSecteur} />
          <TableHeaderCell
            title={appLabels.levierImpactPotentielEstime}
            align="right"
          />
          <TableHeaderCell
            title={appLabels.levierMobilisationEstimee}
            align="right"
          />
          <TableHeaderCell title={appLabels.levierLecture} />
        </TableRow>
      </TableHead>
      <tbody>
        {orderBy(places, ['potentielScore'], ['desc']).map((levier) => (
          <TableRow key={levier.levierId}>
            <TableCell>{levier.nom}</TableCell>
            <TableCell>{levier.secteur}</TableCell>
            <TableCell className="text-right">
              {levier.potentielScore}
            </TableCell>
            <TableCell className="text-right">{`${levier.mobilisationScore} %`}</TableCell>
            <TableCell>
              {appLabels.levierQuadrantLecture[toQuadrant(levier)]}
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  </details>
);
