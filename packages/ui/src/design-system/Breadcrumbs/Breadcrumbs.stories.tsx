import {Meta, StoryObj} from '@storybook/react';
import {Breadcrumbs} from './Breadcrumbs';
import {useState} from 'react';
import {Button} from '@design-system/Button';

const meta: Meta<typeof Breadcrumbs> = {
  component: Breadcrumbs,
  args: {
    buttons: [
      {label: 'Plan Vélo 2020 - 2024'},
      {
        label:
          '0.0 Etudions un scénario de rupture pour atteindre la neutralité carbone en 2050',
      },
      {label: 'Etudions un scénario de rupture pour la période 2030-2050'},
    ],
  },
};

const buttons = [
  {label: 'Plan Vélo 2020 - 2024'},
  {
    label:
      '0.0 Etudions un scénario de rupture pour atteindre la neutralité carbone en 2050',
  },
  {label: 'Etudions un scénario de rupture pour la période 2030-2050'},
];

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  render: () => {
    const [currentButtons, setCurrentButtons] = useState(buttons);
    return (
      <div className="flex flex-col gap-8">
        <Breadcrumbs
          buttons={currentButtons}
          onClick={(index: number) =>
            setCurrentButtons(prevState => prevState.slice(0, index + 1))
          }
        />

        <Button onClick={() => setCurrentButtons(buttons)} size="xs">
          Reset
        </Button>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [currentButtons, setCurrentButtons] = useState(buttons);
    return (
      <div className="flex flex-col gap-8">
        <Breadcrumbs
          size="xs"
          buttons={currentButtons}
          onClick={(index: number) =>
            setCurrentButtons(prevState => prevState.slice(0, index + 1))
          }
        />
        <Breadcrumbs
          size="sm"
          buttons={currentButtons}
          onClick={(index: number) =>
            setCurrentButtons(prevState => prevState.slice(0, index + 1))
          }
        />
        <Breadcrumbs
          size="md"
          buttons={currentButtons}
          onClick={(index: number) =>
            setCurrentButtons(prevState => prevState.slice(0, index + 1))
          }
        />
        <Breadcrumbs
          size="xl"
          buttons={currentButtons}
          onClick={(index: number) =>
            setCurrentButtons(prevState => prevState.slice(0, index + 1))
          }
        />

        <Button onClick={() => setCurrentButtons(buttons)} size="xs">
          Reset
        </Button>
      </div>
    );
  },
};

export const ReadOnlyMode: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-8">
        <Breadcrumbs buttons={buttons} />
      </div>
    );
  },
};
