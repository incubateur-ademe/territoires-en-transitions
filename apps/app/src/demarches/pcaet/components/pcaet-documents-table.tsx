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
import { appLabels } from '@/app/labels/catalog';
import {
  Badge,
  Button,
  Checkbox,
  ChecklistTable,
  Icon,
  PillButton,
} from '@tet/ui';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';

const GLOBAL_DOCUMENT_PREVIEW_KEY = 'global-document';

const SectionCriterionLabel = ({
  config,
}: {
  config: PcaetDocumentSectionConfig;
}): ReactElement => <div className="font-medium">{config.label}</div>;

const SectionRequiredBadge = ({
  config,
}: {
  config: PcaetDocumentSectionConfig;
}): ReactElement => (
  <Badge
    title={
      config.required
        ? appLabels.demarchePcaetDocumentsBadgeObligatoire
        : appLabels.demarchePcaetDocumentsBadgeOptionnel
    }
    variant={config.required ? 'info' : 'grey'}
    type="solid"
    size="sm"
    uppercase={false}
  />
);

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
        {isReplace
          ? appLabels.demarchePcaetDocumentsRemplacerFichier
          : appLabels.demarchePcaetDocumentsTeleverser}
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
    <span className="text-sm">
      {appLabels.demarchePcaetDocumentsCouvertViaPlan}
    </span>
  </div>
);

const CoveredByGlobal = ({
  isReadonly,
  registerUploadRef,
  onPickFile,
}: {
  isReadonly: boolean;
  registerUploadRef: (el: HTMLInputElement | null) => void;
  onPickFile: (file: File) => void;
}): ReactElement => (
  <div className="flex items-center gap-3 min-w-0">
    {!isReadonly && (
      <UploadButton
        inputRef={registerUploadRef}
        isReadonly={isReadonly}
        isReplace={false}
        onPick={onPickFile}
      />
    )}
  </div>
);

const GlobalDocumentCard = ({
  globalDocument,
  previewUrl,
  isReadonly,
  onPickFile,
  onRemove,
}: {
  globalDocument: PcaetDeposedDocumentFile | null;
  previewUrl: string | null;
  isReadonly: boolean;
  onPickFile: (file: File) => void;
  onRemove: () => void;
}): ReactElement => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-lg border border-primary-3 bg-primary-0 p-4 flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={isReadonly}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickFile(file);
          e.target.value = '';
        }}
      />
      <div>
        <div className="flex items-center gap-2">
          <Icon icon="folder-2-line" size="sm" className="text-primary-8" />
          <span className="font-medium text-primary-9">
            {appLabels.demarchePcaetDocumentsGlobalTitre}
          </span>
        </div>
        <p className="text-xs text-grey-7 mt-1 m-0">
          {appLabels.demarchePcaetDocumentsGlobalDescription}
        </p>
      </div>

      {globalDocument ? (
        <div className="flex flex-wrap items-center gap-3">
          <FileDepose file={globalDocument} previewUrl={previewUrl} />
          {!isReadonly && (
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="xs"
                icon="upload-line"
                onClick={() => inputRef.current?.click()}
              >
                {appLabels.demarchePcaetDocumentsGlobalRemplacer}
              </Button>
              <Button
                variant="grey"
                size="xs"
                icon="delete-bin-line"
                onClick={onRemove}
              >
                {appLabels.demarchePcaetDocumentsGlobalRetirer}
              </Button>
            </div>
          )}
        </div>
      ) : (
        !isReadonly && (
          <Button
            variant="primary"
            size="xs"
            icon="upload-line"
            iconPosition="right"
            className="w-fit"
            onClick={() => inputRef.current?.click()}
          >
            {appLabels.demarchePcaetDocumentsGlobalTeleverser}
          </Button>
        )
      )}
    </div>
  );
};

const CoveredByPlanCheckbox = ({
  checked,
  isReadonly,
  onToggle,
}: {
  checked: boolean;
  isReadonly: boolean;
  onToggle: (checked: boolean) => void;
}): ReactElement => (
  <Checkbox
    variant="checkbox"
    size="sm"
    checked={checked}
    disabled={isReadonly}
    label={appLabels.demarchePcaetDocumentsComprisDansPlanSuivi}
    message={
      checked
        ? undefined
        : appLabels.demarchePcaetDocumentsComprisDansPlanSuiviAide
    }
    onChange={(e) => onToggle(e.currentTarget.checked)}
  />
);

const SectionAnswer = ({
  section,
  config,
  previewUrl,
  isReadonly,
  coveredByGlobal,
  registerUploadRef,
  onPickFile,
  onToggleCouvertSansFichier,
}: {
  section: PcaetDocumentSectionState;
  config: PcaetDocumentSectionConfig;
  previewUrl: string | null;
  isReadonly: boolean;
  coveredByGlobal: boolean;
  registerUploadRef: (el: HTMLInputElement | null) => void;
  onPickFile: (file: File) => void;
  onToggleCouvertSansFichier: (checked: boolean) => void;
}): ReactElement => {
  // Un fichier spécifique déposé prime toujours sur les autres modes.
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

  // Section pouvant être couverte par le plan d’actions suivi dans la
  // plateforme : on propose une case à cocher, tout en laissant la
  // possibilité de déposer un document spécifique.
  if (config.couvrableParPlanActions) {
    return (
      <div className="flex flex-col items-start gap-2 min-w-0">
        <CoveredByPlanCheckbox
          checked={section.couvertSansFichier}
          isReadonly={isReadonly}
          onToggle={onToggleCouvertSansFichier}
        />
        {!section.couvertSansFichier &&
          (coveredByGlobal ? (
            <CoveredByGlobal
              isReadonly={isReadonly}
              registerUploadRef={registerUploadRef}
              onPickFile={onPickFile}
            />
          ) : (
            !isReadonly && (
              <UploadButton
                inputRef={registerUploadRef}
                isReadonly={isReadonly}
                isReplace={false}
                onPick={onPickFile}
              />
            )
          ))}
      </div>
    );
  }

  if (section.couvertSansFichier) {
    return <CoveredByPlanActions />;
  }
  if (coveredByGlobal) {
    return (
      <CoveredByGlobal
        isReadonly={isReadonly}
        registerUploadRef={registerUploadRef}
        onPickFile={onPickFile}
      />
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
  coveredByGlobal,
  registerUploadRef,
  onPickFile,
  onToggleCouvertSansFichier,
}: {
  section: PcaetDocumentSectionState;
  config: PcaetDocumentSectionConfig;
  previewUrl: string | null;
  isReadonly: boolean;
  coveredByGlobal: boolean;
  registerUploadRef: (
    sectionId: PcaetDocumentSectionId,
    el: HTMLInputElement | null
  ) => void;
  onPickFile: (sectionId: PcaetDocumentSectionId, file: File) => void;
  onToggleCouvertSansFichier: (
    sectionId: PcaetDocumentSectionId,
    checked: boolean
  ) => void;
}): ReactElement => (
  <ChecklistTable.Row
    done={section.couvertSansFichier || !!section.file || coveredByGlobal}
    tag={<SectionRequiredBadge config={config} />}
    criterion={{
      label: <SectionCriterionLabel config={config} />,
    }}
    answer={
      <SectionAnswer
        section={section}
        config={config}
        previewUrl={previewUrl}
        isReadonly={isReadonly}
        coveredByGlobal={coveredByGlobal}
        registerUploadRef={(el) => registerUploadRef(section.sectionId, el)}
        onPickFile={(file) => onPickFile(section.sectionId, file)}
        onToggleCouvertSansFichier={(checked) =>
          onToggleCouvertSansFichier(section.sectionId, checked)
        }
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
  const globalDocument = value.globalDocument ?? null;
  const coveredByGlobal = globalDocument !== null;

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
      ...value,
      sections: sections.map((row) =>
        row.sectionId === sectionId ? { ...row, ...patch } : row
      ),
    });
  };

  const revokePreview = (fileId: string | undefined) => {
    if (!fileId) return;
    setPreviewUrls((prev) => {
      if (!prev[fileId]) return prev;
      URL.revokeObjectURL(prev[fileId]);
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  };

  const registerPreview = (fileId: string, file: File) => {
    setPreviewUrls((prev) => {
      const updated = { ...prev };
      if (updated[fileId]) URL.revokeObjectURL(updated[fileId]);
      updated[fileId] = URL.createObjectURL(file);
      return updated;
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
    revokePreview(sections.find((s) => s.sectionId === sectionId)?.file?.id);
    updateSection(sectionId, {
      file: targetFile,
      couvertSansFichier: false,
    });
    registerPreview(targetFile.id, file);
  };

  const pickGlobalDocument = (file: File) => {
    const targetFile: PcaetDeposedDocumentFile = {
      id: crypto.randomUUID(),
      name: file.name,
    };
    onChange({ ...value, globalDocument: targetFile });
    registerPreview(GLOBAL_DOCUMENT_PREVIEW_KEY, file);
  };

  const removeGlobalDocument = () => {
    onChange({ ...value, globalDocument: null });
    revokePreview(GLOBAL_DOCUMENT_PREVIEW_KEY);
  };

  const toggleCouvertSansFichier = (
    sectionId: PcaetDocumentSectionId,
    checked: boolean
  ) => {
    updateSection(sectionId, { couvertSansFichier: checked });
  };

  const registerUploadRef = (
    sectionId: PcaetDocumentSectionId,
    el: HTMLInputElement | null
  ) => {
    rowUploadRefs.current[sectionId] = el;
  };

  return (
    <div className="flex flex-col gap-4" data-test="PcaetDocumentsTable">
      <GlobalDocumentCard
        globalDocument={globalDocument}
        previewUrl={previewUrls[GLOBAL_DOCUMENT_PREVIEW_KEY] ?? null}
        isReadonly={isReadonly}
        onPickFile={pickGlobalDocument}
        onRemove={removeGlobalDocument}
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary-9 m-0">
          {appLabels.demarchePcaetDocumentsSectionsDetail}
        </p>
        <ChecklistTable
          caption={appLabels.demarchePcaetDocumentsCaption}
          hasTagColumn
        >
          <ChecklistTable.Head
            labelHeader={appLabels.demarchePcaetDocumentsColonneSection}
            answerHeader={appLabels.demarchePcaetDocumentsColonneDocuments}
            tagHeader={appLabels.demarchePcaetDocumentsColonneType}
          />
          {sections.map((section) => (
            <SectionRow
              key={section.sectionId}
              section={section}
              config={sectionConfigById[section.sectionId]}
              previewUrl={
                section.file ? previewUrls[section.file.id] ?? null : null
              }
              isReadonly={isReadonly}
              coveredByGlobal={coveredByGlobal}
              registerUploadRef={registerUploadRef}
              onPickFile={pickFileForSection}
              onToggleCouvertSansFichier={toggleCouvertSansFichier}
            />
          ))}
        </ChecklistTable>
      </div>
    </div>
  );
};
