import { appLabels } from '@/app/labels/catalog';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiImportProgress } from './ai-import-progress';
import { ImportStepView } from './ai-import-steps.model';

const renderProgress = (steps: ImportStepView[], withSecteurs = false) =>
  render(<AiImportProgress steps={steps} withSecteurs={withSecteurs} />);

const listedSteps = () =>
  within(screen.getByRole('list', { name: appLabels.importPlanIaEtapesTitre }))
    .getAllByRole('listitem')
    .map((item) => [item.textContent, item.dataset.status]);

describe('AiImportProgress', () => {
  it('liste les etapes avec leur etat, sans les etapes sautees', () => {
    renderProgress([
      { name: 'reading', status: 'done' },
      { name: 'scouting', status: 'skipped' },
      { name: 'extraction', status: 'current' },
      { name: 'qualitativeReview', status: 'waiting' },
    ]);

    expect(listedSteps()).toEqual([
      [
        `${appLabels.importPlanIaEtapeLecture} (${appLabels.importPlanIaEtapeTerminee})`,
        'done',
      ],
      [
        `${appLabels.importPlanIaEtapeExtraction} (${appLabels.importPlanIaEtapeEnCours})`,
        'current',
      ],
      [
        `${appLabels.importPlanIaEtapeRevue} (${appLabels.importPlanIaEtapeEnAttente})`,
        'waiting',
      ],
    ]);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each([
    [true, appLabels.importPlanIaEtapeSecteurs],
    [false, appLabels.importPlanIaEtapeEffetsAttendus],
  ])(
    "nomme l'etape des secteurs selon le plan (PCAET : %s)",
    (withSecteurs, label) => {
      renderProgress([{ name: 'secteurs', status: 'current' }], withSecteurs);

      expect(listedSteps()).toEqual([
        [`${label} (${appLabels.importPlanIaEtapeEnCours})`, 'current'],
      ]);
    }
  );
});
