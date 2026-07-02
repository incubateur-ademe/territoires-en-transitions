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

const RenderNonModalMenu = () => {
  const sources = ['CITEPA 2026', 'INSEE 2024', 'Saisie manuelle'];

  const [selected, setSelected] = useState(sources[0]);

  return (
    <InlineEditWrapper
      role="menu"
      modal={false}
      lockScroll={false}
      flip
      offset={4}
      floatingMatchReferenceHeight={false}
      renderOnEdit={({ openState }) => (
        <ul className="m-0 list-none p-1">
          {sources.map((source) => (
            <li key={source}>
              <button
                type="button"
                className="w-full rounded px-3 py-1.5 text-left text-sm text-grey-8 hover:bg-grey-2"
                onClick={() => {
                  setSelected(source);
                  openState.setIsOpen(false);
                }}
              >
                {source}
              </button>
            </li>
          ))}
        </ul>
      )}
    >
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-primary-3 px-2 py-3 text-primary-8 font-medium"
      >
        {selected}
      </button>
    </InlineEditWrapper>
  );
};

export const NonModalMenu: Story = {
  render: () => <RenderNonModalMenu />,
};
