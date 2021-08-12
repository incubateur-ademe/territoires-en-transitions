import React, {lazy, Suspense} from 'react';
import {renderLoader} from "../../utils/renderLoader";

const IndicateurLists = lazy(() => import('./IndicateurLists'));


/**
 * Indicateurs page show both indicateurs personnalisés and indicateurs référentiel.
 */
export const IndicateursPage = () => {

    return (
        <div className="my-5 flex flex-col">
            <h1 className="fr-h1">Indicateurs</h1>

            <Suspense fallback={renderLoader()}>
                <IndicateurLists/>
            </Suspense>
        </div>
    );
};


