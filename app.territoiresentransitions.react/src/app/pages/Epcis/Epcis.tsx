import {AddDialog} from 'app/pages/Epcis/_AddDialog';

import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import React, {useEffect, useState} from 'react';
import {OwnedEpciCard} from 'app/pages/Epcis/_OwnedEpciCard';
import {SimpleEpciCard} from 'app/pages/Epcis/_SimpleEpciCard';

import {allSortedEpcis, currentUserEpcis} from 'core-logic/hooks';
import {Spacer} from 'ui/shared';
import {epciReadEndpoint} from 'core-logic/api/endpoints/EpciReadEndpoint';
import {EpciRead} from 'generated/dataLayer/epci_read';

const Epcis = () => {
  const usersEpcis = currentUserEpcis();

  const [allEpciReads, setAllEpciReads] = useState<EpciRead[]>([]);
  useEffect(() => {
    epciReadEndpoint
      .getBy({})
      .then(allEpciReads => setAllEpciReads(allEpciReads));
  }, []);

  const [addEpciDialogOpen, setAddEpciDialogOpen] = React.useState(false);

  const handleClickOpen = () => {
    setAddEpciDialogOpen(true);
  };

  return (
    <div className="app fr-container m-5">
      <section>
        <h1 className="fr-h1 text-center">Bienvenue !</h1>
        <Spacer size={3} />
        <h2 className="fr-h2 mb-4 text-center">Vos collectivités</h2>

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
      <AddDialog
        epcis={allEpciReads}
        open={addEpciDialogOpen}
        close={() => {
          setAddEpciDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Epcis;
