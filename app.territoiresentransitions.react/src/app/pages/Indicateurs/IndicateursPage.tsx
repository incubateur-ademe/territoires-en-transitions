import { lazy, Suspense } from "react";
import { renderLoader } from "../../utils/renderLoader";
import { overmind } from "core-logic/overmind";
import { useParams } from "react-router-dom";

const IndicateurLists = lazy(() => import("./IndicateurLists"));

/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateursPage = () => {
  const { epciId } = useParams<{ epciId: string }>();
  overmind.actions.setCurrentEpci(epciId);

  return (
    <div className="my-5 flex flex-col">
      <h1 className="fr-h1">Indicateurs</h1>
      <Suspense fallback={renderLoader()}>
        <IndicateurLists />
      </Suspense>
    </div>
  );
};
