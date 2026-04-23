import {ComponentProps, useState} from 'react';
import {Meta, StoryObj} from '@storybook/nextjs-vite';
import {Checkbox} from './Checkbox';

const ControlledCheckbox = ({
  defaultChecked,
  ...props
}: ComponentProps<typeof Checkbox> & {defaultChecked?: boolean}) => {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <Checkbox
      {...props}
      checked={checked}
      onChange={() => setChecked(!checked)}
    />
  );
};

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const All: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="font-semibold">Sans label</div>
        <ControlledCheckbox id="cb1" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-semibold">Default / checked / disabled</div>
        <ControlledCheckbox id="cb2" label="Description de l'action" />
        <ControlledCheckbox
          id="cb3"
          label="Description de l'action"
          defaultChecked
        />
        <ControlledCheckbox
          id="cb4"
          label="Description de l'action"
          disabled
        />
        <ControlledCheckbox
          id="cb5"
          label="Description de l'action"
          disabled
          defaultChecked
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-semibold">Label long + message</div>
        <div className="max-w-[16rem]">
          <ControlledCheckbox
            id="cb6"
            label="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            message="Le lorem ipsum est, en imprimerie, une suite de mots sans signification utilisée"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-semibold">Message</div>
        <ControlledCheckbox
          id="cb7"
          label="Description de l'action"
          message="Description additionnelle"
        />
        <ControlledCheckbox
          id="cb8"
          label="Description de l'action"
          message="Description additionnelle"
          state="info"
        />
        <ControlledCheckbox
          id="cb9"
          message="Le lorem ipsum est, en imprimerie, une suite de mots sans signification utilisée"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-semibold">Variante switch</div>
        <ControlledCheckbox
          id="cb10"
          label="Description de l'action"
          message="Description additionnelle"
          state="info"
          variant="switch"
        />
        <ControlledCheckbox
          id="cb11"
          label="Description de l'action"
          defaultChecked
          message="Le lorem ipsum est, en imprimerie, une suite de mots sans signification utilisée"
          state="info"
          variant="switch"
        />
        <ControlledCheckbox
          id="cb12"
          label="Description de l'action"
          disabled
          defaultChecked
          variant="switch"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-semibold">Container custom</div>
        <ControlledCheckbox
          id="cb13"
          label="Description de l'action"
          defaultChecked
          containerClassname="border border-grey p-4"
        />
      </div>
    </div>
  ),
};
