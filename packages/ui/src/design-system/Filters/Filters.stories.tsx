import {Meta, StoryObj} from '@storybook/react';
import {BadgesFilters} from './BadgesFilters';
import {useState} from 'react';
import {OptionValue, SelectMultipleOnChangeArgs} from '@design-system/Select';

const meta: Meta<typeof BadgesFilters> = {
  component: BadgesFilters,
};

export default meta;

type Story = StoryObj<typeof BadgesFilters>;

export const FiltersWithBadges: Story = {
  render: () => {
    const [options1, setOptions1] = useState<OptionValue | undefined>();
    const [options2, setOptions2] = useState<OptionValue[] | undefined>();
    const [options3, setOptions3] = useState<OptionValue[] | undefined>();

    return (
      <div className="mb-[500px]">
        <BadgesFilters
          filters={[
            {
              title: 'Option 1',
              options: [
                {value: 'option11', label: 'Option 1.1'},
                {value: 'option12', label: 'Option 1.2'},
                {
                  value: 'option13',
                  label: 'Option 1.3',
                },
              ],
              values: options1,
              onChange: (args: OptionValue) => setOptions1(args),
            },
            {
              title: 'Option 2',
              tag: 'Opt 2',
              options: [
                {value: 'option21', label: 'Option 2.1'},
                {value: 'option22', label: 'Option 2.2'},
                {
                  value: 'option23',
                  label: 'Option 2.3',
                },
              ],
              values: options2,
              onChange: (args: SelectMultipleOnChangeArgs) =>
                setOptions2(args.values),
              multiple: true,
            },
            {
              title: 'Option 3',
              tag: 'Opt 3',
              options: [
                {
                  title: 'Option 3.1',
                  options: [
                    {value: 'option311', label: 'Option 3.1.1'},
                    {value: 'option312', label: 'Option 3.1.2'},
                  ],
                },
                {
                  title: 'Option 3.2',
                  options: [
                    {value: 'option321', label: 'Option 3.2.1'},
                    {value: 'option322', label: 'Option 3.2.2'},
                  ],
                },
                {
                  title: 'Option 3.3',
                  options: [
                    {value: 'option331', label: 'Option 3.3.1'},
                    {value: 'option332', label: 'Option 3.3.2'},
                  ],
                },
              ],
              values: options3,
              onChange: (args: SelectMultipleOnChangeArgs) =>
                setOptions3(args.values),
              multiple: true,
            },
          ]}
        />
      </div>
    );
  },
};
