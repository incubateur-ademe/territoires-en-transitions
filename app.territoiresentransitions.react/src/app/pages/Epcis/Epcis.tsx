import {AddDialog} from 'app/pages/Epcis/_AddDialog';

import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';

import {makeStyles} from '@material-ui/core';
import React, {useEffect} from 'react';
import {useActions, useAppState} from 'core-logic/overmind';
import {EpciCard} from 'app/pages/Epcis/_EpciCard';
import {allSortedEpcis, currentUserEpcis} from 'core-logic/hooks';

const Epcis = () => {
  const usersEpcis = currentUserEpcis();
  const allEpcis = allSortedEpcis();
  const [addEpciDialogOpen, setAddEpciDialogOpen] = React.useState(false);

  const handleClickOpen = () => {
    setAddEpciDialogOpen(true);
  };

  return (
    <div className="app fr-container m-5">
      <section>
        <h1 className="fr-h1 mb-16 text-center">Bienvenue !</h1>

        <h2 className="fr-h2 mb-20 text-center">Vos collectivités</h2>

        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col items-center pt-4 pr-6 pb-10 bg-gray-50">
            <h3 className="fr-h3">…</h3>
            <button className="fr-btn fr-btn--sm" onClick={handleClickOpen}>
              Ajouter ma collectivité
            </button>
          </div>
          {usersEpcis.map(epci => (
            <EpciCard epci={epci} key={epci.id} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="fr-h2 pt-20 pb-10 text-center">
          Consulter toutes les collectivités
        </h2>

        <div className="grid grid-cols-4 gap-3">
          {allEpcis.map(epci => (
            <EpciCard epci={epci} key={epci.id} />
          ))}
        </div>
      </section>
      <AddDialog
        epcis={allEpcis}
        open={addEpciDialogOpen}
        close={() => {
          setAddEpciDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Epcis;
