import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Breadcrumbs } from './Breadcrumbs';

const buttons = [
  { label: 'Plan Vélo 2020 - 2024', onClick: () => console.log('Clicked!') },
  {
    label:
      '0.0 Etudions un scénario de rupture pour atteindre la neutralité carbone en 2050',
    onClick: () => console.log('Clicked!'),
  },
  {
    label: '0.1 Etudions un scénario de rupture pour la période 2020-2030',
    onClick: () => console.log('Clicked!'),
  },
  {
    label: 'Etudions un scénario de rupture pour la période 2020-2025',
    onClick: () => console.log('Clicked!'),
  },
];

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
  args: {
    items: buttons,
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  render: (args) => <Breadcrumbs {...args} />,
};

export const OnlyLabelItems: Story = {
  render: (args) => {
    return (
      <Breadcrumbs
        {...args}
        items={args.items.map((item) => ({ label: item.label }))}
      />
    );
  },
};

export const SomeClickableAndSomeLabelItems: Story = {
  render: (args) => {
    return (
      <Breadcrumbs
        {...args}
        items={args.items.map((item, index) => ({
          label: item.label,
          onClick: index % 2 === 0 ? item.onClick : undefined,
        }))}
      />
    );
  },
};

export const LastItemClickable: Story = {
  render: (args) => {
    return <Breadcrumbs {...args} enableLastElementClick />;
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <Breadcrumbs {...args} size="xs" />
      <Breadcrumbs {...args} size="sm" />
      <Breadcrumbs {...args} size="md" />
      <Breadcrumbs {...args} size="xl" />
    </div>
  ),
};
