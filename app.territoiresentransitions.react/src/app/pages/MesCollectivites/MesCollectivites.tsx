import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';
import {useEffect, useState} from 'react';

import {Spacer} from 'ui/shared';
import {AllEpciRead} from 'generated/dataLayer/all_epci_read';
import {AddDialog} from 'app/pages/MesCollectivites/_AddDialog';
import {SimpleEpciCard} from 'ui/epcis/SimpleEpciCard';

const MesCollectivites = () => {
  return (
    <div className="app fr-container m-5">
      <section className="text-center">
        <h1 className="fr-h1">Mes collectivités</h1>

        <h2 className="fr-h2 text-center mb-8">Rejoindre votre collectivité</h2>
        <div className="my-4">
          Pourquoi pas un petit texte qui explique un peu.
        </div>
        <AddDialog />
      </section>
    </div>
  );
};

export default MesCollectivites;
