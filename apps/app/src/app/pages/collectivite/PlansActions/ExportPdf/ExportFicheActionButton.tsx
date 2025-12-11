import { useGetEtapes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/etapes/use-get-etapes';
import { useListIndicateurDefinitions } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { useGetBudget } from '@/app/plans/fiches/update-fiche/data/use-get-budget';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Event, useEventTracker } from '@tet/ui';
import { mapValues } from 'es-toolkit';
import { createElement, useEffect, useState } from 'react';
import { useGetFicheNotes } from '../FicheAction/data/use-get-fiche-notes';
import { useAnnexesFicheActionInfos } from '../FicheAction/data/useAnnexesFicheActionInfos';
import { useFichesActionLiees } from '../FicheAction/data/useFichesActionLiees';
import { useFicheActionChemins } from '../PlanAction/data/usePlanActionChemin';
import FicheActionPdf from './FicheActionPdf/FicheActionPdf';
import { TSectionsValues, sectionsInitValue } from './utils';

type FicheActionPdfContentProps = {
  fiche: FicheWithRelations;
  options: TSectionsValues;
  generateContent: (content: JSX.Element) => void;
};

export const FicheActionPdfContent = ({
  fiche,
  options,
  generateContent,
}: FicheActionPdfContentProps) => {
  const collectiviteId = useCollectiviteId();
  const { data: axes, isLoading: isLoadingAxes } = useFicheActionChemins(
    (fiche.axes ?? []).map((axe) => axe.id)
  );

  const {
    data: { data: indicateursListe } = {},
    isLoading: isLoadingIndicateurs,
  } = useListIndicateurDefinitions(
    {
      filters: {
        indicateurIds: fiche.indicateurs?.map((ind) => ind.id),
      },
    },
    {
      enabled: options.indicateurs.isChecked && !!fiche.indicateurs?.length,
    }
  );

  const { fiches: fichesLiees, isLoading: isLoadingFichesLiees } =
    useFichesActionLiees({
      ficheId: fiche.id,
      collectiviteId,
      requested: options.fiches.isChecked,
    });

  const { data: actionsLiees, isLoading: isLoadingActionsLiees } =
    useListActions(
      {
        actionIds: fiche?.mesures?.map((action) => action.id),
      },
      options.actionsLiees.isChecked
    );

  const { data: annexes, isLoading: isLoadingAnnexes } =
    useAnnexesFicheActionInfos(fiche.id, options.documents.isChecked);

  const { data: notes, isLoading: isLoadingNotes } = useGetFicheNotes(
    fiche,
    options.notes.isChecked
  );

  const { data: etapes, isLoading: isLoadingEtapes } = useGetEtapes(
    fiche.id,
    options.etapes.isChecked
  );
  const { data: budgets, isLoading: isLoadingBudget } = useGetBudget(
    { ficheId: fiche.id },
    options.moyens.isChecked
  );

  const isLoading =
    isLoadingIndicateurs ||
    isLoadingFichesLiees ||
    isLoadingActionsLiees ||
    isLoadingAxes ||
    isLoadingAnnexes ||
    isLoadingNotes ||
    isLoadingEtapes ||
    isLoadingBudget;

  useEffect(() => {
    if (!isLoading) {
      generateContent(
        createElement(FicheActionPdf, {
          fiche,
          sections: options,
          chemins: (axes ?? [])
            .map((a) => a.chemin)
            .filter((chemin) => chemin !== null),
          indicateursListe,
          etapes,
          fichesLiees,
          actionsLiees: fiche?.mesures?.length ? actionsLiees ?? [] : [],
          annexes,
          notes,
          budgets,
        })
      );
    }
    // to prevent any unexpected bug, legacy code deps only have "isLoading" so we leave it
    // that way for now before a further refactoring to move everything in the backend
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return null;
};

type ExportFicheActionButtonProps = {
  fiche: FicheWithRelations;
  options?: TSectionsValues;
  disabled?: boolean;
  onDownloadEnd?: () => void;
};

export const ExportFicheActionButton = ({
  fiche,
  options = sectionsInitValue,
  disabled = false,
  onDownloadEnd,
}: ExportFicheActionButtonProps) => {
  const tracker = useEventTracker();

  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element | undefined>(undefined);

  const fileName = `fiche-action-${fiche.id}`;

  const selectedOptions = Object.keys(
    mapValues(options, (value: { isChecked: boolean }) => value.isChecked)
  ).filter(Boolean);

  return (
    <>
      <ExportPDFButton
        content={content}
        fileName={fileName}
        requestData={() => setIsDataRequested(true)}
        size="md"
        variant="primary"
        disabled={disabled}
        onClick={() =>
          tracker(Event.fiches.exportPdf, {
            sections: selectedOptions,
          })
        }
        onDownloadEnd={onDownloadEnd}
      >
        Exporter au format PDF
      </ExportPDFButton>

      {isDataRequested && (
        <FicheActionPdfContent
          fiche={fiche}
          options={options}
          generateContent={(newContent) => {
            setContent(newContent);
            setIsDataRequested(false);
          }}
        />
      )}
    </>
  );
};
