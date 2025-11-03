import { useCollectiviteId } from '@/api/collectivites';
import { useGetBudget } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useGetEtapes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/etapes/use-get-etapes';
import { useListIndicateurDefinitions } from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { useListActions } from '@/app/referentiels/actions/use-list-actions';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { Event, useEventTracker } from '@/ui';
import { createElement, useEffect, useState } from 'react';
import { useAnnexesFicheActionInfos } from '../FicheAction/data/useAnnexesFicheActionInfos';
import { useFicheActionNotesSuivi } from '../FicheAction/data/useFicheActionNotesSuivi';
import { useFichesActionLiees } from '../FicheAction/data/useFichesActionLiees';
import { useFicheActionChemins } from '../PlanAction/data/usePlanActionChemin';
import FicheActionPdf from './FicheActionPdf/FicheActionPdf';
import { TSectionsValues, sectionsInitValue } from './utils';

type FicheActionPdfContentProps = {
  fiche: Fiche;
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
    useAnnexesFicheActionInfos(fiche.id, options.notes_docs.isChecked);

  const { data: notesSuivi, isLoading: isLoadingNotesSuivi } =
    useFicheActionNotesSuivi(fiche, options.notes_suivi.isChecked);

  const { data: etapes, isLoading: isLoadingEtapes } = useGetEtapes(
    fiche.id,
    options.etapes.isChecked
  );

  const { data: budgets, isLoading: isLoadingBudget } = useGetBudget(
    { ficheId: fiche.id },
    options.budget.isChecked
  );

  const isLoading =
    isLoadingIndicateurs ||
    isLoadingFichesLiees ||
    isLoadingActionsLiees ||
    isLoadingAxes ||
    isLoadingAnnexes ||
    isLoadingNotesSuivi ||
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
          notesSuivi,
          budgets,
        })
      );
    }
  }, [isLoading]);

  return <></>;
};

type ExportFicheActionButtonProps = {
  fiche: Fiche;
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

  const selectedOptions = Object.keys(options).filter(
    (k) => options[k].isChecked === true
  );

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
