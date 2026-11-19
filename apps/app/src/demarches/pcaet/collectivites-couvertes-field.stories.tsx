import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { useState, type ComponentProps } from 'react';
import { CollectivitesCouvertesField } from './collectivites-couvertes-field';

type Props = ComponentProps<typeof CollectivitesCouvertesField>;

const ControlledField = (props: Props) => {
  const [value, setValue] = useState(props.value);
  return (
    <div className="max-w-3xl bg-white p-8">
      <CollectivitesCouvertesField
        {...props}
        value={value}
        onChange={setValue}
      />
    </div>
  );
};

const meta: Meta<typeof CollectivitesCouvertesField> = {
  component: CollectivitesCouvertesField,
  render: (args) => <ControlledField {...args} />,
};

export default meta;

type Story = StoryObj<typeof CollectivitesCouvertesField>;

/** Renouvellement : deux EPCI libres, un troisième engagé ailleurs. */
export const Renouvellement: Story = {
  args: {
    porteurId: 9,
    value: [11],
    candidats: [
      {
        id: 11,
        nom: 'CC Castelnaudary Lauragais Audois',
        departementCode: '11',
        derniereDemarche: {
          status: DemarchePcaetStatusEnum.PUBLIE,
          dateDebut: '2020-03-01',
        },
        engagement: null,
      },
      {
        id: 12,
        nom: 'CC des Terres du Lauragais',
        departementCode: '31',
        derniereDemarche: null,
        engagement: null,
      },
      {
        id: 13,
        nom: 'CC Lauragais Revel Sorezois',
        departementCode: '31',
        derniereDemarche: {
          status: DemarchePcaetStatusEnum.EN_ELABORATION,
          dateDebut: '2026-09-15',
        },
        engagement: { porteur: null, dateDebut: '2026-09-15' },
      },
    ],
  },
};
