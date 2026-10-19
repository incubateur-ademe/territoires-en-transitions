import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Field } from '../Field';
import { Header } from '../Header';
import { Modal } from '../Modal';
import { SelectFilter } from '../Select/SelectFilter';
import { OptionValue } from '../Select/utils';
import { Button } from './Button';
import { ButtonMenu } from './button-menu';

const FilterContent = () => {
  const [values, setValues] = useState<OptionValue[]>([]);

  return (
    <div className="h-[70vh] w-80 p-4 flex flex-col gap-4">
      <Field title="Personne pilote" className="flex-grow-0">
        <SelectFilter
          values={values}
          options={[{ value: 'pilote', label: 'Camille Martin' }]}
          onChange={({ values }) => setValues(values ?? [])}
        />
      </Field>
      <output aria-label="Nombre de pilotes">{values.length}</output>
      <Modal title="Options des filtres">
        <Button variant="outlined">Options des filtres</Button>
      </Modal>
    </div>
  );
};

const meta = {
  title: 'Design System/ButtonMenu/Stacking',
  component: ButtonMenu,
  parameters: { layout: 'fullscreen' },
  args: {
    children: 'Filtrer',
    icon: 'equalizer-line',
    variant: 'outlined',
    size: 'sm',
    menu: {
      className: 'max-w-lg',
      startContent: <FilterContent />,
    },
  },
  render: (args) => (
    <>
      <Header
        mainNav={{ startItems: [{ children: 'Plans & Actions', href: '/' }] }}
      />
      <div className="fixed top-[65vh] right-6">
        <ButtonMenu {...args} />
      </div>
    </>
  ),
} satisfies Meta<typeof ButtonMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Visibility assertions alone do not detect an element covered by the header.
const expectReceivesPointer = (element: HTMLElement) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  expect(
    element.contains(
      element.ownerDocument.elementFromPoint(left + width / 2, top + height / 2)
    )
  ).toBe(true);
};

export const FiltersAboveHeader: Story = {
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const body = within(canvasElement.ownerDocument.body);
    const header = canvas.getByRole('banner');
    const trigger = canvas.getByRole('button', { name: 'Filtrer' });
    await userEvent.click(trigger);
    const select = await body.findByRole('button', { name: 'ouvrir le menu' });

    await step(
      'Les filtres ouverts vers le haut restent accessibles',
      async () => {
        await waitFor(() => {
          expect(select.getBoundingClientRect().top).toBeLessThan(
            header.getBoundingClientRect().bottom
          );
          expect(select.getBoundingClientRect().bottom).toBeLessThan(
            trigger.getBoundingClientRect().top
          );
          expectReceivesPointer(select);
        });
      }
    );

    await step(
      'Une option reste sélectionnable au-dessus du bandeau et du panneau',
      async () => {
        await userEvent.click(select);
        const option = await body.findByRole('button', {
          name: 'Camille Martin',
        });
        await waitFor(() => {
          expect(option.getBoundingClientRect().top).toBeLessThan(
            header.getBoundingClientRect().bottom
          );
          expectReceivesPointer(option);
        });
        await userEvent.click(option);
        await expect(
          body.getByRole('status', { name: 'Nombre de pilotes' })
        ).toHaveTextContent('1');
        await userEvent.click(select);
      }
    );

    await step('Une modale recouvre les filtres et le bandeau', async () => {
      await userEvent.click(
        body.getByRole('button', { name: 'Options des filtres' })
      );
      const dialog = await body.findByRole('dialog', {
        name: 'Options des filtres',
      });
      const close = within(dialog).getByRole('button', { name: 'Fermer' });
      await waitFor(() => {
        expectReceivesPointer(close);
        const { left, top, width, height } = select.getBoundingClientRect();
        const overlay = dialog.parentElement;
        expect(
          overlay?.contains(
            canvasElement.ownerDocument.elementFromPoint(
              left + width / 2,
              top + height / 2
            )
          )
        ).toBe(true);
      });
      await userEvent.keyboard('{Escape}');
    });
  },
};
