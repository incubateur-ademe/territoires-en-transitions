import { FicheAction } from '@/api/plan-actions';
import { useGetEtapes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/etapes/use-get-etapes';
import { useListActionsWithStatuts } from '@/app/referentiels/actions/use-list-actions';
import ExportPDFButton from '@/app/ui/export-pdf/ExportPDFButton';
import { createElement, useEffect, useState } from 'react';
import { useIndicateurDefinitions } from '../../Indicateurs/Indicateur/useIndicateurDefinition';
import { useAnnexesFicheActionInfos } from '../FicheAction/data/useAnnexesFicheActionInfos';
import { useFicheActionNotesSuivi } from '../FicheAction/data/useFicheActionNotesSuivi';
import { useFichesActionLiees } from '../FicheAction/data/useFichesActionLiees';
import { useFicheActionChemins } from '../PlanAction/data/usePlanActionChemin';
import FicheActionPdf from './FicheActionPdf/FicheActionPdf';
import { TSectionsValues } from './utils';

type FicheActionPdfContentProps = {
  fiche: FicheAction;
  options?: TSectionsValues;
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
    useIndicateurDefinitions((fiche.indicateurs ?? []).map((ind) => ind.id));

  const { data: fichesLiees, isLoading: isLoadingFichesLiees } =
    useFichesActionLiees(fiche.id);

  const { data: actionsLiees, isLoading: isLoadignActionsListe } =
    useListActionsWithStatuts({
      actionIds: fiche?.actions?.map((action) => action.id) ?? [],
    });

  const { data: annexes, isLoading: isLoadingAnnexes } =
    useAnnexesFicheActionInfos(fiche.id);

  const { data: notesSuivi, isLoading: isLoadingNotesSuivi } =
    useFicheActionNotesSuivi(fiche);

  const { data: etapes, isLoading: isLoadingEtapes } = useGetEtapes({
    id: fiche.id,
  });

  const isLoading =
    isLoadingIndicateurs ||
    isLoadingFichesLiees ||
    isLoadignActionsListe ||
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
          actionsLiees: actionsLiees ?? [],
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
};

const ExportFicheActionButton = ({
  fiche,
  options,
}: ExportFicheActionButtonProps) => {
  const [isDataRequested, setIsDataRequested] = useState(false);
  const [content, setContent] = useState<JSX.Element | undefined>(undefined);

  const fileName = `fiche-action-${fiche.id}`;

  return (
    <>
      <ExportPDFButton
        {...{ content, fileName }}
        requestData={() => setIsDataRequested(true)}
        size="md"
        variant="primary"
        children="Exporter en PDF"
      />

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
