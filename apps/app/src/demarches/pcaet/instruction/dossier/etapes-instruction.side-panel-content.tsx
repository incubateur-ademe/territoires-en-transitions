'use client';

import type { PcaetInstructionPartie } from '@tet/domain/demarches';
import { cn } from '@tet/ui';
import type { ReactNode } from 'react';
import { AvisDeposesList, type AvisDepose } from './avis-deposes.list';

export type EtapeInstruction = {
  key: PcaetInstructionPartie;
  label: string;
  description: string;
};

export type EtapesInstructionSidePanelContentProps = {
  etapes: EtapeInstruction[];
  activeEtape: PcaetInstructionPartie;
  onSelect: (etape: PcaetInstructionPartie) => void;
  /** Nécessaire au téléchargement des rapports d'avis. */
  demandeAvisId: number;
  avis: AvisDepose[];
  footer?: ReactNode;
};

export const EtapesInstructionSidePanelContent = ({
  etapes,
  activeEtape,
  onSelect,
  demandeAvisId,
  avis,
  footer,
}: EtapesInstructionSidePanelContentProps) => (
  <div className="flex flex-col gap-3 p-4">
    <AvisDeposesList demandeAvisId={demandeAvisId} avis={avis} />

    {etapes.map((etape, index) => {
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
            aria-hidden
            className={cn(
              'flex items-center justify-center rounded-full w-8 h-8 shrink-0 text-sm font-bold',
              isActive
                ? 'bg-primary-7 text-white'
                : 'bg-primary-1 text-primary-8'
            )}
          >
            {index + 1}
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="font-medium text-primary-9">{etape.label}</span>
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
