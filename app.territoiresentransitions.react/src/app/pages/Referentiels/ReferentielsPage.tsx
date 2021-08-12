import React, {lazy, Suspense} from 'react';
import {renderLoader} from "../../utils/renderLoader";

const ActionsReferentiels = lazy(() => import('./ActionsReferentiels'));


export const ReferentielsPage = () => {

    return (
        <Suspense fallback={renderLoader()}>
            <ActionsReferentiels/>
        </Suspense>
    );
};