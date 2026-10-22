'use client';

import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';
import { PcaetContactsTable } from './contacts.table';

type Props = {
  collectiviteId: number;
  openState: OpenState;
};

export const PcaetContactsModal = ({
  collectiviteId,
  openState,
}: Props): JSX.Element => (
  <Modal
    size="lg"
    title={appLabels.demarcheContactsTitre}
    openState={openState}
    render={() => (
      <div className="flex flex-col gap-4">
        <p className=" text-grey-7">{appLabels.demarcheContactsDescription}</p>
        <PcaetContactsTable collectiviteId={collectiviteId} />
      </div>
    )}
  />
);
