import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Select } from '../Select';
import { InlineEditWrapper } from './inline-edit.wrapper';

const meta: Meta<typeof InlineEditWrapper> = {
  component: InlineEditWrapper,
  title: 'Design System/Inline edit',
};

export default meta;

type Story = StoryObj<typeof InlineEditWrapper>;

const RenderDefault = () => {
  const options = [
    { label: 'Victor', value: 'victor' },
    { label: 'Elsa', value: 'elsa' },
    { label: 'Camille', value: 'camille' },
  ];

  const [value, setValue] = useState(options[0].value);

  return (
    <InlineEditWrapper
      renderOnEdit={({ openState }) => (
        <Select
          buttonClassName="w-64"
          values={value}
          onChange={(value) => setValue(value as string)}
          inlineEdit
          openState={openState}
          options={options}
        />
      )}
    >
      <div className="inline-flex items-center gap-2 py-3 px-2 border border-primary-3 rounded-lg">
        <div className="w-8 h-8 bg-primary-6 rounded-full" />
        <div className="text-primary-8 font-medium">{value}</div>
      </div>
    </InlineEditWrapper>
  );
};

export const Default: Story = {
  render: () => <RenderDefault />,
};
