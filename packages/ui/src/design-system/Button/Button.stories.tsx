import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef } from 'react';

import DoubleCheckIcon from '../../assets/DoubleCheckIcon';

import { SITE_BASE_URL } from '../../utils/constants';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
    },
    size: {
      control: { type: 'select' },
    },
    icon: {
      control: { type: 'text' },
    },
    iconPosition: {
      control: { type: 'select' },
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
    icon: (className: string) => <DoubleCheckIcon className={className} />,
    iconPosition: 'left',
  },
};

/** Bouton avec loader. */
export const WithLoader: Story = {
  args: {
    children: 'Loading',
    loading: true,
  },
};

/** Différentes valeurs pour la props size. */
export const Sizes: Story = {
  render: () => (
    <div
      className="grid gap-5 items-end"
      style={{ gridTemplateColumns: 'repeat(4,fit-content(0))' }}
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
      style={{ gridTemplateColumns: 'repeat(6,fit-content(0))' }}
    >
      {/* Icon buttons */}
      <Button
        icon="leaf-line"
        variant="primary"
        size="sm"
        notification={{
          number: 4,
        }}
      />
      <Button icon="leaf-line" variant="secondary" size="sm" />
      <Button icon="leaf-line" variant="outlined" size="sm" />
      <Button icon="leaf-line" variant="white" size="sm" />
      <Button icon="leaf-line" variant="grey" size="sm" />
      <Button icon="leaf-line" variant="underlined" size="sm" />

      {/* Disabled icon buttons */}
      <Button icon="leaf-line" variant="primary" disabled size="sm" />
      <Button icon="leaf-line" variant="secondary" disabled size="sm" />
      <Button icon="leaf-line" variant="outlined" disabled size="sm" />
      <Button icon="leaf-line" variant="white" disabled size="sm" />
      <Button icon="leaf-line" variant="grey" disabled size="sm" />
      <Button icon="leaf-line" variant="underlined" disabled size="sm" />

      {/* Default buttons */}
      <Button variant="primary" size="sm">
        Primary
      </Button>
      <Button variant="secondary" size="sm">
        Secondary
      </Button>
      <Button variant="outlined" size="sm">
        Outlined
      </Button>
      <Button variant="white" size="sm">
        White
      </Button>
      <Button variant="grey" size="sm">
        Grey
      </Button>
      <Button variant="underlined" size="sm">
        Underlined
      </Button>

      {/* Disabled default buttons */}
      <Button variant="primary" disabled size="sm">
        Primary
      </Button>
      <Button variant="secondary" disabled size="sm">
        Secondary
      </Button>
      <Button variant="outlined" disabled size="sm">
        Outlined
      </Button>
      <Button variant="white" disabled size="sm">
        White
      </Button>
      <Button variant="grey" disabled size="sm">
        Grey
      </Button>
      <Button variant="underlined" disabled size="sm">
        Underlined
      </Button>

      {/* Buttons with icon */}
      <Button icon="leaf-line" iconPosition="left" variant="primary" size="sm">
        Primary
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="left"
        variant="secondary"
        size="sm"
      >
        Secondary
      </Button>
      <Button icon="leaf-line" iconPosition="left" variant="outlined" size="sm">
        Outlined
      </Button>
      <Button icon="leaf-line" iconPosition="left" variant="white" size="sm">
        White
      </Button>
      <Button icon="leaf-line" iconPosition="left" variant="grey" size="sm">
        Grey
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="left"
        variant="underlined"
        size="sm"
      >
        Underlined
      </Button>

      {/* Disabled buttons with icon */}
      <Button
        icon="leaf-line"
        iconPosition="right"
        variant="primary"
        disabled
        size="sm"
      >
        Primary
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="right"
        variant="secondary"
        disabled
        size="sm"
      >
        Secondary
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="right"
        variant="outlined"
        disabled
        size="sm"
      >
        Outlined
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="right"
        variant="white"
        disabled
        size="sm"
      >
        White
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="right"
        variant="grey"
        disabled
        size="sm"
      >
        Grey
      </Button>
      <Button
        icon="leaf-line"
        iconPosition="right"
        variant="underlined"
        disabled
        size="sm"
      >
        Underlined
      </Button>
    </div>
  ),
};
/** Bouton avec différents variants. */
export const WithNotification: Story = {
  render: () => (
    <div
      className="grid gap-5 items-end bg-grey-2 p-10"
      style={{ gridTemplateColumns: 'repeat(6,fit-content(0))' }}
    >
      <Button
        icon="leaf-line"
        variant="primary"
        size="sm"
        notification={{
          number: 4,
        }}
      />
      <Button
        variant="primary"
        size="sm"
        notification={{
          icon: 'lock-fill',
          variant: 'warning',
        }}
      >
        Primary
      </Button>
      <Button
        icon="leaf-line"
        variant="outlined"
        size="sm"
        notification={{
          number: 105,
          variant: 'error',
        }}
      />
      <Button
        icon="leaf-line"
        iconPosition="left"
        variant="underlined"
        size="sm"
        href={SITE_BASE_URL}
        notification={{
          number: 2,
          variant: 'info',
          classname: '-top-5 -right-5',
        }}
      >
        Underlined
      </Button>
    </div>
  ),
};

/** Boutons avec valeur href. */
export const AnchorButtons: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-5">
      <Button href={SITE_BASE_URL}>Internal link</Button>
      <Button href={SITE_BASE_URL} variant="underlined">
        Internal link
      </Button>
      <Button href={SITE_BASE_URL} icon="leaf-line" variant="outlined" />
      <Button href={SITE_BASE_URL} variant="outlined" icon="leaf-line" disabled>
        Disabled link
      </Button>
      <Button
        href={SITE_BASE_URL}
        variant="underlined"
        icon="leaf-line"
        disabled
      >
        Disabled link
      </Button>
      <Button href={SITE_BASE_URL} external>
        External link
      </Button>
      <Button href={SITE_BASE_URL} external />
      <Button href={SITE_BASE_URL} variant="underlined" external>
        External link
      </Button>
      <Button
        href={SITE_BASE_URL}
        variant="outlined"
        iconPosition="left"
        external
      >
        External link
      </Button>
    </div>
  ),
};

const RenderWithRef = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const anchorRef = useRef<HTMLAnchorElement>(null);
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
        href={SITE_BASE_URL}
        external
      >
        Anchor with ref
      </Button>
    </div>
  );
};

export const WithRef: Story = {
  render: () => <RenderWithRef />,
};

/** Customisation du bouton avec des classes ou des inline styles. */
export const CustomStyles: Story = {
  render: () => (
    <div className="flex items-end gap-5">
      <Button className="!bg-success-3 !border-success-3 hover:!bg-success hover:!border-success">
        Custom Class
      </Button>
      <Button style={{ fontStyle: 'italic', borderRadius: '2rem' }}>
        Custom Style
      </Button>
    </div>
  ),
};
