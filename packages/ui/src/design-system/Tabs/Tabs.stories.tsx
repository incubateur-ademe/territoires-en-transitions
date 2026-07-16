import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import { Tabs } from './Tabs';
import { Tab } from './Tab';
import { RiAlertFill, RiChat1Line, RiCheckboxCircleFill, RiLockFill, RiUserLine } from '@remixicon/react';

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  args: {
    onChange: action('onChange'),
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const OngletParDefaut: Story = {
  args: {
    children: [
      <Tab key="tab1" label="Onglet 1">contenu onglet 1</Tab>,
      <Tab key="tab2" label="Onglet 2">contenu onglet 2</Tab>,
      <Tab key="tab3" label="Onglet 3">contenu onglet 3</Tab>,
    ],
  },
};

export const Onglet2: Story = {
  args: {
    defaultActiveTab: 1,
    children: [
      <Tab key="tab1" label="Onglet 1">contenu onglet 1</Tab>,
      <Tab key="tab2" label="Onglet 2">contenu onglet 2</Tab>,
      <Tab key="tab3" label="Onglet 3">contenu onglet 3</Tab>,
    ],
  },
};

export const AvecIcones = {
  args: {
    defaultActiveTab: 1,
    children: [
      <Tab key="tab1" label="Onglet 1" icon={<RiLockFill />}>
        contenu onglet 1
      </Tab>,
      <Tab key="tab2" label="Onglet 2" icon={<RiUserLine />}>
        contenu onglet 2
      </Tab>,
      <Tab key="tab3" label="Onglet 3" icon={<RiChat1Line />}>
        contenu onglet 3
      </Tab>,
    ],
  },
} satisfies Story;

export const AvecIconesStylees: Story = {
  args: {
    defaultActiveTab: 1,
    children: [
      <Tab
        key="tab1"
        label="Onglet 1"
        icon={<RiAlertFill />}
        iconClassName="text-warning-1"
        iconPosition="right"
        title="Contenu infobulle 1"
      >
        contenu onglet 1
      </Tab>,
      <Tab
        key="tab2"
        label="Onglet 2"
        icon={<RiCheckboxCircleFill />}
        iconClassName="text-success-3"
        iconPosition="right"
        title="Contenu infobulle 2"
      >
        contenu onglet 2
      </Tab>,
    ],
  },
};

export const TailleSM: Story = {
  args: {
    defaultActiveTab: 1,
    size: 'sm',
    children: AvecIcones.args.children,
  },
};

export const TailleXS: Story = {
  args: {
    defaultActiveTab: 1,
    size: 'xs',
    children: AvecIcones.args.children,
  },
};

export const AvecStyles: Story = {
  args: {
    defaultActiveTab: 2,
    tabsListClassName: 'bg-secondary-1 mb-0 rounded-none',
    tabPanelClassName: 'border-2 border-secondary-1 p-4',
    children: AvecIcones.args.children,
  },
};

export const AvecBeaucoupOnglets: Story = {
  args: {
    defaultActiveTab: 1,
    children: [
      ...AvecIcones.args.children,
      <Tab key="tab4" label="Onglet 4" icon={<RiLockFill />}>
        contenu onglet 4
      </Tab>,
      <Tab key="tab5" label="Onglet 5" icon={<RiUserLine />}>
        contenu onglet 5
      </Tab>,
      <Tab key="tab6" label="Onglet 6" icon={<RiChat1Line />}>
        contenu onglet 6
      </Tab>,
    ],
  },
};
