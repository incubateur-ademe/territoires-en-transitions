'use client';

import { demarchePcaetMockContacts } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import { Icon, Table, TableCell, TableRow } from '@tet/ui';
import { JSX } from 'react';

const ORGANISME_ICON: Record<string, string> = {
  [appLabels.demarchePcaetContactDreal]: 'map-pin-2-line',
  [appLabels.demarchePcaetContactCr]: 'government-line',
};

export const PcaetContactsTable = (): JSX.Element => (
  <div className="overflow-hidden rounded-xl border border-grey-3">
    <Table className="table-auto">
      <tbody>
        {demarchePcaetMockContacts.flatMap((organisme) =>
          organisme.contacts.map((contact) => (
            <TableRow key={`${organisme.organisme}-${contact.email}`}>
              <TableCell className="w-1/2">
                <div className="flex items-center gap-2 ">
                  <Icon
                    icon={ORGANISME_ICON[organisme.organisme] ?? 'phone-line'}
                    size="sm"
                    className="shrink-0"
                  />
                  <span>{contact.nom}</span>
                </div>
                <div>
                  <a
                    href={`mailto:${contact.email}`}
                    className="break-all text-primary-7 hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              </TableCell>
              <TableCell className="text-grey-7">{contact.situation}</TableCell>
            </TableRow>
          ))
        )}
      </tbody>
    </Table>
  </div>
);
