import { appLabels } from '@/app/labels/catalog';
import { rapportFichier, rapportFichierManquant } from './rapports.fixture';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { RapportAudit } from '../data/use-list-rapports-by-audit';
import { PersistedRapportCard } from './rapport.card';

const { openPreuve } = vi.hoisted(() => ({ openPreuve: vi.fn() }));

vi.mock(
  '@/app/collectivites/documents/bibliotheque/use-open-preuve',
  (): Partial<
    Record<
      keyof typeof import('@/app/collectivites/documents/bibliotheque/use-open-preuve'),
      unknown
    >
  > => ({
    useOpenPreuve: () => openPreuve,
  })
);

const renderCard = (report: RapportAudit) =>
  render(
    <PersistedRapportCard
      report={report}
      isRemoving={false}
      onRemove={vi.fn()}
    />
  );

describe('PersistedRapportCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('un rapport introuvable porte le signalement de fichier indisponible', () => {
    renderCard(rapportFichierManquant);

    expect(screen.getByText(appLabels.fichierIndisponible)).toBeTruthy();
  });

  test('un rapport déposé ne porte aucun signalement', () => {
    renderCard(rapportFichier);

    expect(screen.queryByText(appLabels.fichierIndisponible)).toBeNull();
  });

  test("le nom d'un rapport introuvable n'est pas un bouton", () => {
    renderCard(rapportFichierManquant);

    expect(
      screen.queryByRole('button', { name: /^rapport-perdu\.pdf/ })
    ).toBeNull();
    expect(screen.getByText(/rapport-perdu\.pdf/)).toBeTruthy();
  });

  test('un clic sur le titre ouvre le rapport', () => {
    renderCard(rapportFichier);

    fireEvent.click(
      screen.getByRole('button', { name: /^rapport-audit\.pdf/ })
    );

    expect(openPreuve).toHaveBeenCalledWith(rapportFichier);
  });

  test("le titre n'ouvre plus le rapport pendant sa suppression", () => {
    render(
      <PersistedRapportCard
        report={rapportFichier}
        isRemoving
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /^rapport-audit\.pdf/ })
    );

    expect(openPreuve).not.toHaveBeenCalled();
  });
});
