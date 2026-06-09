'use client';

import {
  demarchePcaetMockContacts,
  type DemarchePcaetContact,
} from '@/app/demarches/pcaet/demarche-pcaet.constants';
import { appLabels } from '@/app/labels/catalog';
import { JSX } from 'react';
import { DemarchePcaetSection } from './demarche-pcaet-section';

const ContactRow = ({
  contact,
}: {
  contact: DemarchePcaetContact;
}): JSX.Element => (
  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
    <span className="text-primary-10">{contact.nom}</span>
    <a
      href={`mailto:${contact.email}`}
      className="text-primary-7 hover:underline"
    >
      {contact.email}
    </a>
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
        <div key={organisme.organisme} className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-primary-9">
            {organisme.organisme}
          </span>
          {organisme.contacts.map((contact) => (
            <ContactRow key={contact.email} contact={contact} />
          ))}
        </div>
      ))}
    </div>
  </DemarchePcaetSection>
);
