import { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { MembreFonction } from '@tet/domain/collectivites';
import type { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { useState } from 'react';
import { action } from 'storybook/actions';
import {
    ChampsInterventionDropdown,
    CollectiviteRoleDropdown,
    DetailsFonctionTextarea,
    FonctionDropdown,
} from './list-membres.table-row.editable-cell';

type EditableCellStoryProps = {
  initialDetails: string;
  initialFonction?: MembreFonction;
  initialChamps: ReferentielId[];
  initialRole: CollectiviteRole;
};

const saveDetailsAction = action('saveDetails');
const selectFonctionAction = action('selectFonction');
const selectChampsAction = action('selectChamps');
const selectRoleAction = action('selectRole');

function EditableCellStory({
  initialDetails,
  initialFonction,
  initialChamps,
  initialRole,
}: EditableCellStoryProps) {
  const [details, setDetails] = useState(initialDetails);
  const [fonction, setFonction] = useState<MembreFonction | undefined>(
    initialFonction
  );
  const [champs, setChamps] = useState<ReferentielId[]>(initialChamps);
  const [role, setRole] = useState<CollectiviteRole>(initialRole);

  return (
    <div className="grid max-w-4xl gap-6 md:grid-cols-2">
      <section className="space-y-2 rounded-xl border border-grey-3 bg-white p-4">
        <h2 className="text-sm font-bold text-primary-10">Fonction</h2>
        <FonctionDropdown
          value={fonction}
          onChange={(value) => {
            setFonction(value);
            selectFonctionAction(value);
          }}
        />
      </section>

      <section className="space-y-2 rounded-xl border border-grey-3 bg-white p-4">
        <h2 className="text-sm font-bold text-primary-10">Acces</h2>
        <CollectiviteRoleDropdown
          value={role}
          onSelect={(value) => {
            setRole(value);
            selectRoleAction(value);
          }}
        />
      </section>

      <section className="space-y-2 rounded-xl border border-grey-3 bg-white p-4">
        <h2 className="text-sm font-bold text-primary-10">Intitule de poste</h2>
        <DetailsFonctionTextarea
          details_fonction={details}
          save={(value) => {
            setDetails(value);
            saveDetailsAction(value);
          }}
        />
      </section>

      <section className="space-y-2 rounded-xl border border-grey-3 bg-white p-4">
        <h2 className="text-sm font-bold text-primary-10">Champ d'intervention</h2>
        <ChampsInterventionDropdown
          values={champs}
          onChange={(value) => {
            setChamps(value);
            selectChampsAction(value);
          }}
        />
      </section>
    </div>
  );
}

const meta: Meta<typeof EditableCellStory> = {
  component: EditableCellStory,
  decorators: [(Story) => <div className="bg-grey-1 p-8">{Story()}</div>],
  args: {
    initialDetails: 'Direction de la transition',
    initialFonction: 'technique',
    initialChamps: ['cae'],
    initialRole: CollectiviteRole.EDITION,
  },
};

export default meta;

type Story = StoryObj<typeof EditableCellStory>;

export const Edition: Story = {};

export const AdminAvecDeuxReferentiels: Story = {
  args: {
    initialDetails: 'Elue referente',
    initialFonction: 'politique',
    initialChamps: ['cae', 'eci'],
    initialRole: CollectiviteRole.ADMIN,
  },
};

export const ValeursVides: Story = {
  args: {
    initialDetails: '',
    initialFonction: undefined,
    initialChamps: [],
    initialRole: CollectiviteRole.LECTURE,
  },
};