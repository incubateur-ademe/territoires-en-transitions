import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageHeader } from './PageHeader';
import { PageHeaderStickyHeightProvider } from './sticky-header-height.context';

describe('PageHeader — structure', () => {
  it('rend une <section> avec aria-labelledby pointant vers le h1 du Title', () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    const section = screen.getByRole('region');
    const heading = screen.getByRole('heading', { level: 1, name: 'Mon header' });
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('propage dataTest sur la section racine', () => {
    render(
      <PageHeader dataTest="my-header">
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    expect(screen.getByRole('region')).toHaveAttribute('data-test', 'my-header');
  });

  it('merge le className via cn', () => {
    render(
      <PageHeader className="bg-grey-2">
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    expect(screen.getByRole('region')).toHaveClass('bg-grey-2');
  });

  it('rend les slots dans leur ordre canonique : Title+Actions row / Subtitle / Metadata', () => {
    render(
      <PageHeader>
        <PageHeader.Metadata>
          <span>meta-content</span>
        </PageHeader.Metadata>
        <PageHeader.Subtitle>
          <span>breadcrumbs-content</span>
        </PageHeader.Subtitle>
        <PageHeader.Actions>
          <button type="button">action</button>
        </PageHeader.Actions>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    const section = screen.getByRole('region');
    const titleText = section.textContent ?? '';
    const titleIndex = titleText.indexOf('Mon header');
    const actionIndex = titleText.indexOf('action');
    const breadcrumbsIndex = titleText.indexOf('breadcrumbs-content');
    const metadataIndex = titleText.indexOf('meta-content');
    expect(titleIndex).toBeLessThan(actionIndex);
    expect(actionIndex).toBeLessThan(breadcrumbsIndex);
    expect(breadcrumbsIndex).toBeLessThan(metadataIndex);
  });
});

describe('PageHeader — dividers internes autour de Metadata', () => {
  it("rend un trailing divider quand Metadata est absent (non-compact)", () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    expect(document.querySelectorAll('hr')).toHaveLength(1);
  });

  it("n'affiche aucun divider quand Metadata est absent et compact (la section border-b joue ce rôle)", () => {
    render(
      <PageHeader compact>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    expect(document.querySelectorAll('hr')).toHaveLength(0);
  });

  it('encadre Metadata par 2 dividers quand il est présent', () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
        <PageHeader.Metadata>
          <span>meta</span>
        </PageHeader.Metadata>
      </PageHeader>
    );
    expect(document.querySelectorAll('hr')).toHaveLength(2);
  });
});

describe('PageHeader.Title — mode statique (children)', () => {
  it('émet un <h1> quand children est du texte', () => {
    render(
      <PageHeader>
        <PageHeader.Title>Référentiel CAE</PageHeader.Title>
      </PageHeader>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Référentiel CAE' })
    ).toBeInTheDocument();
  });

  it("émet un <h1> quand children est un fragment de texte", () => {
    render(
      <PageHeader>
        <PageHeader.Title>
          Référentiel {'CAE'}
        </PageHeader.Title>
      </PageHeader>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Référentiel CAE' })
    ).toBeInTheDocument();
  });

});

describe('PageHeader.Metadata — prop visibleWhen', () => {
  it('skippe le slot et ses dividers quand visibleWhen=false', () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
        <PageHeader.Metadata visibleWhen={false}>
          <span>contenu</span>
        </PageHeader.Metadata>
      </PageHeader>
    );
    expect(screen.queryByText('contenu')).toBeNull();
    expect(document.querySelectorAll('hr')).toHaveLength(1);
  });
});

describe('PageHeader.EditableTitle', () => {
  it('rend un EditableTitle (h1 + édition au clic)', () => {
    const onUpdate = vi.fn();
    render(
      <PageHeader>
        <PageHeader.EditableTitle
          title="Mon plan"
          isReadonly={false}
          onUpdate={onUpdate}
        />
      </PageHeader>
    );
    const heading = screen.getByRole('heading', { level: 1, name: 'Mon plan' });
    fireEvent.click(heading);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('câble aria-labelledby de la section vers le h1 de EditableTitle', () => {
    render(
      <PageHeader>
        <PageHeader.EditableTitle
          title="Mon plan"
          isReadonly={false}
          onUpdate={vi.fn()}
        />
      </PageHeader>
    );
    const section = screen.getByRole('region');
    const heading = screen.getByRole('heading', { level: 1, name: 'Mon plan' });
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it("respecte isReadonly (pas d'ouverture au clic, pas de bouton)", () => {
    render(
      <PageHeader>
        <PageHeader.EditableTitle
          title="Mon plan"
          isReadonly={true}
          onUpdate={vi.fn()}
        />
      </PageHeader>
    );
    fireEvent.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('expose un bouton avec aria-haspopup=dialog quand editable', () => {
    render(
      <PageHeader>
        <PageHeader.EditableTitle
          title="Mon plan"
          isReadonly={false}
          onUpdate={vi.fn()}
        />
      </PageHeader>
    );
    const button = screen.getByRole('button', { name: 'Modifier le titre' });
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('forwarde placeholder au EditableTitle', () => {
    render(
      <PageHeader>
        <PageHeader.EditableTitle
          title=""
          isReadonly={false}
          onUpdate={vi.fn()}
          placeholder="Nom de l'indicateur"
        />
      </PageHeader>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le titre' }));
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', "Nom de l'indicateur");
  });

  it('le textarea a un aria-label et est associé au compteur via aria-describedby', () => {
    render(
      <PageHeader>
        <PageHeader.EditableTitle
          title="Plan"
          isReadonly={false}
          onUpdate={vi.fn()}
        />
      </PageHeader>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le titre' }));
    const textarea = screen.getByRole('textbox', { name: 'Modifier le titre' });
    const describedById = textarea.getAttribute('aria-describedby');
    expect(describedById).not.toBeNull();
    if (describedById !== null) {
      expect(document.getElementById(describedById)).not.toBeNull();
    }
  });
});

describe('PageHeader — slot Navigation', () => {
  it('rend Navigation comme landmark <nav> nommé via label, avant la rangée Title', () => {
    render(
      <PageHeader>
        <PageHeader.Navigation label="Navigation entre mesures">
          <a href="/prev">previous-link</a>
        </PageHeader.Navigation>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    const nav = screen.getByRole('navigation', {
      name: 'Navigation entre mesures',
    });
    expect(nav).toBeInTheDocument();
    const section = screen.getByRole('region');
    const textContent = section.textContent ?? '';
    expect(textContent.indexOf('previous-link')).toBeLessThan(
      textContent.indexOf('Mon header')
    );
  });

  it("n'ajoute pas de landmark Navigation si le slot est absent", () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('PageHeader — mode compact', () => {
  it('applique les styles compacts (py-2, gap-1, border-b) sur la section quand compact=true', () => {
    render(
      <PageHeader compact>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    const section = screen.getByRole('region');
    expect(section).toHaveClass(
      'py-2',
      'gap-1',
      'border-b',
      'border-primary-3',
      'bg-grey-2'
    );
  });

  it("n'applique pas les styles compacts quand compact est absent", () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    const section = screen.getByRole('region');
    expect(section).not.toHaveClass('py-2');
    expect(section).not.toHaveClass('border-b');
  });

  it("supprime le divider trailing du dernier Metadata en mode compact (la section border-b joue ce rôle)", () => {
    render(
      <PageHeader compact>
        <PageHeader.Title>Mon header</PageHeader.Title>
        <PageHeader.Metadata>
          <span>row-1</span>
        </PageHeader.Metadata>
        <PageHeader.Metadata>
          <span>row-2</span>
        </PageHeader.Metadata>
      </PageHeader>
    );
    expect(document.querySelectorAll('hr')).toHaveLength(2);
  });
});

describe('PageHeader — mode sticky', () => {
  let pin: (isSticky: boolean) => void;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          pin = (isSticky) => cb([{ isIntersecting: !isSticky }]);
        }
        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return [];
        }
      }
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enveloppe la section dans un conteneur sticky quand sticky=true', () => {
    render(
      <PageHeaderStickyHeightProvider>
        <PageHeader sticky>
          <PageHeader.Title>Mon header</PageHeader.Title>
        </PageHeader>
      </PageHeaderStickyHeightProvider>
    );
    expect(screen.getByRole('region').closest('.sticky')).not.toBeNull();
  });

  it("n'ajoute pas de conteneur sticky quand sticky est absent", () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
      </PageHeader>
    );
    expect(screen.getByRole('region').closest('.sticky')).toBeNull();
  });

  it("notifie onStickyChange(false) au montage puis (true) quand le header s'épingle", () => {
    const onStickyChange = vi.fn();
    render(
      <PageHeaderStickyHeightProvider>
        <PageHeader sticky onStickyChange={onStickyChange}>
          <PageHeader.Title>Mon header</PageHeader.Title>
        </PageHeader>
      </PageHeaderStickyHeightProvider>
    );
    expect(onStickyChange).toHaveBeenLastCalledWith(false);
    act(() => pin(true));
    expect(onStickyChange).toHaveBeenLastCalledWith(true);
  });

  it('applique le style compact uniquement quand le header est épinglé', () => {
    render(
      <PageHeaderStickyHeightProvider>
        <PageHeader sticky>
          <PageHeader.Title>Mon header</PageHeader.Title>
        </PageHeader>
      </PageHeaderStickyHeightProvider>
    );
    const section = screen.getByRole('region');
    expect(section).not.toHaveClass('py-2');
    act(() => pin(true));
    expect(section).toHaveClass('py-2', 'border-b', 'bg-grey-2');
  });
});

describe('PageHeader — Metadata multi-lignes', () => {
  it('encadre 2 lignes Metadata avec 3 dividers', () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
        <PageHeader.Metadata>
          <span>row-1</span>
        </PageHeader.Metadata>
        <PageHeader.Metadata>
          <span>row-2</span>
        </PageHeader.Metadata>
      </PageHeader>
    );
    expect(document.querySelectorAll('hr')).toHaveLength(3);
  });

  it('rend les lignes Metadata dans leur ordre de déclaration', () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
        <PageHeader.Metadata>
          <span>row-A</span>
        </PageHeader.Metadata>
        <PageHeader.Metadata>
          <span>row-B</span>
        </PageHeader.Metadata>
      </PageHeader>
    );
    const text = screen.getByRole('region').textContent ?? '';
    expect(text.indexOf('row-A')).toBeLessThan(text.indexOf('row-B'));
  });
});

describe('PageHeader — slots optionnels et conditionnels', () => {
  it("ne rend que la rangée Title+Actions + un trailing divider quand Subtitle et Metadata sont absents", () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
        <PageHeader.Actions>
          <button type="button">action</button>
        </PageHeader.Actions>
      </PageHeader>
    );
    expect(document.querySelectorAll('hr')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'action' })).toBeInTheDocument();
  });

  it("supporte le conditional rendering ({cond && <slot/>})", () => {
    const showActions = false;
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
        {showActions && (
          <PageHeader.Actions>
            <button type="button">action</button>
          </PageHeader.Actions>
        )}
        <PageHeader.Metadata>
          <span>meta</span>
        </PageHeader.Metadata>
      </PageHeader>
    );
    expect(screen.queryByRole('button', { name: 'action' })).toBeNull();
    expect(document.querySelectorAll('hr')).toHaveLength(2);
  });

  it("rend la chaîne canonique Title / Subtitle / divider / Metadata / divider", () => {
    render(
      <PageHeader>
        <PageHeader.Title>Mon header</PageHeader.Title>
        <PageHeader.Subtitle>
          <nav aria-label="Fil d'Ariane">
            <ol>
              <li>Accueil</li>
            </ol>
          </nav>
        </PageHeader.Subtitle>
        <PageHeader.Metadata>
          <span>meta</span>
        </PageHeader.Metadata>
      </PageHeader>
    );
    expect(
      screen.getByRole('navigation', { name: "Fil d'Ariane" })
    ).toBeInTheDocument();
    expect(document.querySelectorAll('hr')).toHaveLength(2);
  });
});
