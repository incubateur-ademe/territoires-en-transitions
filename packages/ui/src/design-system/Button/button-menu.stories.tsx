import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ComponentProps, useState } from 'react';
import { expect, fn, waitFor, within } from 'storybook/test';

import { Field } from '../Field';
import { Icon } from '../Icon';
import { Input } from '../Input';
import { Button } from './Button';
import { ButtonMenu, MenuSeparator } from './button-menu';

const actions = [
  {
    icon: 'edit-line',
    label: "Éditer l'action",
    onClick: () => {
      console.log('Action 1');
    },
  },
  {
    icon: 'download-line',
    label: 'Télécharger le document',
    onClick: () => {
      console.log('Action 2');
    },
  },
  {
    icon: 'seedling-line',
    label: 'Planter un arbre dans la forêt',
    onClick: () => console.log('Planter un arbre'),
    disabled: true,
  },
  {
    icon: 'shapes-line',
    label: 'Créer un module',
    onClick: () => console.log('Créer un module'),
  },
  {
    icon: 'bug-line',
    label: 'Signaler un bug',
    href: '/',
    onClick: () => console.log('Signaler un bug'),
  },
  {
    icon: 'book-line',
    label: 'Consulter la documentation',
    href: 'https://aide.territoiresentransitions.fr/fr/',
    onClick: () => console.log('Consulter la documentation'),
    disabled: true,
  },
];

const meta: Meta<typeof ButtonMenu> = {
  component: ButtonMenu,
  args: {
    icon: 'menu-2-line',
    variant: 'grey',
    size: 'sm',
    menu: { actions },
  },
};

export default meta;

type Story = StoryObj<typeof ButtonMenu>;

export const Default: Story = {};

export const WithCustomContentAndActions: Story = {
  args: {
    icon: undefined,
    withArrow: true,
    children: 'Menu Button',
    menu: {
      actions: actions.map((a) =>
        a.label === 'Créer un module' ? { ...a, isVisible: false } : a
      ),
      startContent: (
        <div className="p-3 bg-primary-1 text-sm text-primary-7 rounded">
          Contenu personnalisé
        </div>
      ),
      endContent: (
        <div className="flex gap-1 px-2 text-grey-8 text-xs">
          <Icon icon="information-line" size="xs" className="text-[0.75rem]" />
          <span>Informations supplémentaires pour donner plus de contexte</span>
        </div>
      ),
    },
  },
};

export const OnlyCustomContent: Story = {
  args: {
    menu: {
      className: 'max-w-none p-0',
      startContent: (
        <div className="w-[50vw] h-96 p-8 bg-success-2 text-sm text-success-1 rounded">
          Contenu personnalisé seul
        </div>
      ),
    },
  },
};

export const WithSeparator: Story = {
  args: {
    menu: {
      className: 'max-w-none p-0',
      actions: [actions[0], MenuSeparator, actions[1]],
    },
  },
};

const selectResultat = fn();
const selectObjectif = fn();

export const KeyboardSelection: Story = {
  name: 'Sélection au clavier et retour au bouton',
  args: {
    icon: undefined,
    children: 'Ajouter une donnée',
    menu: {
      actions: [
        { label: 'Action indisponible', disabled: true },
        { label: 'Résultat', onClick: selectResultat },
        MenuSeparator,
        { label: 'Autre action indisponible', disabled: true },
        { label: 'Action masquée', isVisible: false },
        { label: 'Lien indisponible', href: '/', disabled: true },
        { label: 'Objectif', onClick: selectObjectif },
      ],
    },
  },
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Ajouter une donnée' });
    trigger.focus();

    await step(
      'Les flèches parcourent les actions disponibles et Entrée choisit Résultat',
      async () => {
        await userEvent.keyboard('{Enter}');
        const resultat = await body.findByRole('button', { name: 'Résultat' });
        await waitFor(() => expect(resultat).toHaveFocus());
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(trigger).toHaveAttribute('aria-controls');
        await expect(
          body.getByRole('button', { name: 'Action indisponible' })
        ).toBeDisabled();
        await expect(
          body.queryByRole('button', { name: 'Action masquée' })
        ).toBeNull();
        await expect(
          body.queryByRole('link', { name: 'Lien indisponible' })
        ).toBeNull();

        await userEvent.keyboard('{ArrowDown}');
        await expect(
          body.getByRole('button', { name: 'Objectif' })
        ).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}');
        await expect(resultat).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        await expect(
          body.getByRole('button', { name: 'Objectif' })
        ).toHaveFocus();
        await userEvent.keyboard('{ArrowUp}');
        await expect(resultat).toHaveFocus();

        await userEvent.keyboard('{Enter}');
        await expect(selectResultat).toHaveBeenCalledOnce();
        await expect(selectObjectif).not.toHaveBeenCalled();
        await waitFor(() => expect(trigger).toHaveFocus());
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(trigger).not.toHaveAttribute('aria-controls');
      }
    );

    await step(
      'Espace ouvre le menu, Tab puis Entrée choisissent Objectif',
      async () => {
        await userEvent.keyboard(' ');
        await waitFor(() =>
          expect(body.getByRole('button', { name: 'Résultat' })).toHaveFocus()
        );
        await userEvent.tab();
        await expect(
          body.getByRole('button', { name: 'Objectif' })
        ).toHaveFocus();
        await userEvent.keyboard('{Enter}');

        await expect(selectObjectif).toHaveBeenCalledOnce();
        await waitFor(() => expect(trigger).toHaveFocus());
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(
          body.queryByRole('button', { name: 'Objectif' })
        ).toBeNull();
      }
    );
  },
};

export const KeyboardDismissal: Story = {
  name: 'Échap, tabulation et clic à l’extérieur',
  args: {
    icon: undefined,
    children: 'Ajouter une donnée',
    menu: { actions: [{ label: 'Résultat' }, { label: 'Objectif' }] },
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <Button variant="outlined">Avant le menu</Button>
      <ButtonMenu {...args} />
      <Button variant="outlined">Après le menu</Button>
    </div>
  ),
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    const body = within(canvasElement.ownerDocument.body);
    const before = canvas.getByRole('button', { name: 'Avant le menu' });
    const trigger = canvas.getByRole('button', { name: 'Ajouter une donnée' });
    const after = canvas.getByRole('button', { name: 'Après le menu' });
    before.focus();
    await userEvent.tab();
    await expect(trigger).toHaveFocus();

    await step('Échap referme le menu et revient au bouton', async () => {
      await userEvent.keyboard('{Enter}');
      await waitFor(() =>
        expect(body.getByRole('button', { name: 'Résultat' })).toHaveFocus()
      );
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveFocus());
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(body.queryByRole('button', { name: 'Résultat' })).toBeNull();
    });

    await step(
      'Tab quitte le menu et poursuit dans l’ordre de la page',
      async () => {
        await userEvent.keyboard('{Enter}');
        await waitFor(() =>
          expect(body.getByRole('button', { name: 'Résultat' })).toHaveFocus()
        );
        await userEvent.tab();
        await expect(
          body.getByRole('button', { name: 'Objectif' })
        ).toHaveFocus();
        await userEvent.tab();
        await waitFor(() => expect(after).toHaveFocus());
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await userEvent.tab({ shift: true });
        await expect(trigger).toHaveFocus();
      }
    );

    await step(
      'Un clic à l’extérieur conserve le focus sur sa cible',
      async () => {
        await userEvent.click(trigger);
        await waitFor(() =>
          expect(body.getByRole('button', { name: 'Résultat' })).toHaveFocus()
        );
        await userEvent.click(after);
        await expect(after).toHaveFocus();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(
          body.queryByRole('button', { name: 'Résultat' })
        ).toBeNull();
      }
    );
  },
};

const RenderMenuWithEditor = (args: ComponentProps<typeof ButtonMenu>) => {
  const [field, setField] = useState<string | null>(null);
  return (
    <div className="flex max-w-sm flex-col gap-4">
      {field ? (
        <Field title={field}>
          <Input
            type="text"
            aria-label={field}
            autoFocus
            onBlur={() => setField(null)}
          />
        </Field>
      ) : (
        <ButtonMenu
          {...args}
          menu={{
            ...args.menu,
            actions: ['Résultat', 'Objectif'].map((label) => ({
              label,
              onClick: () => setField(label),
            })),
          }}
        />
      )}
      <Button variant="outlined" onClick={() => setField(null)}>
        Réinitialiser
      </Button>
    </div>
  );
};

export const OpensEditor: Story = {
  name: 'Le champ ouvert par une action conserve le focus',
  args: {
    icon: undefined,
    children: 'Ajouter une donnée',
  },
  render: (args) => <RenderMenuWithEditor {...args} />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    canvas.getByRole('button', { name: 'Ajouter une donnée' }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(body.getByRole('button', { name: 'Résultat' })).toHaveFocus()
    );
    await userEvent.tab();
    await expect(body.getByRole('button', { name: 'Objectif' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    const input = await canvas.findByRole('textbox', { name: 'Objectif' });
    await waitFor(() => expect(input).toHaveFocus());
    // Typing without clicking catches focus being stolen when the menu unmounts.
    await userEvent.keyboard('42');
    await expect(input).toHaveValue('42');
    await expect(input).toHaveFocus();
    await expect(
      canvas.queryByRole('button', { name: 'Ajouter une donnée' })
    ).toBeNull();
  },
};
