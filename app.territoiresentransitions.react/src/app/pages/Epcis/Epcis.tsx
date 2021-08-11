// import { Route } from "type-route";
// import { routes } from "app/Router";
import { AddDialog } from "./_AddDialog";

import "app/DesignSystem/buttons.css";
import "app/DesignSystem/core.css";
import "app/DesignSystem/variables.css";

import { makeStyles } from "@material-ui/core";
import React from "react";
import { overmind } from "core-logic/overmind";
import { EpciCard } from "./_EpciCard";

// type EpcisProps = { route: Route<typeof routes.epcis> };

const useStyle = makeStyles({
  card: {
    display: "flex",
    alignItems: "center",
    padding: "2rem 1.5rem 1.125rem",
    backgroundColor: "var(--beige)",
    borderBottom: "4px solid var(--bf500)", // var(--bf500)
    flexDirection: "column",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gridGap: "3rem",
  },
});

export const Epcis = () => {
  const classes = useStyle();
  const [addEpciDialogOpen, setAddEpciDialogOpen] = React.useState(false);

  const handleClickOpen = () => {
    setAddEpciDialogOpen(true);
  };

  return (
    <div className="app mx-5 mt-5">
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
      </section>

      <section>
        <h2 className="fr-h2 mb-20 text-center">
          Consulter toutes les collectivités
        </h2>

        <div className={classes.grid}>
          {overmind.state.allEpcis.map((epci) => (
            <EpciCard epci={epci} />
          ))}
          {/* {#each allEpcis as epci}
                <Card epci={epci}/>
            {/each} */}
        </div>
      </section>
      <AddDialog
        epcis={overmind.state.allEpcis}
        open={addEpciDialogOpen}
        close={() => {
          setAddEpciDialogOpen(false);
        }}
      />
    </div>
  );
};
