'use client';

import {
  PCAET_DOCUMENT_SECTIONS,
  defaultPcaetDocumentsState,
  type PcaetDeposedDocumentFile,
  type PcaetDocumentSectionConfig,
  type PcaetDocumentSectionId,
  type PcaetDocumentSectionState,
  type PcaetDocumentsState,
} from '@/app/demarches/pcaet/pcaet-documents.constants';
import { Checkbox, ChecklistTable, Icon, PillButton } from '@tet/ui';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';

const SectionCriterionLabel = ({
  config,
  section,
  isReadonly,
  onToggleAlternative,
}: {
  config: PcaetDocumentSectionConfig;
  section: PcaetDocumentSectionState;
  isReadonly: boolean;
  onToggleAlternative: (checked: boolean) => void;
}): ReactElement => (
  <div className="flex flex-col gap-2">
    <div className="font-medium">{config.label}</div>
    {config.hint && (
      <p className="text-xs text-grey-6 m-0">{config.hint}</p>
    )}
    {config.couvertureAlternative === 'plan_actions' && (
      <label className="flex items-start gap-2 text-xs text-grey-7 cursor-pointer">
        <Checkbox
          checked={section.couvertSansFichier}
          disabled={isReadonly}
          onChange={(e) => onToggleAlternative(e.currentTarget.checked)}
        />
        Couvert par le plan d’actions (sans document séparé)
      </label>
    )}
  </div>
);

const StatutToggle = ({
  statut,
  isReadonly,
  onChange,
}: {
  statut: PcaetDocumentSectionState['statut'];
  isReadonly: boolean;
  onChange: (statut: PcaetDocumentSectionState['statut']) => void;
}): ReactElement => {
  const isValide = statut === 'valide';
  return (
    <PillButton
      icon={isValide ? 'close-line' : 'check-line'}
      disabled={isReadonly}
      onClick={() => onChange(isValide ? 'pas_valide' : 'valide')}
    >
      {isValide ? 'Invalider' : 'Valider'}
    </PillButton>
  );
};

const UploadButton = ({
  inputRef,
  isReadonly,
  isReplace,
  onPick,
}: {
  inputRef: (el: HTMLInputElement | null) => void;
  isReadonly: boolean;
  isReplace: boolean;
  onPick: (file: File) => void;
}): ReactElement => {
  const localRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={(el) => {
          localRef.current = el;
          inputRef(el);
        }}
        type="file"
        className="hidden"
        disabled={isReadonly}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = '';
        }}
      />
      <PillButton
        icon="upload-line"
        iconPosition="right"
        disabled={isReadonly}
        onClick={() => localRef.current?.click()}
      >
        {isReplace ? 'Remplacer le fichier' : 'Téléverser'}
      </PillButton>
    </>
  );
};

const FileDepose = ({
  file,
  previewUrl,
}: {
  file: PcaetDeposedDocumentFile;
  previewUrl: string | null;
}): ReactElement => (
  <div className="flex items-center gap-2 text-grey-9 min-w-0">
    <Icon
      icon="checkbox-circle-fill"
      size="sm"
      className="text-success shrink-0"
    />
    {previewUrl ? (
      <button
        type="button"
        className="font-medium text-primary-8 hover:underline truncate text-left"
        onClick={() => window.open(previewUrl, '_blank', 'noreferrer')}
      >
        {file.name}
      </button>
    ) : (
      <span className="font-medium truncate">{file.name}</span>
    )}
  </div>
);

const CoveredByPlanActions = (): ReactElement => (
  <div className="flex items-center gap-2 text-grey-9">
    <Icon
      icon="checkbox-circle-fill"
      size="sm"
      className="text-success shrink-0"
    />
    <span className="text-sm">Couvert via le plan d’actions</span>
  </div>
);

const SectionAnswer = ({
  section,
  previewUrl,
  isReadonly,
  registerUploadRef,
  onPickFile,
}: {
  section: PcaetDocumentSectionState;
  previewUrl: string | null;
  isReadonly: boolean;
  registerUploadRef: (el: HTMLInputElement | null) => void;
  onPickFile: (file: File) => void;
}): ReactElement => {
  if (section.couvertSansFichier) {
    return <CoveredByPlanActions />;
  }
  if (section.file) {
    return (
      <div className="flex items-center gap-3 min-w-0">
        <FileDepose file={section.file} previewUrl={previewUrl} />
        {!isReadonly && (
          <UploadButton
            inputRef={registerUploadRef}
            isReadonly={isReadonly}
            isReplace
            onPick={onPickFile}
          />
        )}
      </div>
    );
  }
  return (
    <UploadButton
      inputRef={registerUploadRef}
      isReadonly={isReadonly}
      isReplace={false}
      onPick={onPickFile}
    />
  );
};

const SectionRow = ({
  section,
  config,
  previewUrl,
  isReadonly,
  registerUploadRef,
  onUpdateSection,
  onPickFile,
}: {
  section: PcaetDocumentSectionState;
  config: PcaetDocumentSectionConfig;
  previewUrl: string | null;
  isReadonly: boolean;
  registerUploadRef: (sectionId: PcaetDocumentSectionId, el: HTMLInputElement | null) => void;
  onUpdateSection: (
    sectionId: PcaetDocumentSectionId,
    patch: Partial<PcaetDocumentSectionState>
  ) => void;
  onPickFile: (sectionId: PcaetDocumentSectionId, file: File) => void;
}): ReactElement => (
  <ChecklistTable.Row
    done={section.statut === 'valide'}
    criterion={{
      label: (
        <SectionCriterionLabel
          config={config}
          section={section}
          isReadonly={isReadonly}
          onToggleAlternative={(checked) =>
            onUpdateSection(section.sectionId, {
              couvertSansFichier: checked,
              file: checked ? null : section.file,
            })
          }
        />
      ),
      action: (
        <StatutToggle
          statut={section.statut}
          isReadonly={isReadonly}
          onChange={(statut) => onUpdateSection(section.sectionId, { statut })}
        />
      ),
    }}
    answer={
      <SectionAnswer
        section={section}
        previewUrl={previewUrl}
        isReadonly={isReadonly}
        registerUploadRef={(el) => registerUploadRef(section.sectionId, el)}
        onPickFile={(file) => onPickFile(section.sectionId, file)}
      />
    }
  />
);

type Props = {
  value: PcaetDocumentsState;
  onChange: (next: PcaetDocumentsState) => void;
  isReadonly?: boolean;
};

export const PcaetDocumentsTable = ({
  value,
  onChange,
  isReadonly = false,
}: Props) => {
  const rowUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const sections = value.sections ?? defaultPcaetDocumentsState().sections;

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const sectionConfigById = useMemo(
    () => Object.fromEntries(PCAET_DOCUMENT_SECTIONS.map((s) => [s.id, s])),
    []
  );

  const updateSection = (
    sectionId: PcaetDocumentSectionId,
    patch: Partial<PcaetDocumentSectionState>
  ) => {
    onChange({
      sections: sections.map((row) =>
        row.sectionId === sectionId ? { ...row, ...patch } : row
      ),
    });
  };

  const pickFileForSection = (
    sectionId: PcaetDocumentSectionId,
    file: File
  ) => {
    const targetFile: PcaetDeposedDocumentFile = {
      id: crypto.randomUUID(),
      name: file.name,
    };
    const previousFileId = sections.find((s) => s.sectionId === sectionId)?.file
      ?.id;

    updateSection(sectionId, {
      file: targetFile,
      couvertSansFichier: false,
    });

    setPreviewUrls((prev) => {
      const updated = { ...prev };
      if (previousFileId && updated[previousFileId]) {
        URL.revokeObjectURL(updated[previousFileId]);
        delete updated[previousFileId];
      }
      updated[targetFile.id] = URL.createObjectURL(file);
      return updated;
    });
  };

  const registerUploadRef = (
    sectionId: PcaetDocumentSectionId,
    el: HTMLInputElement | null
  ) => {
    rowUploadRefs.current[sectionId] = el;
  };

  return (
    <div data-test="PcaetDocumentsTable">
      <ChecklistTable caption="Dépôt des pièces du dossier PCAET">
        <ChecklistTable.Head
          labelHeader="Section"
          answerHeader="Documents liés"
        />
        {sections.map((section) => (
          <SectionRow
            key={section.sectionId}
            section={section}
            config={sectionConfigById[section.sectionId]}
            previewUrl={section.file ? previewUrls[section.file.id] ?? null : null}
            isReadonly={isReadonly}
            registerUploadRef={registerUploadRef}
            onUpdateSection={updateSection}
            onPickFile={pickFileForSection}
          />
        ))}
      </ChecklistTable>
    </div>
  );
};
