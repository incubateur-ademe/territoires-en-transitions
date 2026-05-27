import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PillButton } from '../Button/pill-button';
import { ChecklistTable } from './ChecklistTable';

const meta: Meta<typeof ChecklistTable> = {
  component: ChecklistTable,
  decorators: [(story) => <div className="p-8">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof ChecklistTable>;

const head = (
  <ChecklistTable.Head
    labelHeader="Critères attendus"
    answerHeader="Réponses"
  />
);

export const Default: Story = {
  args: { caption: 'Critères de labellisation' },
  render: (args) => (
    <ChecklistTable {...args}>
      {head}
      <ChecklistTable.Row
        done={true}
        criterion={{
          label: 'Compléter le diagnostic',
          action: (
            <PillButton icon="list-check" iconPosition="left">
              Voir la liste
            </PillButton>
          ),
        }}
        answer="Tous les critères de complétude sont renseignés"
      />
      <ChecklistTable.Row
        done={false}
        criterion={{
          label: 'Score minimum atteint',
          action: (
            <PillButton icon="arrow-right-line">Voir la mesure</PillButton>
          ),
        }}
        answer="Obtenir 35% au minimum"
      />
      <ChecklistTable.Row
        done={false}
        criterion={{ label: "Acte d'engagement signé" }}
        answer="Document à téléverser"
      />
    </ChecklistTable>
  ),
};

const longText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed felis magna, semper eget tortor sed, aliquet ornare risus. Sed egestas egestas porttitor. Sed quis pretium eros.';

export const LongContent: Story = {
  args: { caption: 'Critères avec contenu long' },
  render: (args) => (
    <ChecklistTable {...args}>
      {head}
      <ChecklistTable.Row
        done={true}
        criterion={{
          label: longText,
          action: (
            <PillButton icon="arrow-right-line">Voir la mesure</PillButton>
          ),
        }}
        answer={longText}
      />
      <ChecklistTable.Row
        done={false}
        criterion={{ label: longText }}
        answer={longText}
      />
    </ChecklistTable>
  ),
};

export const LongHeaderTitle: Story = {
  args: { caption: 'Headers longs' },
  render: (args) => (
    <ChecklistTable {...args}>
      <ChecklistTable.Head
        labelHeader="Critères attendus pour la candidature à la labellisation Climat Air Énergie"
        answerHeader="Réponses attendues détaillées par critère"
      />
      <ChecklistTable.Row
        done={true}
        criterion={{ label: 'Critère court' }}
        answer="Réponse courte"
      />
    </ChecklistTable>
  ),
};

export const WithoutCaption: Story = {
  render: () => (
    <ChecklistTable>
      {head}
      <ChecklistTable.Row
        done={true}
        criterion={{ label: 'Critère sans caption sur la table' }}
        answer="OK"
      />
    </ChecklistTable>
  ),
};

export const RowHover: Story = {
  args: { caption: 'État hover des rows' },
  parameters: { pseudo: { hover: ['tr'] } },
  render: (args) => (
    <ChecklistTable {...args}>
      {head}
      <ChecklistTable.Row
        done={true}
        criterion={{
          label: 'Row affiché en état hover',
          action: <PillButton icon="arrow-right-line">Action</PillButton>,
        }}
        answer="Vérifier la couleur primary-1"
      />
    </ChecklistTable>
  ),
};
