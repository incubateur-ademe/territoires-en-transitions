export const Views = {
  defaultRoute: "/",
  home: {
    selector: "[data-test=home]",
  },
  "Toutes les collectivités": {
    route: "/toutes_collectivites",
    selector: "[data-test=ToutesLesCollectivites]",
  },
  "Mon compte": {
    route: "/profil/mon-compte",
    selector: "[data-test=MonCompte]",
  },
};

export const CollectivitePages = {
  "Gestion des membres": {
    route: "users",
    selector: "[data-test=Users]",
  },
  "Tableau de bord": {
    route: "tableau_bord",
    selector: "[data-test=TableauBord]",
  },
};
