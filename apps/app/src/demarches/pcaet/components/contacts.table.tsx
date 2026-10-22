'use client';

import { useListContacts } from '@/app/demarches/pcaet/data/use-list-contacts';
import { appLabels } from '@/app/labels/catalog';
import {
  CollectiviteType,
  collectiviteTypeEnum,
} from '@tet/domain/collectivites';
import { Icon, Table, TableCell, TableLoading, TableRow } from '@tet/ui';
import { JSX } from 'react';

const ORGANISME_ICON: Partial<Record<CollectiviteType, string>> = {
  [collectiviteTypeEnum.DREAL]: 'map-pin-2-line',
  [collectiviteTypeEnum.REGION]: 'government-line',
  [collectiviteTypeEnum.DDT]: 'road-map-line',
};

const ORGANISME_SITUATION: Partial<Record<CollectiviteType, string>> = {
  [collectiviteTypeEnum.DREAL]: appLabels.demarcheContactDrealSituation,
  [collectiviteTypeEnum.REGION]: appLabels.demarcheContactCrSituation,
  [collectiviteTypeEnum.DDT]: appLabels.demarcheContactDdtSituation,
};

type Props = {
  collectiviteId: number;
};

export const PcaetContactsTable = ({ collectiviteId }: Props): JSX.Element => {
  const { organismes, isLoading, isError } = useListContacts({
    collectiviteId,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-grey-3">
      <Table className="table-auto">
        <tbody>
          {isLoading && (
            <TableLoading columnIds={['contact', 'situation']} nbOfRows={3} />
          )}
          {isError && (
            <TableRow>
              <TableCell colSpan={2} className="text-error-1">
                {appLabels.demarcheContactsErreur}
              </TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && organismes.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-grey-7">
                {appLabels.demarcheContactsAucunOrganisme}
              </TableCell>
            </TableRow>
          )}
          {organismes.map(({ organisme, contacts }) => (
            <TableRow
              key={organisme.id}
              data-test={`demarches.pcaet.contacts.organisme-${organisme.id}`}
            >
              <TableCell className="w-1/2 align-top">
                <div className="flex items-center gap-2">
                  <Icon
                    icon={ORGANISME_ICON[organisme.type] ?? 'phone-line'}
                    size="sm"
                    className="shrink-0"
                  />
                  <span className="font-medium">{organisme.nom}</span>
                </div>
                {contacts.length === 0 ? (
                  <p className="mb-0 text-grey-6">
                    {appLabels.demarcheContactsAucunReferent}
                  </p>
                ) : (
                  <ul className="mb-0 flex flex-col gap-1 pl-0 list-none">
                    {contacts.map((contact) => (
                      <li key={contact.email} className="pb-0">
                        <span>{contact.nom}</span>
                        {' – '}
                        <a
                          href={`mailto:${contact.email}`}
                          className="break-all text-primary-7 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
              <TableCell className="align-top text-grey-7">
                {ORGANISME_SITUATION[organisme.type]}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
