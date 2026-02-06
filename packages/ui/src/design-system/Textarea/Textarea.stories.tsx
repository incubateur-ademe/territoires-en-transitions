import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentProps, useState } from 'react';
import { Field } from '../Field';
import { Textarea } from './Textarea';

const RenderTextarea = (args: ComponentProps<typeof Textarea>) => {
  const [value, setValue] = useState(args.value);
  return (
    <Textarea
      {...args}
      value={value}
      onChange={(evt) => setValue(evt.currentTarget.value)}
    />
  );
};

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  args: {
    placeholder: 'Saisir un texte...',
  },
  render: (args) => <RenderTextarea {...args} />,
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const disabled: Story = {
  args: {
    value: 'Test',
    disabled: true,
  },
};

/** Variante small */
const RenderSize = (args: ComponentProps<typeof Textarea>) => {
  const [value, setValue] = useState();
  const valueState = {
    value,
    onChange: (e: any) => setValue(e.currentTarget.value),
  };
  return (
    <div className="flex flex-col gap-4">
      <Textarea {...args} {...valueState} size="xs" />
      <Textarea {...args} {...valueState} size="sm" />
      <Textarea {...args} {...valueState} size="md" />
    </div>
  );
};

export const Size: Story = {
  render: (args) => <RenderSize {...args} />,
};

export const WithoutAutoResize: Story = {
  args: {
    autoresize: false,
  },
};

const RenderWithinField = (args: ComponentProps<typeof Textarea>) => {
  const [value, setValue] = useState();
  return (
    <div className="flex flex-col gap-4">
      <Field title="Description">
        <Textarea
          {...args}
          value={value}
          onChange={(e: any) => setValue(e.currentTarget.value)}
          rows={5}
        />
      </Field>
    </div>
  );
};

export const WithinField: Story = {
  render: (args) => <RenderWithinField {...args} />,
};
