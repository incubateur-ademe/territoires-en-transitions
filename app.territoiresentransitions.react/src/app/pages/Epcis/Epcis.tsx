import {AddDialog} from 'app/pages/Epcis/_AddDialog';

import 'app/DesignSystem/buttons.css';
import 'app/DesignSystem/core.css';
import 'app/DesignSystem/variables.css';

import {makeStyles} from '@material-ui/core';
import React, {useEffect} from 'react';
import {useActions, useAppState} from 'core-logic/overmind';
import {EpciCard} from 'app/pages/Epcis/_EpciCard';
import {allSortedEpcis, currentUserEpcis} from 'core-logic/hooks';

const useStyle = makeStyles({
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '2rem 1.5rem 1.125rem',
    backgroundColor: 'var(--beige)',
    borderBottom: '4px solid var(--bf500)', // var(--bf500)
    flexDirection: 'column',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gridGap: '3rem',
  },
});

const Epcis = () => {
  const usersEpcis = currentUserEpcis();
  const allEpcis = allSortedEpcis();
  const classes = useStyle();
  const [addEpciDialogOpen, setAddEpciDialogOpen] = React.useState(false);

  const handleClickOpen = () => {
    setAddEpciDialogOpen(true);
  };

  return (
    <div className="app fr-container mx-5 mt-5">
      <section>
        <h1 className="fr-h1 mb-16 text-center">Bienvenue !</h1>

        <h2 className="fr-h2 mb-20 text-center">Vos collectivités</h2>

        <div className={classes.grid}>
          <div className={classes.card}>
            <h3 className="fr-h3">…</h3>
            <button className="fr-btn fr-btn--sm" onClick={handleClickOpen}>
              Ajouter ma collectivité
            </button>
          </div>
        </div>

        <div className={classes.grid}>
          {usersEpcis.map(epci => (
            <EpciCard epci={epci} key={epci.id} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="fr-h2 mb-20 text-center">
          Consulter toutes les collectivités
        </h2>

        <div className={classes.grid}>
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
