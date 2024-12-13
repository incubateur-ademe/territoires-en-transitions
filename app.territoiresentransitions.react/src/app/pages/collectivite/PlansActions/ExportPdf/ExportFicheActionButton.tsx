import { FicheAction } from '@/api/plan-actions';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { createElement, useEffect, useState } from 'react';
import { useIndicateurDefinitions } from '../../Indicateurs/Indicateur/useIndicateurDefinition';
import { useActionListe } from '../FicheAction/data/options/useActionListe';
import { useAnnexesFicheActionInfos } from '../FicheAction/data/useAnnexesFicheActionInfos';
import { useFicheActionNotesSuivi } from '../FicheAction/data/useFicheActionNotesSuivi';
import { useFichesActionLiees } from '../FicheAction/data/useFichesActionLiees';
import { useFicheActionChemins } from '../PlanAction/data/usePlanActionChemin';
import FicheActionPdf from './FicheActionPdf/FicheActionPdf';

type FicheActionPdfContentProps = {
  fiche: FicheAction;
  generateContent: (content: JSX.Element) => void;
};

export const FicheActionPdfContent = ({
  fiche,
  generateContent,
}: FicheActionPdfContentProps) => {
  const { data: axes, isLoading: isLoadingAxes } = useFicheActionChemins(
    (fiche.axes ?? []).map((axe) => axe.id)
  );

  const { data: indicateursListe, isLoading: isLoadingIndicateurs } =
    useIndicateurDefinitions(
      0,
      (fiche.indicateurs ?? []).map((ind) => ind.id)
    );

  const { data: fichesLiees, isLoading: isLoadingFichesLiees } =
    useFichesActionLiees(fiche.id);

  const { data: actionListe, isLoading: isLoadignActionsListe } =
    useActionListe();

  const { data: annexes, isLoading: isLoadingAnnexes } =
    useAnnexesFicheActionInfos(fiche.id);

  const { data: notesSuivi, isLoading: isLoadingNotesSuivi } =
    useFicheActionNotesSuivi(fiche);

  const isLoading =
    isLoadingIndicateurs ||
    isLoadingFichesLiees ||
    isLoadignActionsListe ||
    isLoadingAxes ||
    isLoadingAnnexes ||
    isLoadingNotesSuivi;

  useEffect(() => {
    if (!isLoading) {
      const { actions } = fiche;
      const actionsIds = (actions ?? []).map((action) => action.id);
      const actionsLiees = (actionListe ?? []).filter((action) =>
        actionsIds.some((id) => id === action.action_id)
      );

      generateContent(
        createElement(FicheActionPdf, {
          fiche,
          chemins: (axes ?? [])
            .filter((a) => a.chemin !== null)
            .map((a) => a.chemin!),
          indicateursListe,
          fichesLiees,
          actionsLiees,
          annexes,
          notesSuivi,
        })
      );
    }
  }, [isLoading]);

  return <></>;
};

const ExportFicheActionButton = ({ fiche }: { fiche: FicheAction }) => {
  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element | undefined>(undefined);

  const fileName = `fiche-action-${fiche.id}`;

  return (
    <>
      <ExportPDFButton
        {...{ content, fileName }}
        requestData={() => setIsDataRequested(true)}
      />

      {isDataRequested && (
        <FicheActionPdfContent
          fiche={fiche}
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
