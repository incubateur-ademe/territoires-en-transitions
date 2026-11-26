import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ImportAbandon } from './ai-import-abandon.alert';
import { AiImportReport } from './ai-import-report';

const abandon: ImportAbandon = {
  motif: 'aucune-action',
  evidence: [
    { citation: 'Synthèse des enjeux du territoire', page: 40 },
    { citation: 'Diagnostic des émissions', page: 12 },
  ],
  explanation: 'Ce document est le diagnostic du territoire.',
};

const renderReport = (
  report: Parameters<typeof AiImportReport>[0]['status']['report'],
  onRetry = vi.fn()
) => {
  render(
    <AiImportReport
      status={{
        status: 'failed',
        error: 'message composé par le serveur',
        report,
        createdPlanId: 12,
        content: null,
      }}
      onRetry={onRetry}
    />
  );
  return onRetry;
};

const abandonReport = (value: ImportAbandon) => ({
  issues: value.evidence.map(({ citation, page }) => ({
    kind: 'document-error' as const,
    code: `abandon:${value.motif}`,
    message: `Passage relevé par l'IA : « ${citation} »`,
    location: `p. ${page}`,
  })),
  qualitativeReview: null,
  abandon: value,
});

describe('AiImportReport, abandon motivé', () => {
  it("explique l'abandon en orange : problème, mots de l'IA, passages et pages, quoi faire", () => {
    renderReport(abandonReport(abandon));

    const alert = screen.getByRole('alert');
    expect(
      within(alert).getByText(appLabels.importPlanIaAbandonTitre)
    ).toBeTruthy();
    expect(
      within(alert).getByText(
        appLabels.importPlanIaAbandonProbleme['aucune-action']
      )
    ).toBeTruthy();
    expect(within(alert).getByText(`« ${abandon.explanation} »`)).toBeTruthy();
    for (const { citation, page } of abandon.evidence) {
      expect(within(alert).getByText(citation)).toBeTruthy();
      expect(
        within(alert).getByText(
          appLabels.importPlanIaAbandonPreuvePage({ page })
        )
      ).toBeTruthy();
    }
    for (const advice of appLabels.importPlanIaAbandonConseils[
      'aucune-action'
    ]) {
      expect(within(alert).getByText(advice)).toBeTruthy();
    }
    expect(screen.queryByText(appLabels.importPlanIaErreur)).toBeNull();
    expect(screen.queryByText('message composé par le serveur')).toBeNull();
    // Les passages ne sont pas répétés en remarques du compte rendu.
    expect(
      screen.queryByText(
        appLabels.importPlanIaRemarquePosition({ position: 1, total: 2 })
      )
    ).toBeNull();
  });

  it('relance avec un autre document', () => {
    const onRetry = renderReport(abandonReport(abandon));

    fireEvent.click(
      screen.getByRole('button', {
        name: appLabels.importPlanIaAbandonRelancer,
      })
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('chiffre les pages illisibles et donne les conseils de ce motif', () => {
    renderReport(
      abandonReport({
        motif: 'texte-illisible',
        evidence: [{ citation: 'Page de garde scannée', page: 1 }],
        explanation: '',
        readingStats: { pageCount: 30, unreadablePages: 11 },
      })
    );

    expect(document.body.textContent).toContain(
      appLabels.importPlanIaAbandonPagesIllisibles({
        unreadablePages: 11,
        pageCount: 30,
      })
    );
    expect(
      screen.queryByText(appLabels.importPlanIaAbandonExplication)
    ).toBeNull();
    for (const advice of appLabels.importPlanIaAbandonConseils[
      'texte-illisible'
    ]) {
      expect(screen.getByText(advice)).toBeTruthy();
    }
  });

  it('ne conseille pas, contre des grilles concurrentes, des précisions que le squelette ne lit pas', () => {
    renderReport(
      abandonReport({
        motif: 'grilles-concurrentes',
        evidence: [{ citation: 'Correspondance avec le guide', page: 4 }],
        explanation: '',
      })
    );

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain(
      appLabels.importPlanIaAbandonConseils['grilles-concurrentes'][0]
    );
    expect(alert.textContent).not.toMatch(/précisions/i);
  });

  it("garde l'erreur habituelle pour un échec sans abandon", () => {
    renderReport({ issues: [], qualitativeReview: null });

    expect(screen.getByText(appLabels.importPlanIaErreur)).toBeTruthy();
    expect(screen.queryByText(appLabels.importPlanIaAbandonTitre)).toBeNull();
  });
});
