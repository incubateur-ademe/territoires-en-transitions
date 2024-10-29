import { createElement, useEffect, useState } from 'react';
import { FicheAction } from '@tet/api/plan-actions';
import { useFicheActionChemins } from '../../PlanAction/data/usePlanActionChemin';
import { useIndicateurDefinitions } from '../../../Indicateurs/Indicateur/useIndicateurDefinition';
import { useFichesActionLiees } from '../data/useFichesActionLiees';
import { useActionListe } from '../data/options/useActionListe';
import ExportPDFButton from 'ui/exportPdf/ExportPDFButton';
import FicheActionPdf from '../FicheActionPdf/FicheActionPdf';

type FicheActionPdfContentProps = {
  fiche: FicheAction;
  generateContent: (content: JSX.Element) => void;
};

const FicheActionPdfContent = ({
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

  useEffect(() => {
    if (
      !isLoadingIndicateurs &&
      !isLoadingFichesLiees &&
      !isLoadignActionsListe &&
      !isLoadingAxes
    ) {
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
        })
      );
    }
  }, [
    isLoadingIndicateurs,
    isLoadingFichesLiees,
    isLoadignActionsListe,
    isLoadingAxes,
  ]);

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
