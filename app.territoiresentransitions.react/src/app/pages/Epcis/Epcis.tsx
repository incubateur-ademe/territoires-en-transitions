import {AddDialog} from 'app/pages/Epcis/_AddDialog';

import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import React from 'react';
import {OwnedEpciCard} from 'app/pages/Epcis/_OwnedEpciCard';
import {SimpleEpciCard} from 'app/pages/Epcis/_SimpleEpciCard';

import {allSortedEpcis, currentUserEpcis} from 'core-logic/hooks';
import {Spacer} from 'ui/shared';

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
        <Spacer />
        <h2 className="fr-h2 mb-20 text-center">Vos collectivités</h2>
        <Spacer />
        <div className="flex flex-col justify-evenly">
          {usersEpcis.map(epci => (
            <OwnedEpciCard epci={epci} key={epci.id} />
          ))}
          <div>
            <div className="flex flex-col items-center pt-4 pr-6 pb-10 bg-beige border-bf500 border-b-4">
              <h3 className="fr-h3">…</h3>
              <button className="fr-btn fr-btn--sm" onClick={handleClickOpen}>
                Ajouter ma collectivité
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="fr-h2 pt-20 pb-10 text-center">
          Consulter toutes les collectivités
        </h2>

        <div className="grid grid-cols-3 gap-12">
          {allEpcis.map(epci => (
            <SimpleEpciCard epci={epci} key={epci.id} />
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
