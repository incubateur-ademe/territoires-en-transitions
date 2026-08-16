'use client';

import { appLabels } from '@/app/labels/catalog';
import type { PcaetInstructionPartie } from '@tet/domain/demarches';
import { Badge, cn, Icon } from '@tet/ui';
import type { ReactNode } from 'react';

export type EtapeInstruction = {
  key: PcaetInstructionPartie;
  label: string;
  description: string;
  isValidee: boolean;
};

export type EtapesInstructionSidePanelContentProps = {
  etapes: EtapeInstruction[];
  activeEtape: PcaetInstructionPartie;
  onSelect: (etape: PcaetInstructionPartie) => void;
  footer?: ReactNode;
};

export const EtapesInstructionSidePanelContent = ({
  etapes,
  activeEtape,
  onSelect,
  footer,
}: EtapesInstructionSidePanelContentProps) => (
  <div className="flex flex-col gap-3 p-4">
    {etapes.map((etape) => {
      const isActive = etape.key === activeEtape;

      return (
        <button
          key={etape.key}
          type="button"
          onClick={() => onSelect(etape.key)}
          aria-current={isActive ? 'step' : undefined}
          data-test={`demarches.pcaet.instruction.etape-${etape.key}`}
          className={cn(
            'flex w-full gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
            isActive
              ? 'border-primary-7 border-2 bg-primary-0 p-[calc(0.75rem-1px)]'
              : 'border-grey-3 bg-white hover:border-primary-4 hover:bg-primary-0'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full w-8 h-8 shrink-0',
              etape.isValidee
                ? 'bg-success text-white'
                : 'bg-warning-2 text-warning-1'
            )}
          >
            <Icon icon={etape.isValidee ? 'check-line' : 'close-line'} size="sm" />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-primary-9">{etape.label}</span>
              <Badge
                title={
                  etape.isValidee
                    ? appLabels.instructionDossierPartieValidee
                    : appLabels.instructionDossierAValider
                }
                variant={etape.isValidee ? 'success' : 'warning'}
                size="xs"
              />
            </div>
            <span className="leading-relaxed text-grey-7">
              {etape.description}
            </span>
          </div>
        </button>
      );
    })}
    {footer && <div className="mt-3">{footer}</div>}
  </div>
);
