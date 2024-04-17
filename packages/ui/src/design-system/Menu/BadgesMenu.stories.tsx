import {Meta, StoryObj} from '@storybook/react';
import {BadgesMenu} from './BadgesMenu';
import {Field} from '@design-system/Field';
import {
  Option,
  OptionValue,
  SelectMultiple,
  SelectOption,
} from '@design-system/Select';
import {useState} from 'react';

const meta: Meta<typeof BadgesMenu> = {
  component: BadgesMenu,
  argTypes: {
    variant: {
      control: {type: 'select'},
    },
  },
  args: {},
};

export default meta;

type Story = StoryObj<typeof BadgesMenu>;

export const Default: Story = {
  render: args => {
    const [values, setValues] = useState<OptionValue[] | undefined>();

    const options: SelectOption[] = [
      {value: 1, label: 'Test 1'},
      {value: 2, label: 'Test 2'},
      {value: 3, label: 'Test 3'},
    ];

    return (
      <div className="mb-52">
        <BadgesMenu
          {...args}
          badgesList={options
            .filter(opt => values?.includes((opt as Option).value))
            .map(opt => ({
              label: (opt as Option).label,
              onClose: () =>
                setValues(values.filter(v => v !== (opt as Option).value)),
            }))}
          menuContent={
            <div className="flex flex-col gap-4 w-72">
              <Field title="Test">
                <SelectMultiple
                  options={options}
                  values={values}
                  onChange={({values}) => setValues(values)}
                  small
                />
              </Field>
            </div>
          }
          onClearBadges={() => setValues(undefined)}
        />
      </div>
    );
  },
};

export const Custom: Story = {
  render: args => {
    const [badges, setBadges] = useState<string[]>([]);

    return (
      <div className="mb-12">
        <BadgesMenu
          {...args}
          variant="custom"
          badgesList={badges.map(b => ({
            label: b,
          }))}
          onClick={() => {
            const newBadge = `Nouveau badge ${badges.length + 1}`;
            const newBadgesList = [...badges, newBadge];
            setBadges(newBadgesList);
          }}
          onClearBadges={() => setBadges([])}
        />
      </div>
    );
  },
};
