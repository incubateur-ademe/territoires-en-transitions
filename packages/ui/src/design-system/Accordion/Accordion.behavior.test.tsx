import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { Accordion } from './Accordion';

const TITLE = 'Critères de pertinence';
const CONTENT = 'Détail des critères';
const LINK_LABEL = 'Voir le plan';

const renderAccordion = ({
  initialState = false,
  additionalRightHeaderContent,
}: {
  initialState?: boolean;
  additionalRightHeaderContent?: ReactNode;
} = {}): void => {
  render(
    <Accordion
      id="criteres"
      title={TITLE}
      content={CONTENT}
      initialState={initialState}
      additionalRightHeaderContent={additionalRightHeaderContent}
    />
  );
};

const getHeader = (): HTMLElement =>
  screen.getByRole('button', { name: new RegExp(TITLE) });

describe('Accordion — clavier', () => {
  it("la touche Entrée sur l'en-tête affiche le contenu", () => {
    renderAccordion();

    fireEvent.keyDown(getHeader(), { key: 'Enter', code: 'Enter' });

    expect(getHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(CONTENT)).toBeVisible();
  });

  it("la touche Entrée sur l'en-tête déplié masque le contenu", () => {
    renderAccordion({ initialState: true });

    fireEvent.keyDown(getHeader(), { key: 'Enter', code: 'Enter' });

    expect(getHeader()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(CONTENT)).not.toBeInTheDocument();
  });

  it("la touche Espace sur l'en-tête affiche le contenu", () => {
    renderAccordion();

    fireEvent.keyDown(getHeader(), { key: ' ', code: 'Space' });

    expect(getHeader()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(CONTENT)).toBeVisible();
  });

  it("la touche Entrée sur un lien de l'en-tête n'est pas interceptée par l'accordéon", () => {
    renderAccordion({
      additionalRightHeaderContent: <a href="#plan">{LINK_LABEL}</a>,
    });

    const isDefaultActionKept = fireEvent.keyDown(
      screen.getByRole('link', { name: LINK_LABEL }),
      { key: 'Enter', code: 'Enter' }
    );

    expect(isDefaultActionKept).toBe(true);
  });

  it("la touche Espace sur un lien de l'en-tête déplie le contenu", () => {
    renderAccordion({
      additionalRightHeaderContent: <a href="#plan">{LINK_LABEL}</a>,
    });

    fireEvent.keyDown(screen.getByRole('link', { name: LINK_LABEL }), {
      key: ' ',
      code: 'Space',
    });

    expect(getHeader()).toHaveAttribute('aria-expanded', 'true');
  });
});
