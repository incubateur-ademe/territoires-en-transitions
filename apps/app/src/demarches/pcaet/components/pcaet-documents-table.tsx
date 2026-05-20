'use client';

import {
  PCAET_DOCUMENT_SECTIONS,
  defaultPcaetDocumentsState,
  type PcaetDeposedDocumentFile,
  type PcaetDocumentsState,
  type PcaetDocumentSectionId,
} from '@/app/demarches/pcaet/pcaet-documents.constants';
import { Alert, Button, ButtonGroup, Checkbox, Select } from '@tet/ui';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

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
  const globalUploadId = useId();
  const rowUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const deposedFiles = value.files ?? [];
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

  const fileOptions = deposedFiles.map((f) => ({
    label: f.name,
    value: f.id,
  }));

  const updateValue = (next: Partial<PcaetDocumentsState>) => {
    onChange({
      files: next.files ?? deposedFiles,
      sections: next.sections ?? sections,
    });
  };

  const addDeposedFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) return;

    let nextFiles = [...deposedFiles];
    let hasFilesChanged = false;
    const previewEntries: Array<{ id: string; url: string }> = [];

    incomingFiles.forEach((file) => {
      const existing = nextFiles.find((f) => f.name === file.name);
      const targetFile: PcaetDeposedDocumentFile = existing ?? {
        id: crypto.randomUUID(),
        name: file.name,
      };
      if (!existing) {
        nextFiles = [...nextFiles, targetFile];
        hasFilesChanged = true;
      }
      previewEntries.push({ id: targetFile.id, url: URL.createObjectURL(file) });
    });

    if (hasFilesChanged) {
      updateValue({ files: nextFiles });
    }

    setPreviewUrls((prev) => {
      const updated = { ...prev };
      previewEntries.forEach(({ id, url }) => {
        if (updated[id]) {
          URL.revokeObjectURL(updated[id]);
        }
        updated[id] = url;
      });
      return updated;
    });
  };

  const removeDeposedFile = (fileId: string) => {
    const nextFiles = deposedFiles.filter((f) => f.id !== fileId);
    const nextSections = sections.map((row) => ({
      ...row,
      linkedFileIds: row.linkedFileIds.filter((id) => id !== fileId),
    }));
    updateValue({ files: nextFiles, sections: nextSections });

    setPreviewUrls((prev) => {
      if (prev[fileId]) {
        URL.revokeObjectURL(prev[fileId]);
      }
      const { [fileId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateSection = (
    sectionId: PcaetDocumentSectionId,
    patch: Partial<(typeof sections)[number]>
  ) => {
    updateValue({
      sections: sections.map((row) =>
        row.sectionId === sectionId ? { ...row, ...patch } : row
      ),
    });
  };

  const linkFileToSection = (
    sectionId: PcaetDocumentSectionId,
    file: File | null
  ) => {
    if (!file) return;

    const existing = deposedFiles.find((f) => f.name === file.name);
    const targetFile: PcaetDeposedDocumentFile = existing ?? {
      id: crypto.randomUUID(),
      name: file.name,
    };
    const nextFiles = existing ? deposedFiles : [...deposedFiles, targetFile];
    const nextSections = sections.map((row) =>
      row.sectionId === sectionId && !row.linkedFileIds.includes(targetFile.id)
        ? {
            ...row,
            linkedFileIds: [...row.linkedFileIds, targetFile.id],
            couvertSansFichier: false,
          }
        : row
    );

    updateValue({ files: nextFiles, sections: nextSections });
    setPreviewUrls((prev) => {
      const updated = { ...prev };
      if (updated[targetFile.id]) {
        URL.revokeObjectURL(updated[targetFile.id]);
      }
      updated[targetFile.id] = URL.createObjectURL(file);
      return updated;
    });
  };

  const getFileById = (fileId: string) =>
    deposedFiles.find((f) => f.id === fileId);

  return (
    <div className="flex flex-col gap-6" data-test="PcaetDocumentsTable">
      <Alert
        state="info"
        title="Un fichier peut couvrir plusieurs sections"
        description="Déposez vos pièces une fois dans le bac commun, puis associez chaque fichier aux sections qu’il couvre. Un PDF unique (ex. document PCAET complet) peut ainsi répondre au diagnostic, à la stratégie et au plan d’actions."
      />

      <div className="rounded-lg border border-dashed border-grey-4 bg-grey-1 p-4 flex flex-col gap-3">
        <p className="text-sm font-medium text-grey-9 m-0">
          Bac de dépôt (fichiers de la démarche)
        </p>
        <input
          id={globalUploadId}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            addDeposedFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <Button
          variant="outlined"
          size="sm"
          icon="upload-2-line"
          disabled={isReadonly}
          onClick={() => document.getElementById(globalUploadId)?.click()}
          data-test="pcaet-documents-upload-global"
        >
          Ajouter un ou plusieurs fichiers
        </Button>
        {deposedFiles.length > 0 ? (
          <ul className="flex flex-col gap-2 m-0 p-0 list-none">
            {deposedFiles.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-md border border-grey-3 bg-white px-3 py-2 text-sm"
              >
                <span className="truncate text-grey-9">{file.name}</span>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="grey"
                    size="xs"
                    disabled={!previewUrls[file.id]}
                    onClick={() => {
                      const url = previewUrls[file.id];
                      if (url) window.open(url, '_blank', 'noreferrer');
                    }}
                  >
                    Voir
                  </Button>
                  <Button
                    variant="white"
                    size="xs"
                    icon="delete-bin-line"
                    title="Retirer du bac"
                    disabled={isReadonly}
                    onClick={() => removeDeposedFile(file.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-grey-6 m-0">
            Aucun fichier dans le bac. Les fichiers ajoutés ici pourront être
            reliés à une ou plusieurs sections ci-dessous.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-grey-3 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-grey-1">
            <tr className="text-left text-sm text-grey-7">
              <th className="px-4 py-3 font-semibold w-[32%]">
                Section attendue
              </th>
              <th className="px-4 py-3 font-semibold w-[28%]">
                Pièces associées
              </th>
              <th className="px-4 py-3 font-semibold w-[18%]">Statut</th>
              <th className="px-4 py-3 font-semibold w-[22%]">Dépôt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-3">
            {sections.map((row) => {
              const config = sectionConfigById[row.sectionId];
              const inputId = `pcaet-doc-upload-${row.sectionId}`;
              const linkedFiles = row.linkedFileIds
                .map(getFileById)
                .filter((f): f is PcaetDeposedDocumentFile => Boolean(f));
              const isCovered =
                row.couvertSansFichier || linkedFiles.length > 0;

              return (
                <tr key={row.sectionId} className="align-top">
                  <td className="px-4 py-4 text-sm text-grey-9">
                    <div className="font-medium">{config.label}</div>
                    {config.hint ? (
                      <p className="text-xs text-grey-6 mt-1 mb-0">
                        {config.hint}
                      </p>
                    ) : null}
                    {config.couvertureAlternative === 'plan_actions' ? (
                      <label className="mt-2 flex items-start gap-2 text-xs text-grey-7 cursor-pointer">
                        <Checkbox
                          checked={row.couvertSansFichier}
                          disabled={isReadonly}
                          onChange={(e) =>
                            updateSection(row.sectionId, {
                              couvertSansFichier: e.currentTarget.checked,
                              linkedFileIds: e.currentTarget.checked
                                ? []
                                : row.linkedFileIds,
                            })
                          }
                        />
                        Couvert par le plan d’actions (sans document séparé)
                      </label>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    {row.couvertSansFichier ? (
                      <span className="text-xs text-success-8 font-medium">
                        Couvert via le plan d’actions
                      </span>
                    ) : linkedFiles.length > 0 ? (
                      <ul className="m-0 p-0 list-none flex flex-col gap-1">
                        {linkedFiles.map((file) => (
                          <li key={file.id} className="text-sm text-grey-8">
                            <button
                              type="button"
                              className="text-primary-8 hover:underline text-left truncate max-w-full"
                              onClick={() => {
                                const url = previewUrls[file.id];
                                if (url) {
                                  window.open(url, '_blank', 'noreferrer');
                                }
                              }}
                            >
                              {file.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-grey-6">Aucune pièce</span>
                    )}
                    {deposedFiles.length > 0 && !row.couvertSansFichier ? (
                      <div className="mt-2 min-w-[200px]">
                        <Select
                          placeholder="Associer depuis le bac…"
                          options={fileOptions}
                          values={row.linkedFileIds}
                          disabled={isReadonly}
                          onChange={(values) => {
                            const ids = Array.isArray(values)
                              ? values.map(String)
                              : values
                                ? [String(values)]
                                : [];
                            updateSection(row.sectionId, {
                              linkedFileIds: ids,
                            });
                          }}
                          multiple
                        />
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <ButtonGroup
                      activeButtonId={row.statut}
                      variant="neutral"
                      size="sm"
                      buttons={[
                        {
                          id: 'valide',
                          children: 'Validé',
                          disabled: isReadonly,
                          onClick: () =>
                            updateSection(row.sectionId, { statut: 'valide' }),
                        },
                        {
                          id: 'pas_valide',
                          children: 'Pas validé',
                          disabled: isReadonly,
                          onClick: () =>
                            updateSection(row.sectionId, {
                              statut: 'pas_valide',
                            }),
                        },
                      ]}
                    />
                    {!isCovered && row.statut === 'valide' ? (
                      <p className="text-xs text-warning-8 mt-2 mb-0">
                        Aucune pièce associée
                      </p>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <input
                      id={inputId}
                      ref={(el) => {
                        rowUploadRefs.current[row.sectionId] = el;
                      }}
                      type="file"
                      className="hidden"
                      disabled={row.couvertSansFichier || isReadonly}
                      onChange={(e) => {
                        linkFileToSection(
                          row.sectionId,
                          e.target.files?.[0] ?? null
                        );
                        e.target.value = '';
                      }}
                    />
                    <div
                      className={`rounded-lg border border-grey-4 bg-grey-1 p-3 ${
                        row.couvertSansFichier ? 'opacity-50' : ''
                      }`}
                      onDragOver={(e) => {
                        if (row.couvertSansFichier) return;
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (row.couvertSansFichier) return;
                        e.preventDefault();
                        linkFileToSection(
                          row.sectionId,
                          e.dataTransfer.files?.[0] ?? null
                        );
                      }}
                    >
                      <Button
                        variant="white"
                        size="xs"
                        className="w-full justify-center"
                        disabled={row.couvertSansFichier || isReadonly}
                        onClick={() =>
                          rowUploadRefs.current[row.sectionId]?.click()
                        }
                      >
                        Déposer pour cette section
                      </Button>
                      <p className="text-xs text-grey-6 mt-2 mb-0">
                        Ajoute au bac et lie automatiquement à la section.
                      </p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
