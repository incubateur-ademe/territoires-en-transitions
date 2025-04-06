import { FicheAction } from '@/api/plan-actions';
import { useGetEtapes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/etapes/use-get-etapes';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { useEventTracker } from '@/ui';
import { createElement, useEffect, useState } from 'react';
import { useIndicateurDefinitions } from '../../Indicateurs/Indicateur/useIndicateurDefinition';
import { useAnnexesFicheActionInfos } from '../FicheAction/data/useAnnexesFicheActionInfos';
import { useFicheActionNotesSuivi } from '../FicheAction/data/useFicheActionNotesSuivi';
import { useFichesActionLiees } from '../FicheAction/data/useFichesActionLiees';
import { useFicheActionChemins } from '../PlanAction/data/usePlanActionChemin';
import { useActionsLiees } from './FicheActionPdf/actions-liees/use-actions-liees';
import FicheActionPdf from './FicheActionPdf/FicheActionPdf';
import { TSectionsValues, sectionsInitValue } from './utils';

type FicheActionPdfContentProps = {
  fiche: FicheAction;
  options: TSectionsValues;
  generateContent: (content: JSX.Element) => void;
};

export const FicheActionPdfContent = ({
  fiche,
  options,
  generateContent,
}: FicheActionPdfContentProps) => {
  const { data: axes, isLoading: isLoadingAxes } = useFicheActionChemins(
    (fiche.axes ?? []).map((axe) => axe.id)
  );

  const { data: indicateursListe, isLoading: isLoadingIndicateurs } =
    useIndicateurDefinitions(
      (fiche.indicateurs ?? []).map((ind) => ind.id),
      options.indicateurs.isChecked
    );

  const { data: fichesLiees, isLoading: isLoadingFichesLiees } =
    useFichesActionLiees(fiche.id, options.fiches.isChecked);

  const { actions: actionsLiees, isLoading: isLoadingActionsLiees } =
    useActionsLiees(fiche?.actions?.map((action) => action.id));

  const { data: annexes, isLoading: isLoadingAnnexes } =
    useAnnexesFicheActionInfos(fiche.id, options.notes_docs.isChecked);

  const { data: notesSuivi, isLoading: isLoadingNotesSuivi } =
    useFicheActionNotesSuivi(fiche, options.notes_suivi.isChecked);

  const { data: etapes, isLoading: isLoadingEtapes } = useGetEtapes(
    {
      id: fiche.id,
    },
    options.etapes.isChecked
  );

  const isLoading =
    isLoadingIndicateurs ||
    isLoadingFichesLiees ||
    isLoadingActionsLiees ||
    isLoadingAxes ||
    isLoadingAnnexes ||
    isLoadingNotesSuivi ||
    isLoadingEtapes;

  useEffect(() => {
    if (!isLoading) {
      generateContent(
        createElement(FicheActionPdf, {
          fiche,
          sections: options,
          chemins: (axes ?? [])
            .filter((a) => a.chemin !== null)
            .map((a) => a.chemin!),
          indicateursListe,
          etapes,
          fichesLiees,
          actionsLiees: fiche?.actions?.length ? actionsLiees ?? [] : [],
          annexes,
          notesSuivi,
        })
      );
    }
  }, [isLoading]);

  return <></>;
};

type ExportFicheActionButtonProps = {
  fiche: FicheAction;
  options?: TSectionsValues;
  disabled?: boolean;
  onDownloadEnd?: () => void;
};

const ExportFicheActionButton = ({
  fiche,
  options = sectionsInitValue,
  disabled = false,
  onDownloadEnd,
}: ExportFicheActionButtonProps) => {
  const { collectiviteId, niveauAcces, role } = useCurrentCollectivite()!;
  const tracker = useEventTracker('app/fiche-action');

  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element | undefined>(undefined);

  const fileName = `fiche-action-${fiche.id}`;

  const selectedOptions = Object.keys(options).filter(
    (k) => options[k].isChecked === true
  );

  return (
    <>
      <ExportPDFButton
        {...{ content, fileName }}
        requestData={() => setIsDataRequested(true)}
        size="md"
        variant="primary"
        disabled={disabled}
        onClick={() =>
          tracker('export_PDF', {
            collectiviteId,
            niveauAcces,
            role,
            sections: selectedOptions,
          })
        }
        onDownloadEnd={onDownloadEnd}
      >
        Exporter au format PDF
      </ExportPDFButton>

      {isDataRequested && (
        <FicheActionPdfContent
          {...{ fiche, options }}
          generateContent={(newContent) => {
            setContent(newContent);
            setIsDataRequested(false);
          }}
        />
      )}
    </>
  );
};

export default ExportFicheActionButton;
