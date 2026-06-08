'use client';

import { DEMARCHE_PCAET_CONTACTS } from '@/app/demarches/pcaet/demarche-pcaet.constants';
import type { DemarchePcaetContacts } from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { JSX } from 'react';
import { ContactOrganismeDropdown } from './contact-organisme-dropdown';
import { DemarchePcaetSection } from './demarche-pcaet-section';

export const ContactsSection = ({
  contacts,
  isReadonly,
  onChange,
}: {
  contacts: DemarchePcaetContacts;
  isReadonly: boolean;
  onChange: (contacts: DemarchePcaetContacts) => void;
}): JSX.Element => (
  <DemarchePcaetSection
    title={appLabels.demarchePcaetContactsTitre}
    description={appLabels.demarchePcaetContactsDescription}
    showIcon={false}
  >
    <div className="flex flex-col gap-4">
      {DEMARCHE_PCAET_CONTACTS.map((organisme) => (
        <ContactOrganismeDropdown
          key={organisme.id}
          label={organisme.label}
          options={organisme.options}
          values={contacts[organisme.id]}
          disabled={isReadonly}
          onChange={(values) => onChange({ ...contacts, [organisme.id]: values })}
        />
      ))}
    </div>
  </DemarchePcaetSection>
);
