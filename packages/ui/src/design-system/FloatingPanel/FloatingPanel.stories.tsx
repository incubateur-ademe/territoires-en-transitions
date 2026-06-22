import { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FloatingPanel } from '.';

const meta: Meta<typeof FloatingPanel> = {
  component: FloatingPanel,
  args: {
    title: 'Mes téléchargements',
    onClose: () => undefined,
  },
};

export default meta;

type Story = StoryObj<typeof FloatingPanel>;

export const Default: Story = {
  render: (args) => (
    <FloatingPanel {...args}>
      <p className="m-0 text-sm text-grey-8">
        {"Contenu du panel — typiquement une liste d'éléments en attente."}
      </p>
    </FloatingPanel>
  ),
};

export const ContenuLong: Story = {
  render: (args) => (
    <FloatingPanel {...args}>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {Array.from({ length: 12 }, (_, index) => (
          <li key={index} className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-primary-9">
              Élément #{index + 1}
            </span>
            <span className="text-xs text-grey-7">
              {"Description courte de l'élément."}
            </span>
          </li>
        ))}
      </ul>
    </FloatingPanel>
  ),
};
