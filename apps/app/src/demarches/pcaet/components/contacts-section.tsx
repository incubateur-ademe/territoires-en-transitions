'use client';

import {
  demarchePcaetMockContacts,
  type DemarchePcaetContact,
  type DemarchePcaetOrganismeContacts,
} from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import { Icon } from '@tet/ui';
import { JSX } from 'react';
import { DemarchePcaetSection } from './demarche-pcaet-section';

const ORGANISME_ICON: Record<string, string> = {
  [appLabels.demarchePcaetContactAdeme]: 'building-line',
  [appLabels.demarchePcaetContactDreal]: 'map-pin-2-line',
  [appLabels.demarchePcaetContactCr]: 'government-line',
};

const ContactsList = ({
  contacts,
}: {
  contacts: DemarchePcaetContact[];
}): JSX.Element => (
  <div className="flex flex-col gap-0.5">
    {contacts.map((contact) => (
      <div
        key={contact.email}
        className="flex flex-wrap items-baseline gap-x-2 text-sm"
      >
        <span className="text-primary-10">{contact.nom}</span>
        <a
          href={`mailto:${contact.email}`}
          className="text-primary-7 hover:underline"
        >
          {contact.email}
        </a>
      </div>
    ))}
  </div>
);

const OrganismeItem = ({
  organisme,
}: {
  organisme: DemarchePcaetOrganismeContacts;
}): JSX.Element => (
  <div className="text-sm leading-6 gap-4 mb-1 flex items-start">
    <div className="bg-primary-1 rounded-full self-start flex items-center justify-center flex-none text-primary-9 w-12 h-12">
      <Icon icon={ORGANISME_ICON[organisme.organisme] ?? 'phone-line'} />
    </div>
    <div className="flex flex-col self-stretch">
      <div className="text-primary-10 text-base flex items-center gap-1">
        {appLabels.labelDeuxPoints({ label: organisme.organisme })}
      </div>
      <ContactsList contacts={organisme.contacts} />
    </div>
  </div>
);

export const ContactsSection = (): JSX.Element => (
  <DemarchePcaetSection
    title={appLabels.demarchePcaetContactsTitre}
    description={appLabels.demarchePcaetContactsDescription}
    showIcon={false}
  >
    <div className="flex flex-col gap-4">
      {demarchePcaetMockContacts.map((organisme) => (
        <OrganismeItem key={organisme.organisme} organisme={organisme} />
      ))}
    </div>
  </DemarchePcaetSection>
);
