import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../../Button';
import { DropdownFloater } from './DropdownFloater';

const meta = {
  title: 'Design System/DropdownFloater',
  component: DropdownFloater,
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  args: {
    hasTriggerButton: true,
    children: <Button variant="outlined">Ouvrir les actions</Button>,
    render: ({ close }) => (
      <div role="group" aria-label="Actions disponibles">
        {Array.from({ length: 12 }, (_, index) => (
          <Button
            key={index}
            variant="unstyled"
            className="h-10 w-full justify-start px-4 text-sm"
            onClick={close}
          >
            {`Action ${index + 1}`}
          </Button>
        ))}
      </div>
    ),
  },
} satisfies Meta<typeof DropdownFloater>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MaxHeightPixels: Story = {
  args: { containerMaxHeight: 182 },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Ouvrir les actions' });
    await userEvent.click(trigger);
    const actions = body.getByRole('group', { name: 'Actions disponibles' });
    const viewport = actions.parentElement;
    if (!viewport) throw new Error('Expected an open dropdown');
    const fifthAction = within(actions).getByRole('button', {
      name: 'Action 5',
    });

    await waitFor(() => {
      const menuBounds = viewport.getBoundingClientRect();
      const actionBounds = fifthAction.getBoundingClientRect();
      expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
      expect(menuBounds.bottom).toBeGreaterThan(actionBounds.top);
      expect(menuBounds.bottom).toBeLessThan(actionBounds.bottom);
    });

    const lastAction = within(actions).getByRole('button', {
      name: 'Action 12',
    });
    lastAction.scrollIntoView({ block: 'nearest' });
    await expect(viewport.scrollTop).toBeGreaterThan(0);
    await userEvent.click(lastAction);
    await expect(
      body.queryByRole('group', { name: 'Actions disponibles' })
    ).toBeNull();
    await userEvent.click(trigger);
  },
};

export const MaxHeightCss: Story = {
  ...MaxHeightPixels,
  args: { containerMaxHeight: 'calc(4.5 * 2.5rem + 2px)' },
};

export const PortalNearViewportBottom: Story = {
  args: { containerMaxHeight: 182, renderInPortal: true },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="fixed bottom-6 right-6 w-64">
      <DropdownFloater {...args} />
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Ouvrir les actions' });
    await userEvent.click(trigger);
    const actions = body.getByRole('group', { name: 'Actions disponibles' });
    const viewport = actions.parentElement;
    if (!viewport) throw new Error('Expected an open dropdown');

    await waitFor(() => {
      const bounds = viewport.getBoundingClientRect();
      expect(bounds.height).toBeGreaterThan(180);
      expect(bounds.bottom).toBeLessThanOrEqual(
        trigger.getBoundingClientRect().top
      );
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
    });
    await userEvent.keyboard('{Escape}');
    await expect(
      body.queryByRole('group', { name: 'Actions disponibles' })
    ).toBeNull();
    await userEvent.click(trigger);
  },
};
