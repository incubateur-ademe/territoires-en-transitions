import React, {lazy, Suspense} from 'react';
import {renderLoader} from "../../utils/renderLoader";

const Indicateurs = lazy(() => import('./Indicateurs'));


export const IndicateursPage = () => {

    return (
        <Suspense fallback={renderLoader()}>
            <Indicateurs/>
        </Suspense>
    );
};


