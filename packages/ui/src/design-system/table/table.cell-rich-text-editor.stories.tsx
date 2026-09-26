import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, waitFor, within } from 'storybook/test';

import { TableCellRichTextEditor } from './table.cell-rich-text-editor';
import { TableRow } from './table.row';

const meta: Meta<typeof TableCellRichTextEditor> = {
  title: 'Design System/Table rich text cell',
  component: TableCellRichTextEditor,
  decorators: [
    (Story) => (
      <table className="w-[32rem] table-fixed">
        <tbody>
          <TableRow className="text-sm">
            <Story />
          </TableRow>
        </tbody>
      </table>
    ),
  ],
  args: {
    canEdit: false,
    initialValue:
      "<p><strong>État d'avancement</strong></p>" +
      '<p>La collectivité a défini sa politique environnementale et les objectifs de son plan climat. Les mesures sont suivies et évaluées chaque année avec les partenaires du territoire.</p>'.repeat(
        30
      ) +
      "<p>Fin du texte d'avancement.</p>",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const getReadOnlyContent = (canvasElement: HTMLElement) =>
  waitFor(() => {
    const content = canvasElement.ownerDocument.querySelector<HTMLElement>(
      '[data-test="table.rich-text.read-only-content"]'
    );
    if (!content) throw new Error('Le texte complet doit être ouvert');
    return content;
  });

export const ReadOnly: Story = {
  args: { onValueChange: fn() },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    await expect(
      await canvas.findByRole('img', { name: 'Texte tronqué' })
    ).toBeVisible();

    const cell = canvas.getByRole('cell');
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(cell);
    const content = await getReadOnlyContent(canvasElement);
    const lastParagraph = within(content).getByText(
      "Fin du texte d'avancement."
    );
    lastParagraph.scrollIntoView();
    await expect(lastParagraph).toBeVisible();
    const closeButton = body.getByRole('button', { name: 'Fermer' });
    await expect(closeButton).toBeVisible();
    const scrollContent = content.parentElement;
    if (!scrollContent) throw new Error('Expected a scrollable popover');
    await expect(scrollContent.scrollTop).toBeGreaterThan(0);
    await expect(
      lastParagraph.getBoundingClientRect().bottom
    ).toBeLessThanOrEqual(scrollContent.getBoundingClientRect().bottom + 1);
    const closeBounds = closeButton.getBoundingClientRect();
    await expect(closeBounds.top).toBeGreaterThanOrEqual(0);
    await expect(closeBounds.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(closeBounds.bottom).toBeLessThanOrEqual(window.innerHeight);
    await userEvent.click(closeButton);
    await waitFor(() =>
      expect(body.queryByRole('button', { name: 'Fermer' })).toBeNull()
    );
    await expect(cell).toHaveFocus();
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

export const Editable: Story = {
  args: { canEdit: true },
};

export const ShortReadOnly: Story = {
  args: { initialValue: '<p>Une mesure en cours.</p>' },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('img', { name: 'Texte tronqué' })
    ).toBeNull();
  },
};

export const ShortEditable: Story = {
  args: { canEdit: true, initialValue: '<p>Une mesure en cours.</p>' },
};

export const EmptyReadOnly: Story = {
  args: { initialValue: '' },
};

export const LongTextAfterEditing: Story = {
  args: { canEdit: true, onValueChange: fn() },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const cell = canvas.getByRole('cell');
    const initialHeight = cell.getBoundingClientRect().height;
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(cell);
    const editor = await body.findByRole('textbox', {}, { timeout: 10_000 });
    await waitFor(() => expect(editor).toHaveFocus());
    await userEvent.type(editor, ' Modification pour tester la troncature.');
    await waitFor(() =>
      expect(cell).toHaveTextContent('Modification pour tester la troncature.')
    );
    editor.scrollIntoView({ block: 'end' });
    const closeButton = body.getByRole('button', { name: 'Fermer' });
    const closeBounds = closeButton.getBoundingClientRect();
    await expect(closeBounds.top).toBeGreaterThanOrEqual(0);
    await expect(closeBounds.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(closeBounds.bottom).toBeLessThanOrEqual(window.innerHeight);
    await userEvent.click(closeButton);

    await waitFor(() => expect(body.queryByRole('textbox')).toBeNull());
    await expect(args.onValueChange).toHaveBeenCalledWith(
      expect.stringContaining('Modification pour tester la troncature.')
    );
    await expect(
      await canvas.findByRole('img', { name: 'Texte tronqué' })
    ).toBeVisible();
    await expect(cell.getBoundingClientRect().height).toBeLessThanOrEqual(
      initialHeight + 1
    );
  },
};

export const SavedListsReadOnly: Story = {
  args: {
    initialValue:
      '<div class="bn-block-group" data-node-type="blockGroup"><div class="bn-block-outer" data-node-type="blockOuter" data-id="71453f95-7bb9-48c8-8fc4-e1d225993cd6"><div class="bn-block" data-node-type="blockContainer" data-id="71453f95-7bb9-48c8-8fc4-e1d225993cd6"><div class="bn-block-content !p-0" data-content-type="numberedListItem" data-index="1"><p class="bn-inline-content !text-sm !text-grey-8 font-[Marianne]">Première étape</p></div></div></div><div class="bn-block-outer" data-node-type="blockOuter" data-id="82b413c8-8d4c-4cf9-b5ae-0ce59cf9c07c"><div class="bn-block" data-node-type="blockContainer" data-id="82b413c8-8d4c-4cf9-b5ae-0ce59cf9c07c"><div class="bn-block-content !p-0" data-content-type="numberedListItem" data-index="2"><p class="bn-inline-content !text-sm !text-grey-8 font-[Marianne]">Deuxième étape modifiée</p></div></div></div><div class="bn-block-outer" data-node-type="blockOuter"><div class="bn-block" data-node-type="blockContainer"><div class="bn-block-content !p-0" data-content-type="bulletListItem"><p class="bn-inline-content !text-sm !text-grey-8 font-[Marianne]">Une action</p></div><div class="bn-block-group" data-node-type="blockGroup"><div class="bn-block-outer" data-node-type="blockOuter"><div class="bn-block" data-node-type="blockContainer"><div class="bn-block-content !p-0" data-content-type="bulletListItem"><p class="bn-inline-content !text-sm !text-grey-8 font-[Marianne]">Une sous-action</p></div></div></div></div></div></div></div>',
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('cell'));
    const content = within(await getReadOnlyContent(canvasElement));
    const firstItem = content.getByText('Première étape');
    const secondItem = content.getByText('Deuxième étape modifiée');
    const bullet = content.getByText('Une action');
    const nestedBullet = content.getByText('Une sous-action');
    const marker = (element: HTMLElement) => {
      const block = element.parentElement;
      if (!block) throw new Error('Expected a saved BlockNote list item');
      return getComputedStyle(block, '::before').content;
    };

    await expect(marker(firstItem)).toBe('"1."');
    await expect(marker(secondItem)).toBe('"2."');
    await expect(marker(bullet)).toBe('"•"');
    await expect(marker(nestedBullet)).toBe('"◦"');
    await expect(nestedBullet.getBoundingClientRect().left).toBeGreaterThan(
      bullet.getBoundingClientRect().left
    );
    await expect(body.queryByRole('textbox')).toBeNull();
    await userEvent.click(body.getByRole('button', { name: 'Fermer' }));
  },
};

const LONG_URL = `https://exemple.fr/documents/${'Rapport2026'.repeat(35)}.pdf`;

export const LongUrlReadOnly: Story = {
  args: { initialValue: `<p>${LONG_URL}</p>` },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const cell = canvas.getByRole('cell');
    await expect(
      await canvas.findByRole('img', { name: 'Texte tronqué' })
    ).toBeVisible();
    const previewText = canvas.getByText(LONG_URL);
    await expect(previewText.scrollWidth).toBeLessThanOrEqual(
      previewText.clientWidth + 1
    );

    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(cell);
    const fullText = within(await getReadOnlyContent(canvasElement)).getByText(
      LONG_URL
    );
    await expect(fullText.scrollWidth).toBeLessThanOrEqual(
      fullText.clientWidth + 1
    );
    await expect(fullText.getBoundingClientRect().height).toBeGreaterThan(
      cell.getBoundingClientRect().height
    );
    await userEvent.click(body.getByRole('button', { name: 'Fermer' }));
  },
};
