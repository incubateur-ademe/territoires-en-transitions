// import { routes, useRoute } from "app/Router";

export const Navigation = () => {
  // const route = useRoute();

  return (
    <div className="fr-header__tools">
      <div className="fr-header__tools-links">
        <ul className="fr-links-group">
          {/* {#if isLogged} */}
          {/* {#if epci} */}
          <li>
            epci.nom{" "}
            <a className="fr-link" href="/epcis/">
              Changer
            </a>
          </li>
          {/* {/if} */}
          {/* {#if epciId} */}
          <li>
            <a className="fr-link" href="/fiches/?epci_id={epciId}">
              Mon plan d'actions
            </a>
          </li>
          <li>
            <a
              className="fr-link"
              href="/actions_referentiels/?epci_id={epciId}"
            >
              Référentiels
            </a>
          </li>
          <li>
            <a className="fr-link" href="/indicateurs/?epci_id={epciId}">
              Indicateurs
            </a>
          </li>
          {/* {/if} */}
          <li>
            <a className="fr-link fr-fi-account-line" href="/auth/signout/">
              Déconnexion
            </a>
          </li>
        </ul>
      </div>
    </div>

    // <UiAppBar isLoading={false}>
    //   <UiTabs tabValue={route.name}>
    //     <LinkTab
    //       label="Epcis"
    //       {...routes.epcis().link}
    //       value={routes.epcis().name}
    //     />
    //     <LinkTab
    //       label="Actions Referentiels"
    //       {...routes.actionsReferentiels().link}
    //       value={routes.actionsReferentiels().name}
    //     />
    //   </UiTabs>
    // </UiAppBar>
  );
};
