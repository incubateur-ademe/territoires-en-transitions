import '@testing-library/jest-dom/vitest';

import { appLabels } from '@/app/labels/catalog';
import type { PcaetInstructionPartie } from '@tet/domain/demarches';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EtapesInstructionNav } from './etapes-instruction.nav';

const DOSSIER_PATH = '/collectivite/4147/instruction/41';
const TOPICS = ['ges', 'energie', 'vulnerabilite'];

const renderNav = (
  etape: PcaetInstructionPartie,
  currentTopicCode: string | null = null,
  topicCodes: string[] = TOPICS
) =>
  render(
    <EtapesInstructionNav
      dossierPath={DOSSIER_PATH}
      etape={etape}
      topicCodes={topicCodes}
      currentTopicCode={currentTopicCode}
    />
  );

const hrefDe = (name: string): string | null =>
  screen.queryByRole('link', { name })?.getAttribute('href') ?? null;

describe('EtapesInstructionNav', () => {
  it('à l’ouverture du dossier, ne propose que le volet suivant du diagnostic', () => {
    renderNav('diagnostic');

    expect(hrefDe(appLabels.demarcheStepsNavPrevious)).toBeNull();
    expect(hrefDe(appLabels.demarcheStepsNavNext)).toBe(
      `${DOSSIER_PATH}?topic=energie`
    );
  });

  it('du dernier volet du diagnostic, mène aux documents', () => {
    renderNav('diagnostic', 'vulnerabilite');

    expect(hrefDe(appLabels.demarcheStepsNavPrevious)).toBe(
      `${DOSSIER_PATH}?topic=energie`
    );
    expect(hrefDe(appLabels.demarcheStepsNavNext)).toBe(
      `${DOSSIER_PATH}?etape=documents`
    );
  });

  it('des documents, revient au dernier volet et mène au programme d’actions', () => {
    renderNav('documents');

    expect(hrefDe(appLabels.demarcheStepsNavPrevious)).toBe(
      `${DOSSIER_PATH}?topic=vulnerabilite`
    );
    expect(hrefDe(appLabels.demarcheStepsNavNext)).toBe(
      `${DOSSIER_PATH}?etape=plan`
    );
  });

  it('sur le programme d’actions, ne garde que le retour', () => {
    renderNav('plan');

    expect(hrefDe(appLabels.demarcheStepsNavPrevious)).toBe(
      `${DOSSIER_PATH}?etape=documents`
    );
    expect(hrefDe(appLabels.demarcheStepsNavNext)).toBeNull();
  });

  it('tant que le diagnostic n’est pas chargé, le traite comme une seule étape', () => {
    renderNav('documents', null, []);

    expect(hrefDe(appLabels.demarcheStepsNavPrevious)).toBe(DOSSIER_PATH);
  });
});
