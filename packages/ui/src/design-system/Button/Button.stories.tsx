import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useRef } from 'react';

import { RiLeafLine, RiLockFill } from '@remixicon/react';
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
    icon: <RiLeafLine />,
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
      <Button size="xs" icon={<RiLeafLine />} />
      <Button size="sm" icon={<RiLeafLine />} />
      <Button size="md" icon={<RiLeafLine />} />
      <Button size="xl" icon={<RiLeafLine />} />

      {/* Buttons */}
      <Button size="xs">XSmall</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="xl">XLarge</Button>

      {/* Buttons with icons */}
      <Button size="xs" icon={<RiLeafLine />}>
        XSmall
      </Button>
      <Button size="sm" icon={<RiLeafLine />}>
        Small
      </Button>
      <Button size="md" icon={<RiLeafLine />}>
        Medium
      </Button>
      <Button size="xl" icon={<RiLeafLine />}>
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
        icon={<RiLeafLine />}
        variant="primary"
        size="sm"
        notification={{
          number: 4,
        }}
      />
      <Button icon={<RiLeafLine />} variant="secondary" size="sm" />
      <Button icon={<RiLeafLine />} variant="outlined" size="sm" />
      <Button icon={<RiLeafLine />} variant="white" size="sm" />
      <Button icon={<RiLeafLine />} variant="grey" size="sm" />
      <Button icon={<RiLeafLine />} variant="underlined" size="sm" />

      {/* Disabled icon buttons */}
      <Button icon={<RiLeafLine />} variant="primary" disabled size="sm" />
      <Button icon={<RiLeafLine />} variant="secondary" disabled size="sm" />
      <Button icon={<RiLeafLine />} variant="outlined" disabled size="sm" />
      <Button icon={<RiLeafLine />} variant="white" disabled size="sm" />
      <Button icon={<RiLeafLine />} variant="grey" disabled size="sm" />
      <Button icon={<RiLeafLine />} variant="underlined" disabled size="sm" />

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
      <Button
        icon={<RiLeafLine />}
        iconPosition="left"
        variant="primary"
        size="sm"
      >
        Primary
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="left"
        variant="secondary"
        size="sm"
      >
        Secondary
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="left"
        variant="outlined"
        size="sm"
      >
        Outlined
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="left"
        variant="white"
        size="sm"
      >
        White
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="left"
        variant="grey"
        size="sm"
      >
        Grey
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="left"
        variant="underlined"
        size="sm"
      >
        Underlined
      </Button>

      {/* Disabled buttons with icon */}
      <Button
        icon={<RiLeafLine />}
        iconPosition="right"
        variant="primary"
        disabled
        size="sm"
      >
        Primary
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="right"
        variant="secondary"
        disabled
        size="sm"
      >
        Secondary
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="right"
        variant="outlined"
        disabled
        size="sm"
      >
        Outlined
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="right"
        variant="white"
        disabled
        size="sm"
      >
        White
      </Button>
      <Button
        icon={<RiLeafLine />}
        iconPosition="right"
        variant="grey"
        disabled
        size="sm"
      >
        Grey
      </Button>
      <Button
        icon={<RiLeafLine />}
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
        icon={<RiLeafLine />}
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
          icon: <RiLockFill />,
          variant: 'warning',
        }}
      >
        Primary
      </Button>
      <Button
        icon={<RiLeafLine />}
        variant="outlined"
        size="sm"
        notification={{
          number: 105,
          variant: 'error',
        }}
      />
      <Button
        icon={<RiLeafLine />}
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
      <Button href={SITE_BASE_URL} icon={<RiLeafLine />} variant="outlined" />
      <Button
        href={SITE_BASE_URL}
        variant="outlined"
        icon={<RiLeafLine />}
        disabled
      >
        Disabled link
      </Button>
      <Button
        href={SITE_BASE_URL}
        variant="underlined"
        icon={<RiLeafLine />}
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
