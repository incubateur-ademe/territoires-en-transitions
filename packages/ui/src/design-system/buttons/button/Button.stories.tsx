import {useRef} from 'react';
import {Meta, StoryObj} from '@storybook/react';

import {Button} from './Button';
import DoubleCheckIcon from '../../../assets/DoubleCheckIcon';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  argTypes: {
    variant: {
      control: {type: 'select'},
    },
    size: {
      control: {type: 'select'},
    },
    icon: {
      control: {type: 'text'},
    },
    iconPosition: {
      control: {type: 'select'},
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

/** Bouton par défaut, sans aucune props renseignée. */
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

/** Bouton avec disabled à true. */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

/** Bouton avec icône Remix. */
export const WithRemixIcon: Story = {
  args: {
    children: 'Remix Icon',
    icon: 'leaf-line',
    iconPosition: 'left',
  },
};

/** Bouton avec icône SVG custom. */
export const WithCustomSVGIcon: Story = {
  args: {
    children: 'SVG Icon',
    icon: className => <DoubleCheckIcon className={className} />,
    iconPosition: 'left',
  },
};

/** Différentes valeurs pour la props size. */
export const Sizes: Story = {
  render: () => (
    <div
      className="grid gap-5 items-end"
      style={{gridTemplateColumns: 'repeat(4,fit-content(0))'}}
    >
      {/* Icon Buttons */}
      <Button size="xs" icon="leaf-line" />
      <Button size="sm" icon="leaf-line" />
      <Button size="md" icon="leaf-line" />
      <Button size="xl" icon="leaf-line" />

      {/* Buttons */}
      <Button size="xs">XSmall</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="xl">XLarge</Button>

      {/* Buttons with icons */}
      <Button size="xs" icon="leaf-line">
        XSmall
      </Button>
      <Button size="sm" icon="leaf-line">
        Small
      </Button>
      <Button size="md" icon="leaf-line">
        Medium
      </Button>
      <Button size="xl" icon="leaf-line">
        XLarge
      </Button>
    </div>
  ),
};

/** Bouton avec différents variants. */
export const Variants: Story = {
  parameters: {},
  render: () => (
    <div
      className="grid gap-5 items-end bg-grey-2 p-10"
      style={{gridTemplateColumns: 'repeat(5,fit-content(0))'}}
    >
      {/* Icon buttons */}
      <Button icon="leaf-line" variant="primary" />
      <Button icon="leaf-line" variant="secondary" />
      <Button icon="leaf-line" variant="outlined" />
      <Button icon="leaf-line" variant="white" />
      <Button icon="leaf-line" variant="grey" />

      {/* Disabled icon buttons */}
      <Button icon="leaf-line" variant="primary" disabled />
      <Button icon="leaf-line" variant="secondary" disabled />
      <Button icon="leaf-line" variant="outlined" disabled />
      <Button icon="leaf-line" variant="white" disabled />
      <Button icon="leaf-line" variant="grey" disabled />

      {/* Default buttons */}
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outlined">Outlined</Button>
      <Button variant="white">White</Button>
      <Button variant="grey">Grey</Button>

      {/* Disabled default buttons */}
      <Button variant="primary" disabled>
        Primary
      </Button>
      <Button variant="secondary" disabled>
        Secondary
      </Button>
      <Button variant="outlined" disabled>
        Outlined
      </Button>
      <Button variant="white" disabled>
        White
      </Button>
      <Button variant="grey" disabled>
        Grey
      </Button>

      {/* Buttons with icon */}
      <Button icon="leaf-line" iconPosition="left" variant="primary">
        Primary
      </Button>
      <Button icon="leaf-line" iconPosition="left" variant="secondary">
        Secondary
      </Button>
      <Button icon="leaf-line" iconPosition="left" variant="outlined">
        Outlined
      </Button>
      <Button icon="leaf-line" iconPosition="left" variant="white">
        White
      </Button>
      <Button icon="leaf-line" iconPosition="left" variant="grey">
        Grey
      </Button>

      {/* Disabled buttons with icon */}
      <Button icon="leaf-line" iconPosition="right" variant="primary" disabled>
        Primary
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="right"
        variant="secondary"
        disabled
      >
        Secondary
      </Button>
      <Button icon="leaf-line" iconPosition="right" variant="outlined" disabled>
        Outlined
      </Button>
      <Button icon="leaf-line" iconPosition="right" variant="white" disabled>
        White
      </Button>
      <Button icon="leaf-line" iconPosition="right" variant="grey" disabled>
        Grey
      </Button>
    </div>
  ),
};

/** Boutons avec valeur href. */
export const AnchorButtons: Story = {
  render: () => (
    <div className="flex items-end gap-5">
      <Button href="https://territoiresentransitions.fr/">Internal link</Button>
      <Button
        href="https://territoiresentransitions.fr/"
        icon="leaf-line"
        variant="outlined"
      />
      <Button
        href="https://territoiresentransitions.fr/"
        variant="outlined"
        icon="leaf-line"
        disabled
      >
        Disabled link
      </Button>
      <Button href="https://territoiresentransitions.fr/" external>
        External link
      </Button>
      <Button href="https://territoiresentransitions.fr/" external />
    </div>
  ),
};

/** Customisation du bouton avec des classes ou des inline styles. */
export const WithRef: Story = {
  render: () => {
    const buttonRef = useRef();
    const anchorRef = useRef();
    const onButtonClick = () => console.log(buttonRef.current);
    const onAnchorClick = () => console.log(anchorRef.current);
    return (
      <div className="flex items-end gap-5">
        <Button ref={buttonRef} onClick={onButtonClick}>
          Button with ref
        </Button>
        <Button
          ref={anchorRef}
          onClick={onAnchorClick}
          href="https://territoiresentransitions.fr/"
          external
        >
          Anchor with ref
        </Button>
      </div>
    );
  },
};

/** Customisation du bouton avec des classes ou des inline styles. */
export const CustomStyles: Story = {
  render: () => (
    <div className="flex items-end gap-5">
      <Button className="!bg-success-3 !border-success-3 hover:!bg-success hover:!border-success">
        Custom Class
      </Button>
      <Button style={{fontStyle: 'italic', borderRadius: '2rem'}}>
        Custom Style
      </Button>
    </div>
  ),
};
