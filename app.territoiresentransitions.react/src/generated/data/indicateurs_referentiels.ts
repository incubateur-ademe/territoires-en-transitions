import {IndicateurReferentiel} from '../models/indicateur_referentiel';

export const indicateurs: IndicateurReferentiel[] = [
  new IndicateurReferentiel({
    id: 'cae-1a',
    action_ids: ['citergie__1.1.1'],
    nom: '\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2.\u003c/p\u003e\n\u003cp\u003eL\u0027indicateur, issu d\u0027un diagnostic d\u0027\u00e9missions de gaz \u00e0 effet de serre mesure la quantit\u00e9 totale d\u0027\u00e9missions annuelle des diff\u00e9rents secteurs d\u0027activit\u00e9s et des habitants du territoire, selon les exigences r\u00e9glementaires des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial).\u003c/p\u003e\n\u003cp\u003eA savoir : les  \u00e9missions  directes  produites par l\u0027ensemble des secteurs r\u00e9sidentiel, tertiaire, transport routier, autres transports, agriculture, d\u00e9chets, industrie hors branche \u00e9nergie, branche \u00e9nergie (hors production d\u0027\u00e9lectricit\u00e9, de chaleur et de froid pour les \u00e9missions de gaz \u00e0 effet de serre, dont les \u00e9missions correspondantes sont comptabilis\u00e9es au stade de la consommation).\u003c/p\u003e\n\u003cp\u003eIl ne s\u0027agit pas du bilan GES \u0026quot;Patrimoine et comp\u00e9tences\u0026quot;.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1b',
    action_ids: ['citergie__1.1.1'],
    nom: 'Emissions de gaz \u00e0 effet de serre annuelles du territoire par habitant (teq CO2/hab)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 par habitant.\u003c/p\u003e\n\u003cp\u003ePour faciliter les comparaisons, l\u2019indicateur est ramen\u00e9 au nombre d\u2019habitants (population municipale selon l\u2019INSEE).\u003c/p\u003e\n\u003cp\u003ePour rappel, objectifs nationaux : division par 4 (-75 %) des \u00e9missions de gaz \u00e0 effet de serre d\u2019ici 2050 par rapport \u00e0 1990 (loi POPE) et \u00e9tape interm\u00e9diaire de -40% entre 1990 et 2030 (loi de transition \u00e9nerg\u00e9tique).\u003c/p\u003e\n\u003cp\u003eL\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'teq CO2/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-1c',
    action_ids: ['citergie__1.2.4'],
    nom: 'Emissions de gaz \u00e0 effet de serre du r\u00e9sidentiel (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur r\u00e9sidentiel.\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1d',
    action_ids: ['citergie__6.3.1'],
    nom: 'Emissions de gaz \u00e0 effet de serre du tertiaire (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur tertiaire.\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1e',
    action_ids: ['citergie__1.2.2'],
    nom: 'Emissions de gaz \u00e0 effet de serre du transport routier (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur du transport routier.\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1f',
    action_ids: ['citergie__1.2.2'],
    nom: 'Emissions de gaz \u00e0 effet de serre de secteurs "autres transports" (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur des autres transport (hors routier).\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1g',
    action_ids: ['citergie__6.4.1'],
    nom: 'Emissions de gaz \u00e0 effet de serre de l\u0027agriculture (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur de l\u0027agriculture.\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1h',
    action_ids: ['citergie__1.2.3'],
    nom: 'Emissions de gaz \u00e0 effet de serre des d\u00e9chets (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur des d\u00e9chets.\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1i',
    action_ids: ['citergie__6.3.1'],
    nom: 'Emissions de gaz \u00e0 effet de serre de l\u0027industrie hors branche \u00e9nergie (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur de l\u0027industrie hors branche \u00e9nergie.\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-1j',
    action_ids: ['citergie__6.3.1'],
    nom: 'Emissions de gaz \u00e0 effet de serre de l\u0027industrie branche \u00e9nergie (teq CO2)',
    description:
      '\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire exprim\u00e9es en tonnes \u00e9quivalent CO2 pour le secteur de l\u0027industrie branche \u00e9nergie (hors production d\u0027\u00e9lectricit\u00e9, de chaleur et de froid pour les \u00e9missions de gaz \u00e0 effet de serre, dont les \u00e9missions correspondantes sont comptabilis\u00e9es au stade de la consommation).\u003c/p\u003e\n\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global\u003c/p\u003e\n\u003cp\u003e\u00c9missions de gaz \u00e0 effet de serre globales annuelles du territoire (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-2a',
    action_ids: ['citergie__1.1.1'],
    nom: 'Consommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh)',
    description:
      '\u003cp\u003eCet indicateur estime la consommation \u00e9nerg\u00e9tique finale annuelle du territoire, selon les exigences r\u00e9glementaires des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial).\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2b',
    action_ids: ['citergie__1.1.1'],
    nom: 'Consommation \u00e9nerg\u00e9tique annuelle du territoire par habitant (MWh/hab.an)',
    description:
      '\u003cp\u003ePour faciliter les comparaisons, l\u2019indicateur est ramen\u00e9 au nombre d\u2019habitants (population municipale selon l\u2019INSEE). Pr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire. L\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'MWh/hab.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-2c',
    action_ids: ['citergie__3.2.2'],
    nom: 'Consommation \u00e9nerg\u00e9tique annuelle du territoire pour la chaleur et le rafra\u00eechissement (GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par usage de l\u0027indicateur 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh)\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eutile aux calculs des taux de production ENR (d\u00e9nominateur).\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2d',
    action_ids: ['citergie__3.2.3'],
    nom: 'Consommation \u00e9nerg\u00e9tique annuelle du territoire pour l\u0027\u00e9lectricit\u00e9 (GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par usage de l\u0027indicateur 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh)\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eutile aux calculs des taux de production ENR (d\u00e9nominateur).\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2e',
    action_ids: ['citergie__1.2.4'],
    nom: 'Consommation \u00e9nerg\u00e9tique du r\u00e9sidentiel  (GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh).\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2f',
    action_ids: ['citergie__6.3.1'],
    nom: 'Consommation \u00e9nerg\u00e9tique du tertiaire (GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh).\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2g',
    action_ids: ['citergie__1.2.2'],
    nom: 'Consommation \u00e9nerg\u00e9tique  du transport routier(GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh).\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2h',
    action_ids: ['citergie__1.2.2'],
    nom: 'Consommation \u00e9nerg\u00e9tique du secteur "autres transports" (teq CO2)',
    description:
      '\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh).\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-2i',
    action_ids: ['citergie__6.4.1'],
    nom: 'Consommation \u00e9nerg\u00e9tique de l\u0027agriculture (GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh).\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2j',
    action_ids: ['citergie__1.2.3'],
    nom: 'Consommation \u00e9nerg\u00e9tique des d\u00e9chets (GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh).\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-2k',
    action_ids: ['citergie__6.3.1'],
    nom: 'Consommation \u00e9nerg\u00e9tique de l\u0027industrie hors branche \u00e9nergie (GWh)',
    description:
      '\u003cp\u003eD\u00e9composition par secteur r\u00e9glementaire de l\u0027indicateur global 2a:\u003c/p\u003e\n\u003cp\u003eConsommation \u00e9nerg\u00e9tique globale annuelle du territoire (GWh).\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'GWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-3a',
    action_ids: ['citergie__1.1.1'],
    nom: 'Production d\u2019\u00e9nergie renouvelable globale du territoire (MWh)',
    description:
      '\u003cp\u003eCet indicateur mesure la production d\u2019\u00e9nergie renouvelable totale sur le territoire, selon les exigences r\u00e9glementaires des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial), c\u0027est \u00e0 dire incluant les fili\u00e8res de production:\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003ed\u2019\u00e9lectricit\u00e9: \u00e9olien  terrestre, solaire  photovolta\u00efque, solaire  thermodynamique,  hydraulique,  biomasse  solide, biogaz, g\u00e9othermie\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ede  chaleur: biomasse  solide,  pompes  \u00e0  chaleur,  g\u00e9othermie,  solaire  thermique,  biogaz\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ede biom\u00e9thane et de biocarburants.\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n\u003cp\u003ePr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'MWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-3b',
    action_ids: ['citergie__1.1.1'],
    nom: 'Production d\u2019\u00e9nergie renouvelable globale du territoire (% de la consommation)',
    description:
      '\u003cp\u003eD\u00e9clinaison en % de la consommation \u00e9nerg\u00e9tique du territoire de l\u0027indicateur 3a:\u003c/p\u003e\n\u003cp\u003eProduction d\u2019\u00e9nergie renouvelable globale du territoire (MWh).\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: '% de la consommation',
  }),

  new IndicateurReferentiel({
    id: 'cae-4a',
    action_ids: ['citergie__1.1.1'],
    nom: 'Emissions annuelles de Nox (tonnes)',
    description:
      '\u003cp\u003eCes indicateurs estiment les \u00e9missions annuelles des six polluants atmosph\u00e9riques exig\u00e9s dans le contenu r\u00e9glementaire des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial) : oxydes d\u2019azote (NOx), les particules PM 10 et PM 2,5 et les compos\u00e9s organiques volatils (COV), tels que d\u00e9finis au I de l\u2019article R. 221-1 du m\u00eame code, ainsi que le dioxyde de soufre (SO2 ) et l\u2019ammoniac (NH3). Pr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire. Les donn\u00e9es peuvent \u00eatre fournies notamment par les associations agr\u00e9es pour la surveillance de la qualit\u00e9 de l\u0027air (AASQA). L\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'tonnes',
  }),

  new IndicateurReferentiel({
    id: 'cae-4b',
    action_ids: ['citergie__1.1.1'],
    nom: 'Emissions annuelles de PM10 (tonnes)',
    description:
      '\u003cp\u003eCes indicateurs estiment les \u00e9missions annuelles des six polluants atmosph\u00e9riques exig\u00e9s dans le contenu r\u00e9glementaire des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial) : oxydes d\u2019azote (NOx), les particules PM 10 et PM 2,5 et les compos\u00e9s organiques volatils (COV), tels que d\u00e9finis au I de l\u2019article R. 221-1 du m\u00eame code, ainsi que le dioxyde de soufre (SO2 ) et l\u2019ammoniac (NH3). Pr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire. Les donn\u00e9es peuvent \u00eatre fournies notamment par les associations agr\u00e9es pour la surveillance de la qualit\u00e9 de l\u0027air (AASQA). L\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'tonnes',
  }),

  new IndicateurReferentiel({
    id: 'cae-4c',
    action_ids: ['citergie__1.1.1'],
    nom: 'Emissions annuelles de PM2,5 (tonnes)',
    description:
      '\u003cp\u003eCes indicateurs estiment les \u00e9missions annuelles des six polluants atmosph\u00e9riques exig\u00e9s dans le contenu r\u00e9glementaire des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial) : oxydes d\u2019azote (NOx), les particules PM 10 et PM 2,5 et les compos\u00e9s organiques volatils (COV), tels que d\u00e9finis au I de l\u2019article R. 221-1 du m\u00eame code, ainsi que le dioxyde de soufre (SO2 ) et l\u2019ammoniac (NH3). Pr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire. Les donn\u00e9es peuvent \u00eatre fournies notamment par les associations agr\u00e9es pour la surveillance de la qualit\u00e9 de l\u0027air (AASQA). L\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'tonnes',
  }),

  new IndicateurReferentiel({
    id: 'cae-4d',
    action_ids: ['citergie__1.1.1'],
    nom: 'Emissions annuelles de COV (tonnes)',
    description:
      '\u003cp\u003eCes indicateurs estiment les \u00e9missions annuelles des six polluants atmosph\u00e9riques exig\u00e9s dans le contenu r\u00e9glementaire des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial) : oxydes d\u2019azote (NOx), les particules PM 10 et PM 2,5 et les compos\u00e9s organiques volatils (COV), tels que d\u00e9finis au I de l\u2019article R. 221-1 du m\u00eame code, ainsi que le dioxyde de soufre (SO2 ) et l\u2019ammoniac (NH3). Pr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire. Les donn\u00e9es peuvent \u00eatre fournies notamment par les associations agr\u00e9es pour la surveillance de la qualit\u00e9 de l\u0027air (AASQA). L\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'tonnes',
  }),

  new IndicateurReferentiel({
    id: 'cae-4e',
    action_ids: ['citergie__1.1.1'],
    nom: 'Emissions annuelles de SO2  (tonnes)',
    description:
      '\u003cp\u003eCes indicateurs estiment les \u00e9missions annuelles des six polluants atmosph\u00e9riques exig\u00e9s dans le contenu r\u00e9glementaire des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial) : oxydes d\u2019azote (NOx), les particules PM 10 et PM 2,5 et les compos\u00e9s organiques volatils (COV), tels que d\u00e9finis au I de l\u2019article R. 221-1 du m\u00eame code, ainsi que le dioxyde de soufre (SO2 ) et l\u2019ammoniac (NH3). Pr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire. Les donn\u00e9es peuvent \u00eatre fournies notamment par les associations agr\u00e9es pour la surveillance de la qualit\u00e9 de l\u0027air (AASQA). L\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'tonnes',
  }),

  new IndicateurReferentiel({
    id: 'cae-4f',
    action_ids: ['citergie__1.1.1'],
    nom: 'Emissions annuelles de NH3 (tonnes)',
    description:
      '\u003cp\u003eCes indicateurs estiment les \u00e9missions annuelles des six polluants atmosph\u00e9riques exig\u00e9s dans le contenu r\u00e9glementaire des PCAET (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial) : oxydes d\u2019azote (NOx), les particules PM 10 et PM 2,5 et les compos\u00e9s organiques volatils (COV), tels que d\u00e9finis au I de l\u2019article R. 221-1 du m\u00eame code, ainsi que le dioxyde de soufre (SO2 ) et l\u2019ammoniac (NH3). Pr\u00e9ciser l\u0027ann\u00e9e de r\u00e9f\u00e9rence en commentaire. Les donn\u00e9es peuvent \u00eatre fournies notamment par les associations agr\u00e9es pour la surveillance de la qualit\u00e9 de l\u0027air (AASQA). L\u0027\u00e9valuation est bas\u00e9e sur l\u0027\u00e9volution de l\u0027indicateur.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'tonnes',
  }),

  new IndicateurReferentiel({
    id: 'cae-5',
    action_ids: ['citergie__1.2.2'],
    nom: 'Part modale de la voiture (en nombre de d\u00e9placements)',
    description:
      '\u003cp\u003eL\u0027objectif de cet indicateur est de juger de l\u0027impact des mesures de planification des d\u00e9placements sur l\u0027utilisation de la voiture sur le territoire, via le suivi de la part modale de la voiture (nombre de d\u00e9placements en voiture/nombre de d\u00e9placements). Pour information, des valeurs limites et cibles indicatives de parts modales sont donn\u00e9es, bas\u00e9es sur les moyennes nationales et les meilleurs scores atteints par des collectivit\u00e9s Cit\u0027ergie. Mais le conseiller doit appr\u00e9cier les efforts de la collectivit\u00e9, en fonction du contexte territorial, et les progr\u00e8s r\u00e9alis\u00e9s sur l\u0027indicateur.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite : 65 % (ville dans une aire urbaine) / 75% (EPCI ou ville hors aire urbaine)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible : 40 % (ville dans une aire urbaine) / 50 % (EPCI ou ville hors aire urbaine)\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'mobilites',
    unite: 'en nombre de d\u00e9placements',
  }),

  new IndicateurReferentiel({
    id: 'cae-6a',
    action_ids: ['citergie__1.2.3'],
    nom: 'Production de d\u00e9chets m\u00e9nagers et assimil\u00e9s (avec d\u00e9blais et gravats) par habitant (kg/hab.an)',
    description:
      '\u003cp\u003eLes d\u00e9chets m\u00e9nagers et assimil\u00e9s comprennent les ordures m\u00e9nag\u00e8res r\u00e9siduelles, les collectes s\u00e9lectives et les d\u00e9chets collect\u00e9s en d\u00e9ch\u00e8teries (y compris d\u00e9chets et gravats), soit la totalit\u00e9 des d\u00e9chets des m\u00e9nages et des non m\u00e9nages pris en charge par le service public. Les d\u00e9chets produits par les services municipaux (d\u00e9chets de l\u2019assainissement collectif, d\u00e9chets de nettoyage des rues, de march\u00e9, \u2026) ne rel\u00e8vent pas de ce p\u00e9rim\u00e8tre.  Le calcul ne consid\u00e8re que les services de collecte op\u00e9rationnels, c\u0027est-\u00e0-dire ceux qui ont fonctionn\u00e9 au moins une journ\u00e9e au cours de l\u0027ann\u00e9e de r\u00e9f\u00e9rence du calcul et les d\u00e9ch\u00e8teries op\u00e9rationnelles, c\u0027est-\u00e0-dire des d\u00e9ch\u00e8teries qui ont \u00e9t\u00e9 ouvertes au moins une journ\u00e9e au cours de l\u0027ann\u00e9e de r\u00e9f\u00e9rence du calcul.\u003c/p\u003e\n\u003cp\u003eLa valeur limite est issue des chiffres-cl\u00e9s d\u00e9chets de l\u2019ADEME, \u00e9dition 2016, bas\u00e9 sur l\u2019enqu\u00eate Collecte 2013 et la valeur cible des 47 territoires pionniers en France.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite : 573 kg/hab.an\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible : 480 kg/hab.an\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'dechets',
    unite: 'avec d\u00e9blais et gravats',
  }),

  new IndicateurReferentiel({
    id: 'cae-6b',
    action_ids: ['citergie__1.2.3'],
    nom: 'Production Ordures m\u00e9nag\u00e8res r\u00e9siduelles (kg/hab)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 6a:\u003c/p\u003e\n\u003cp\u003eProduction de d\u00e9chets m\u00e9nagers et assimil\u00e9s (avec d\u00e9blais et gravats) par habitant (kg/hab.an)\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eL\u0027indicateur concerne uniquement les ordures m\u00e9nag\u00e8res r\u00e9siduelles, c\u2019est-\u00e0-dire les d\u00e9chets collect\u00e9s en m\u00e9lange (poubelles ordinaires). La valeur limite est issue des chiffres-cl\u00e9s d\u00e9chets de l\u2019ADEME, \u00e9dition 2016, bas\u00e9 sur l\u2019enqu\u00eate Collecte 2013 et la valeur cible des 47 territoires pionniers en France.\u003c/li\u003e\n\u003c/ul\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite : 265 kg/hab.an\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible : 120 kg/hab.an\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'dechets',
    unite: 'kg/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-6c',
    action_ids: ['citergie__1.2.3'],
    nom: 'Production de d\u00e9chets collect\u00e9s s\u00e9lectivement, soit en porte-\u00e0-porte, soit en apport volontaire (kg/hab)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 6a:\u003c/p\u003e\n\u003cp\u003eProduction de d\u00e9chets m\u00e9nagers et assimil\u00e9s (avec d\u00e9blais et gravats) par habitant (kg/hab.an)\u003c/p\u003e\n\u003cp\u003e: emballages, d\u00e9chets fermentescibles, verre\u2026\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'kg/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-6d',
    action_ids: ['citergie__1.2.3'],
    nom: 'Production de d\u00e9chets occasionnels (kg/hab)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 6a:\u003c/p\u003e\n\u003cp\u003eProduction de d\u00e9chets m\u00e9nagers et assimil\u00e9s (avec d\u00e9blais et gravats) par habitant (kg/hab.an)\u003c/p\u003e\n\u003cp\u003e: encombrants, d\u00e9chets verts, d\u00e9blais et gravats\u2026\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'kg/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-7',
    action_ids: ['citergie__1.2.3'],
    nom: 'Recyclage mati\u00e8re et organique des d\u00e9chets m\u00e9nagers et assimil\u00e9s (%)',
    description:
      '\u003cp\u003eIl s\u2019agit de la part (en poids) des d\u00e9chets m\u00e9nagers et assimil\u00e9s (DMA, cf. d\u00e9finition ci-dessus) orient\u00e9s vers le recyclage mati\u00e8re et organique. Le recyclage consiste en toute op\u00e9ration de valorisation par laquelle les d\u00e9chets, y compris organiques, sont retrait\u00e9s en substances, mati\u00e8res ou produits pour resservir \u00e0 leur fonction initiale ou \u00e0 d\u2019autres fins (d\u00e9finition du code de l\u2019environnement). La valorisation \u00e9nerg\u00e9tique n\u0027est pas prise en compte ici.\u003c/p\u003e\n\u003cp\u003eNB : On mesure les d\u00e9chets \u00ab orient\u00e9s vers le recyclage \u00bb, les refus de tri ne sont donc pas d\u00e9duits. Ne sont pas consid\u00e9r\u00e9s ici comme \u00ab orient\u00e9s vers le recyclage \u00bb les d\u00e9chets entrant dans des installations de tri m\u00e9canobiologique. Pour ces derniers, seuls les flux sortant orient\u00e9s vers la valorisation organique (compostage ou m\u00e9thanisation) ou vers le recyclage mati\u00e8re (m\u00e9taux r\u00e9cup\u00e9r\u00e9s) sont \u00e0 int\u00e9grer dans les flux \u00ab orient\u00e9s vers le recyclage \u00bb. Les m\u00e2chefers valoris\u00e9s ainsi que les m\u00e9taux r\u00e9cup\u00e9r\u00e9s sur m\u00e2chefers ne sont pas int\u00e9gr\u00e9s.\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-8',
    action_ids: ['citergie__1.2.4', 'citergie__6.5.4'],
    nom: 'Nombre de logements r\u00e9nov\u00e9s \u00e9nerg\u00e9tiquement (nb logements r\u00e9nov\u00e9s/100 logements existants)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le nombre annuel de logements r\u00e9nov\u00e9s via les dispositifs de subventionnement et d\u2019accompagnement dont la collectivit\u00e9 est partenaire, ramen\u00e9 au nombre de logements du territoire (pour 100 logements). Pour rappel l\u2019objectif national du plan de r\u00e9novation \u00e9nerg\u00e9tique de l\u2019habitat est de 500\u00a0000 logements r\u00e9nov\u00e9s par an en 2017, soit 1,4 logements r\u00e9nov\u00e9s pour 100 logements existants (35,425 millions de logements en 2016 selon l\u2019INSEE).\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'nb logements r\u00e9nov\u00e9s/100 logements existants',
  }),

  new IndicateurReferentiel({
    id: 'cae-9',
    action_ids: ['citergie__1.3.1'],
    nom: 'Compacit\u00e9 des formes urbaines',
    description:
      '\u003cp\u003eTrois indicateurs au choix :\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eRapport annuel entre nouvelle surface construite ou r\u00e9habilit\u00e9e sur des sites en reconversion (sites d\u00e9j\u00e0 urbanis\u00e9s : friches industrielles, dents creuses, habitat insalubre...) / nouvelle surface construite en extension (en limite d\u0027urbanisation ou sur des espaces naturels ou agricoles). La comptabilisation se fait sur la base des permis de construire. Pour une agglom\u00e9ration, le ratio de 2 (soit 1/3 en extension et 2/3 en renouvellement) est une bonne performance ; pour une ville-centre les objectifs vis\u00e9s pourront \u00eatre plus \u00e9lev\u00e9s.\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eNombre de nouveaux logements collectifs et individuels group\u00e9s / nb total de logements autoris\u00e9s dans l\u2019ann\u00e9e (disponibles dans la base SITADEL) la valeur moyenne des r\u00e9gions fran\u00e7aises est indiqu\u00e9e pour information (45%).\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ePart du foncier en friche : L\u2019indicateur permet d\u2019identifier et caract\u00e9riser les gisements fonciers locaux qualifi\u00e9s comme \u00e9tant \u00ab en friche \u00bb. Les enjeux sont d\u2019effectuer une veille fonci\u00e8re, d\u2019anticiper la formation de friches et d\u2019\u00e9tudier la mutabilit\u00e9 des espaces en friche. Compacit\u00e9 des formes urbaines\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'urbanisme',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-10',
    action_ids: ['citergie__1.3.1'],
    nom: 'Part des surfaces agricoles et naturelles (%)',
    description:
      '\u003cp\u003eIl s\u0027agit de la mesure de la consommation ou de la r\u00e9introduction d\u0027espaces naturels et agricoles au fil des ans gr\u00e2ce au suivi des surfaces r\u00e9serv\u00e9es \u00e0 ces usages dans les PLU, mesur\u00e9 en pourcentage de la surface totale de la collectivit\u00e9 (ha cumul\u00e9 des zones N et A/ha total). Ces surfaces sont non imperm\u00e9abilis\u00e9es, capteuses de CO2, productrices de ressources alimentaires, \u00e9nerg\u00e9tiques, et de biodiversit\u00e9. La valeur obtenue doit \u00eatre compar\u00e9e avec l\u0027indicateur issu de la pr\u00e9c\u00e9dente version du document d\u0027urbanisme de la collectivit\u00e9.\u003c/p\u003e\n',
    thematique_id: 'urbanisme',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-11',
    action_ids: ['citergie__1.3.1'],
    nom: 'Surface annuelle artificialis\u00e9e (ha/an)',
    description:
      '\u003cp\u003eL\u2019indicateur mesure les surfaces artificialis\u00e9es chaque ann\u00e9e a minima par l\u2019habitat et les activit\u00e9s, et dans la mesure du possible \u00e9galement pour les autres motifs (infrastructures routi\u00e8res, etc.). Si l\u2019indicateur n\u2019est pas disponible annuellement, il s\u2019agit de la moyenne annuelle sur une p\u00e9riode plus large, \u00e9tabli \u00e0 l\u2019occasion de l\u2019\u00e9laboration ou de la r\u00e9vision du PLU ou du SCOT (\u00e9valuation r\u00e8glementaire de la consommation d\u0027espaces naturels, agricoles et forestiers).\u003c/p\u003e\n',
    thematique_id: 'urbanisme',
    unite: 'ha/an',
  }),

  new IndicateurReferentiel({
    id: 'cae-12',
    action_ids: ['citergie__2.1.1'],
    nom: 'Part de b\u00e2timents publics ayant fait l\u0027objet d\u0027un diagnostic \u00e9nerg\u00e9tique',
    description:
      '\u003cp\u003eL\u0027indicateur mesure la part de b\u00e2timents publics (de pr\u00e9f\u00e9rence en surface, et par d\u00e9faut en nombre) ayant fait l\u0027objet d\u0027un diagnostic \u00e9nerg\u00e9tique (\u00e0 minima de type DPE, et de pr\u00e9f\u00e9rence un audit \u00e9nerg\u00e9tique plus pouss\u00e9). Le p\u00e9rim\u00e8tre des b\u00e2timents pris en compte est le plus large possible : celui dont elle est propri\u00e9taire ou celui dont elle est locataire ; les diagnostics pouvant \u00eatre port\u00e9s et financ\u00e9s par le propri\u00e9taire ou l\u0027utilisateur. Si le suivi est effectu\u00e9 conjointement au niveau communal et intercommunal, l\u0027indicateur peut-\u00eatre d\u00e9compos\u00e9 en deux volets : part de b\u00e2timents communaux ayant fait l\u0027objet d\u0027un diagnostic \u00e9nerg\u00e9tique et part de b\u00e2timents intercommunaux ayant fait l\u0027objet d\u0027un diagnostic \u00e9nerg\u00e9tique.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-13a',
    action_ids: ['citergie__2.1.1'],
    nom: 'D\u00e9penses \u00e9nerg\u00e9tiques de la collectivit\u00e9 (euros)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure les d\u00e9penses d\u2019\u00e9nergie pay\u00e9es directement par la collectivit\u00e9, c\u2019est-\u00e0-dire celles pay\u00e9es par la collectivit\u00e9 aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas) pour le patrimoine b\u00e2ti, l\u2019\u00e9clairage public et les carburants des v\u00e9hicules.\u003c/p\u003e\n\u003cp\u003eLes trois postes de d\u00e9penses sont \u00e9galement suivis ind\u00e9pendamment.\u003c/p\u003e\n\u003cp\u003eRapport\u00e9es au nombre d\u0027habitants, pour les communes, les valeurs peuvent-\u00eatre compar\u00e9es avec des valeurs de r\u00e9f\u00e9rences  tir\u00e9es de l\u0027enqu\u00eate ADEME-AITF-EDF-GDF \u0026quot;Energie et patrimoine communal 2012\u0026quot;.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-13b',
    action_ids: ['citergie__2.1.1'],
    nom: 'D\u00e9penses  \u00e9nerg\u00e9tiques - b\u00e2timents (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur de d\u00e9penses \u00e9nerg\u00e9tiques de la collectivit\u00e9s pour les b\u00e2timents\u003c/p\u003e\n\u003cp\u003eL\u0027indicateur mesure les d\u00e9penses d\u2019\u00e9nergie pay\u00e9es directement par la collectivit\u00e9, c\u2019est-\u00e0-dire celles pay\u00e9es par la collectivit\u00e9 aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas) pour les b\u00e2timents (patrimoine b\u00e2ti)\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-13c',
    action_ids: ['citergie__4.1.2'],
    nom: 'D\u00e9penses \u00e9nerg\u00e9tiques - v\u00e9hicules (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur de d\u00e9penses \u00e9nerg\u00e9tiques de la collectivit\u00e9 pour les carburants des v\u00e9hicules\u003c/p\u003e\n\u003cp\u003eL\u0027indicateur mesure les d\u00e9penses d\u2019\u00e9nergie pay\u00e9es directement par la collectivit\u00e9, c\u2019est-\u00e0-dire celles pay\u00e9es par la collectivit\u00e9 aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas) pour les carburants des v\u00e9hicules\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-13d',
    action_ids: ['citergie__2.3.5'],
    nom: 'D\u00e9penses \u00e9nerg\u00e9tiques - \u00e9clairage public  (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur de d\u00e9penses \u00e9nerg\u00e9tiques de la collectivit\u00e9 pour l\u0027\u00e9clairage public\u003c/p\u003e\n\u003cp\u003eL\u0027indicateur mesure les d\u00e9penses d\u2019\u00e9nergie pay\u00e9es directement par la collectivit\u00e9, c\u2019est-\u00e0-dire celles pay\u00e9es par la collectivit\u00e9 aux fournisseurs et aux exploitants (uniquement le poste combustibles P1 dans ce dernier cas)  pour l\u0027\u00e9clairage public\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-14a',
    action_ids: ['citergie__2.2.1', 'citergie__2.2.2'],
    nom: 'Consommation d\u0027\u00e9nergie finale des b\u00e2timents publics (MWh)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure la consommation \u00e9nerg\u00e9tique totale (toute \u00e9nergie, tout usage) du patrimoine b\u00e2ti \u00e0 la charge directe de la commune, en \u00e9nergie finale. Les piscines et patinoires, si elles sont \u00e0 la charge de la collectivit\u00e9 sont prises en compte, mais pas les services publics eau, assainissement, d\u00e9chets, ni l\u0027\u00e9clairage public.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'MWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-14b',
    action_ids: ['citergie__2.2.1', 'citergie__2.2.2'],
    nom: 'Consommation d\u0027\u00e9nergie finale des b\u00e2timents publics (rapport\u00e9 au nb d\u0027habitant, en kWh/hab)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure la consommation \u00e9nerg\u00e9tique totale (toute \u00e9nergie, tout usage) du patrimoine b\u00e2ti \u00e0 la charge directe de la commune, en \u00e9nergie finale, rapport\u00e9e par habitant et compar\u00e9e \u00e0 la valeur moyenne fran\u00e7aise (tir\u00e9e de l\u0027enqu\u00eate ADEME-AITF-EDF-GDF \u0026quot;Energie et patrimoine communal 2012\u0026quot;) selon la taille de la collectivit\u00e9. Les piscines et patinoires, si elles sont \u00e0 la charge de la collectivit\u00e9 sont prises en compte, mais pas les services publics eau, assainissement, d\u00e9chets, ni l\u0027\u00e9clairage public. Pour les EPCI, l\u0027indicateur en kWh/m\u00b2.an est plus pertinent.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'rapport\u00e9 au nb d\u0027habitant, en kWh/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-14c',
    action_ids: ['citergie__2.2.1', 'citergie__2.2.2'],
    nom: 'Consommation d\u0027\u00e9nergie finale des b\u00e2timents publics (rapport\u00e9 \u00e0 la surface du patrimoine, en kWh/m\u00b2)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure la consommation \u00e9nerg\u00e9tique totale (toute \u00e9nergie, tout usage) du patrimoine b\u00e2ti \u00e0 la charge directe de la commune, en \u00e9nergie finale, rapport\u00e9e par rapport \u00e0 la surface. Les piscines et patinoires, si elles sont \u00e0 la charge de la collectivit\u00e9 sont prises en compte, mais pas les services publics eau, assainissement, d\u00e9chets, ni l\u0027\u00e9clairage public.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'rapport\u00e9 \u00e0 la surface du patrimoine, en kWh/m\u00b2',
  }),

  new IndicateurReferentiel({
    id: 'cae-15a',
    action_ids: ['citergie__2.2.1', 'citergie__2.2.2'],
    nom: 'Part de b\u00e2timents publics de classe F ou G selon le DPE pour l\u0027\u00e9nergie (ou \u00e9quivalent)',
    description:
      '\u003cp\u003eEn France m\u00e9tropolitaine, l\u0027indicateur mesure la part (en surface -\u00e0 d\u00e9faut en nombre) de b\u00e2timents, soumis ou non \u00e0 l\u0027obligation de r\u00e9alisation du DPE,  dont la collectivit\u00e9 est propri\u00e9taire (ou mis \u00e0 disposition avec transferts des droits patrimoniaux) compris dans les classes F et G selon le DPE pour l\u0027\u00e9nergie. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les b\u00e2timents qui doivent garantir des conditions de temp\u00e9ratures, d\u0027hygrom\u00e9trie ou de qualit\u00e9 de l\u0027air n\u00e9cessitant des r\u00e8gles particuli\u00e8res (notamment piscines et patinoires) ou destin\u00e9s \u00e0 rester ouverts sur l\u0027ext\u00e9rieur.\u00a0Les classes de performance et les modalit\u00e9s de calcul sont celles du Diagnostic de Performance Energ\u00e9tique, telles qu\u0027elles sont d\u00e9finies dans l\u0027arr\u00eat\u00e9 du 7 d\u00e9cembre 2007 relatif \u00e0 l\u0027affichage du DPE dans les b\u00e2timents publics en France m\u00e9tropolitaine (\u00e9nergie primaire et distinction de 3 cat\u00e9gories de b\u00e2timents). Toute d\u00e9marche \u00e9quivalente pourra \u00eatre prise en compte. L\u0027indicateur permet de mesurer l\u0027effort de la collectivit\u00e9 pour la r\u00e9novation de ces b\u00e2timents les plus \u00e9metteurs. L\u0027objectif est de ne plus avoir de patrimoine dans ces classes (valeur limite : 10%).\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'ou \u00e9quivalent',
  }),

  new IndicateurReferentiel({
    id: 'cae-15a_dom',
    action_ids: ['citergie__2.2.1', 'citergie__2.2.2'],
    nom: 'Part de b\u00e2timents \u003e=701 kWhep/m\u00b2.an (calcul DPE ou \u00e9quivalent) (DOM)',
    description:
      '\u003cp\u003eDans les DOM, l\u0027indicateur mesure la part (en surface -\u00e0 d\u00e9faut en nombre) de b\u00e2timents dont la collectivit\u00e9 est propri\u00e9taire  (ou mis \u00e0 disposition avec transfert des droits patrimoniaux) dont la consommation d\u0027\u00e9nergie primaire est sup\u00e9rieure ou \u00e9gale \u00e0 701 kWhep/m\u00b2. Les modalit\u00e9s de calcul sont celles du Diagnostic de Performance Energ\u00e9tique s\u0027il existe dans le DOM concern\u00e9 ou toute d\u00e9marche \u00e9quivalente. Les piscines/patinoires sont exclues.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'calcul DPE ou \u00e9quivalent',
  }),

  new IndicateurReferentiel({
    id: 'cae-15b',
    action_ids: ['citergie__2.2.1', 'citergie__2.2.2'],
    nom: 'Part de b\u00e2timents publics de classe A ou B selon le DPE pour l\u0027\u00e9nergie (ou \u00e9quivalent)',
    description:
      '\u003cp\u003eEn France m\u00e9tropolitaire, l\u0027indicateur mesure la part (en surface -\u00e0 d\u00e9faut en nombre) de b\u00e2timents, soumis ou non \u00e0 l\u0027obligation de r\u00e9alisation du DPE,  dont la collectivit\u00e9 est propri\u00e9taire (ou mis \u00e0 disposition avec transferts des droits patrimoniaux) compris dans les classes A et B selon le DPE pour l\u0027\u00e9nergie. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les b\u00e2timents qui doivent garantir des conditions de temp\u00e9ratures, d\u0027hygrom\u00e9trie ou de qualit\u00e9 de l\u0027air n\u00e9cessitant des r\u00e8gles particuli\u00e8res (notamment piscines et patinoires) ou destin\u00e9s \u00e0 rester ouverts sur l\u0027ext\u00e9rieur.\u00a0Les classes de performance et les modalit\u00e9s de calcul sont celles du Diagnostic de Performance Energ\u00e9tique, telles qu\u0027elles sont d\u00e9finies dans l\u0027arr\u00eat\u00e9 du 7 d\u00e9cembre 2007 relatif \u00e0 l\u0027affichage du DPE dans les b\u00e2timents publics en France m\u00e9tropolitaine (\u00e9nergie primaire et distinction de 3 cat\u00e9gories de b\u00e2timents). Toute d\u00e9marche \u00e9quivalente pourra \u00eatre prise en compte. La cible est d\u0027atteindre 30% du parc dans les classes A et B (mais valorisation progressive \u00e0 partir de 0%).\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'ou \u00e9quivalent',
  }),

  new IndicateurReferentiel({
    id: 'cae-15b_dom',
    action_ids: ['citergie__2.2.1', 'citergie__2.2.2'],
    nom: 'Part de b\u00e2timents =\u003c100 kWhep/m\u00b2.an (calcul DPE ou \u00e9quivalent) (DOM)',
    description:
      '\u003cp\u003eDans les DOM, l\u0027indicateur mesure la part (en surface -\u00e0 d\u00e9faut en nombre) de b\u00e2timents dont la collectivit\u00e9 est propri\u00e9taire  (ou mis \u00e0 disposition avec transfert des droits patrimoniaux) dont la consommation d\u0027\u00e9nergie primaire est inf\u00e9rieure ou \u00e9gale \u00e0 100 kWhep/m\u00b2. Les modalit\u00e9s de calcul sont celles du Diagnostic de Performance Energ\u00e9tique s\u0027il existe dans le DOM concern\u00e9 ou toute d\u00e9marche \u00e9quivalente. Les piscines/patinoires sont exclues.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'calcul DPE ou \u00e9quivalent',
  }),

  new IndicateurReferentiel({
    id: 'cae-16a',
    action_ids: ['citergie__2.2.3'],
    nom: 'Consommation de chaleur/rafraichissement renouvelable et de r\u00e9cup\u00e9ration - patrimoine collectivit\u00e9   (MWh)',
    description:
      '\u003cp\u003ePour les b\u00e2timents et \u00e9quipements publics, l\u0027indicateur mesure  la consommation de chaleur/rafraichissement issue d\u2019energie renouvelable et de r\u00e9cup\u00e9ration. Le patrimoine en DSP est inclus si possible ainsi que les services publics eau/assainissement/d\u00e9chets lorsqu\u0027ils sont de la comp\u00e9tence de la collectivit\u00e9.\u003c/p\u003e\n\u003cp\u003ePour les collectivit\u00e9s comp\u00e9tentes, la r\u00e9cup\u00e9ration de chaleur des UIOM ainsi que sur les eaux us\u00e9es/\u00e9pur\u00e9es peut ainsi \u00eatre prise en compte pour la part autoconsomm\u00e9e sur place (b\u00e2timents de la collectivit\u00e9 et process). Les pompes \u00e0 chaleur prise en compte sont les pompes \u00e0 chaleur eau/eau, sol/eau, sol/sol avec une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 126 % (PAC basse temp\u00e9rature) et une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 111 % (PAC moyenne ou haute temp\u00e9rature).\u003c/p\u003e\n\u003cp\u003ePour les b\u00e2timents publics desservis par des r\u00e9seaux de chaleur, le taux d\u2019EnR\u0026amp;R du r\u00e9seau est d\u00e9fini r\u00e9glementairement et s\u2019appr\u00e9cie au regard du bulletin officiel des imp\u00f4ts vis-a-vis de la TVA r\u00e9duite (BOI-TVA-LIQ-30 chapitre 2.140). La co-g\u00e9n\u00e9ration fossile n\u2019est pas prise en compte.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'MWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-16b',
    action_ids: ['citergie__2.2.3'],
    nom: 'Taux de couverture par les \u00e9nergies renouvelables et de r\u00e9cup\u00e9ration des besoins en chaleur et rafraichissement - patrimoine collectivit\u00e9 (%)',
    description:
      '\u003cp\u003eD\u00e9clinaison de l\u0027indicateur 16a:\u003c/p\u003e\n\u003cp\u003eConsommation de chaleur/rafraichissement renouvelable et de r\u00e9cup\u00e9ration - patrimoine collectivit\u00e9   (MWh)\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003ePour les b\u00e2timents et \u00e9quipements publics, l\u0027indicateur mesure le rapport de la consommation de chaleur/rafraichissement issue d\u2019energie renouvelable et de r\u00e9cup\u00e9ration sur la consommation totale d\u0027\u00e9nergie pour les usages thermiques (chauffage, eau chaude sanitaire, climatisation-rafraichissement) en \u00e9nergie finale. Le patrimoine en DSP est inclus si possible. Les consommations thermiques des services publics eau/assainissement/d\u00e9chets sont prises en compte lorsqu\u0027ils sont de la comp\u00e9tence de la collectivit\u00e9. Pour les collectivit\u00e9s comp\u00e9tentes, la r\u00e9cup\u00e9ration de chaleur des UIOM ainsi que sur les eaux us\u00e9es/\u00e9pur\u00e9es peut ainsi \u00eatre prise en compte pour la part autoconsomm\u00e9e sur place (b\u00e2timents de la collectivit\u00e9 et process).\u003c/li\u003e\n\u003c/ul\u003e\n\u003cp\u003eLes pompes \u00e0 chaleur prise en compte sont les pompes \u00e0 chaleur eau/eau, sol/eau, sol/sol  avec une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 126 % (PAC basse temp\u00e9rature) et une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 111 % (PAC moyenne ou haute temp\u00e9rature).\u003c/p\u003e\n\u003cp\u003ePour les b\u00e2timents publics desservis par des r\u00e9seaux de chaleur, le taux d\u2019EnR\u0026amp;R du r\u00e9seau est d\u00e9fini r\u00e9glementairement et s\u2019appr\u00e9cie au regard du bulletin officiel des imp\u00f4ts vis-a-vis de la TVA r\u00e9duite (BOI-TVA-LIQ-30 chapitre 2.140). La co-g\u00e9n\u00e9ration fossile n\u2019est pas prise en compte.\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-17a',
    action_ids: ['citergie__2.2.4'],
    nom: 'Production d\u0027\u00e9lectricit\u00e9 renouvelable - patrimoine collectivit\u00e9 (MWh)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure la production d\u0027\u00e9lectricit\u00e9 d\u0027origine renouvelable (installations financ\u00e9es en totalit\u00e9 ou en majorit\u00e9 par la collectivit\u00e9 et de sa comp\u00e9tence : \u00e9olien, photovolta\u00efque, hydraulique, mar\u00e9motrice, g\u00e9othermie haute temp\u00e9rature, \u00e9lectricit\u00e9 issue de l\u0027incin\u00e9ration des d\u00e9chets \u00e0 hauteur de 50%, cog\u00e9n\u00e9ration biomasse/biogaz...).\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'MWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-17b',
    action_ids: ['citergie__2.2.4'],
    nom: 'Taux de production d\u0027\u00e9lectricit\u00e9 renouvelable  - patrimoine collectivit\u00e9 (%)',
    description:
      '\u003cp\u003eD\u00e9clinaison de l\u0027indicateur 17a:\u003c/p\u003e\n\u003cp\u003eProduction d\u0027\u00e9lectricit\u00e9 renouvelable - patrimoine collectivit\u00e9 (MWh)\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eL\u0027indicateur mesure le rapport de la production d\u0027\u00e9lectricit\u00e9 d\u0027origine renouvelable (installations financ\u00e9es en totalit\u00e9 ou en majorit\u00e9 par la collectivit\u00e9 et de sa comp\u00e9tence : \u00e9olien, photovolta\u00efque, hydraulique, mar\u00e9motrice, g\u00e9othermie haute temp\u00e9rature, \u00e9lectricit\u00e9 issue de l\u0027incin\u00e9ration des d\u00e9chets \u00e0 hauteur de 50%, cog\u00e9n\u00e9ration biomasse/biogaz...) sur la consommation totale d\u0027\u00e9lectricit\u00e9 des b\u00e2timents et \u00e9quipements communaux (y compris l\u0027\u00e9clairage public et les services industriels de la comp\u00e9tence de la collectivit\u00e9) en \u00e9nergie finale. Le patrimoine en DSP est inclus si possible.\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'batiments',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-18',
    action_ids: ['citergie__2.2.4'],
    nom: 'Part des achats d\u2019\u00e9lectricit\u00e9 renouvelable de la collectivit\u00e9 (%)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le rapport entre les achats d\u0027\u00e9lectricit\u00e9 renouvelable et le montant total des achats d\u0027\u00e9lectricit\u00e9 de la collectivit\u00e9 pour les b\u00e2timents et \u00e9quipements de la collectivit\u00e9 (y compris services publics eaux, assainissement, d\u00e9chets et \u00e9clairage public s\u2019ils sont de la comp\u00e9tence de la collectivit\u00e9) (en kWh ou MWh). La cible est de 100%\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-19a_hors_dom',
    action_ids: ['citergie__2.2.5'],
    nom: 'Part de b\u00e2timents de classe F ou G selon le DPE pour les GES (ou \u00e9quivalent) (hors DOM)',
    description:
      '\u003cp\u003eEn France m\u00e9tropolitaine, l\u0027indicateur mesure la part (en surface -\u00e0 d\u00e9faut en nombre) de b\u00e2timents, soumis ou non \u00e0 l\u0027obligation de r\u00e9alisation du DPE,  dont la collectivit\u00e9 est propri\u00e9taire (ou mis \u00e0 disposition avec transferts des droits patrimoniaux) compris dans les classes F et G selon le DPE pour les GES. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les b\u00e2timents qui doivent garantir des conditions de temp\u00e9ratures, d\u0027hygrom\u00e9trie ou de qualit\u00e9 de l\u0027air n\u00e9cessitant des r\u00e8gles particuli\u00e8res (notamment piscines et patinoires) ou destin\u00e9s \u00e0 rester ouverts sur l\u0027ext\u00e9rieur.\u00a0Les classes de performance et les modalit\u00e9s de calcul sont celles du Diagnostic de Performance Energ\u00e9tique, telles qu\u0027elles sont d\u00e9finies dans l\u0027arr\u00eat\u00e9 du 7 d\u00e9cembre 2007 relatif \u00e0 l\u0027affichage du DPE dans les b\u00e2timents publics en France m\u00e9tropolitaine (\u00e9nergie primaire et distinction de 3 cat\u00e9gories de b\u00e2timents). Toute d\u00e9marche \u00e9quivalente pourra \u00eatre prise en compte. L\u0027indicateur permet de mesurer l\u0027effort de la collectivit\u00e9 pour la r\u00e9novation de ces b\u00e2timents les plus \u00e9metteurs. L\u0027objectif est de ne plus avoir de patrimoine dans ces classes (valeur limite : 10%).\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'ou \u00e9quivalent',
  }),

  new IndicateurReferentiel({
    id: 'cae-19b_hors_dom',
    action_ids: ['citergie__2.2.5'],
    nom: 'Part de b\u00e2timents de classe A ou B selon le DPE pour les GES (ou \u00e9quivalent)  (hors DOM)',
    description:
      '\u003cp\u003eEn France m\u00e9tropolitaine, l\u0027indicateur mesure la part (en surface -\u00e0 d\u00e9faut en nombre) de b\u00e2timents, soumis ou non \u00e0 l\u0027obligation de r\u00e9alisation du DPE, dont la collectivit\u00e9 est propri\u00e9taire (ou mis \u00e0 disposition avec transferts des droits patrimoniaux) compris dans les classes A et B selon le DPE pour les GES. Le patrimoine en DSP est inclus si possible.  Sont exclus de cet indicateur les b\u00e2timents qui doivent garantir des conditions de temp\u00e9ratures, d\u0027hygrom\u00e9trie ou de qualit\u00e9 de l\u0027air n\u00e9cessitant des r\u00e8gles particuli\u00e8res (notamment piscines et patinoires) ou destin\u00e9s \u00e0 rester ouverts sur l\u0027ext\u00e9rieur.\u00a0Les classes de performance et les modalit\u00e9s de calcul sont celles du Diagnostic de Performance Energ\u00e9tique, telles qu\u0027elles sont d\u00e9finies dans l\u0027arr\u00eat\u00e9 du 7 d\u00e9cembre 2007 relatif \u00e0 l\u0027affichage du DPE dans les b\u00e2timents publics en France m\u00e9tropolitaine (\u00e9nergie primaire et distinction de 3 cat\u00e9gories de b\u00e2timents). Toute d\u00e9marche \u00e9quivalente pourra \u00eatre prise en compte. La cible est d\u0027atteindre 30% du parc dans les classes A et B (mais valorisation progressive \u00e0 partir de 0%).\u003c/p\u003e\n',
    thematique_id: 'batiments',
    unite: 'ou \u00e9quivalent',
  }),

  new IndicateurReferentiel({
    id: 'cae-20',
    action_ids: ['citergie__2.3.1'],
    nom: 'Consommation de l\u2019\u00e9clairage public  (kWh/hab.an)',
    description:
      '\u003cp\u003eL\u2019indicateur est en \u00e9nergie finale et inclut les consommations pour la signalisation et l\u2019\u00e9clairage du mobilier urbain (ex\u00a0: abri-bus). La valeur limite est inspir\u00e9e (valeur moyenne arrondie) de l\u2019enqu\u00eate ADEME-AITF-EDF-GDF \u00ab\u00a0Energie et patrimoine communal 2012\u00a0\u00bb, en \u00e9nergie finale. La valeur cible correspond aux meilleures scores obtenues par des collectivit\u00e9s Cit\u2019ergie.\u003c/p\u003e\n\u003cp\u003ePour les EPCI, l\u2019indicateur n\u2019est renseign\u00e9 que si la comp\u00e9tence a \u00e9t\u00e9 transf\u00e9r\u00e9e totalement (pas uniquement sur les zones communautaires).\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite : 90 kWh/hab (\u00e9nergie finale, d\u0027apr\u00e8s donn\u00e9es enqu\u00eate AITF 2012, pour les villes moyennes)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible : 60 kWh/hab\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: 'kWh/hab.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-21a',
    action_ids: ['citergie__2.3.2'],
    nom: 'Consommation moyenne d\u0027eau dans les b\u00e2timents de la collectivit\u00e9 (l/m\u00b2.an)',
    description:
      '\u003cp\u003eL\u0027objectif est de mesurer l\u0027impact des mesures de limitation des consommations d\u0027eau au fil des ans dans les b\u00e2timents de la collectivit\u00e9s (hors piscine).\u003c/p\u003e\n\u003cp\u003eDes valeurs moyennes comparatives pour 3 cat\u00e9gories de b\u00e2timents (dans la cat\u00e9gorie \u0026quot;culture/sport\u0026quot;, les piscines ne sont pas compt\u00e9es) sont propos\u00e9es pour aider le conseiller \u00e0 situer la collectivit\u00e9 (regroupement effectu\u00e9 \u00e0 partir de valeurs recueillies via Display, 2012).\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: 'l/m\u00b2.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-21b',
    action_ids: ['citergie__2.3.2'],
    nom: 'Consommation moyenne d\u0027eau dans les b\u00e2timents "enseignement/cr\u00e8che" (l/m\u00b2.an)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 21a:\u003c/p\u003e\n\u003cp\u003eConsommation moyenne d\u0027eau dans les b\u00e2timents de la collectivit\u00e9 (l/m\u00b2.an).\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: 'l/m\u00b2.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-21c',
    action_ids: ['citergie__2.3.2'],
    nom: 'Consommation moyenne d\u0027eau dans les b\u00e2timents "administration" (l/m\u00b2.an)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 21a:\u003c/p\u003e\n\u003cp\u003eConsommation moyenne d\u0027eau dans les b\u00e2timents de la collectivit\u00e9 (l/m\u00b2.an).\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: 'l/m\u00b2.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-21d',
    action_ids: ['citergie__2.3.2'],
    nom: 'Consommation moyenne d\u0027eau dans les b\u00e2timents"culture/sport" (l/m\u00b2.an)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 21a:\u003c/p\u003e\n\u003cp\u003eConsommation moyenne d\u0027eau dans les b\u00e2timents de la collectivit\u00e9 (l/m\u00b2.an).\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: 'l/m\u00b2.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-22',
    action_ids: ['citergie__3.2.2'],
    nom: 'Taux d\u0027\u00e9nergie renouvelable et de r\u00e9cup\u00e9ration (ENR\u0026R) des r\u00e9seaux de chaleur sur le territoire (en %)',
    description:
      '\u003cp\u003eIl s\u0027agit de mesurer la part d\u0027\u00e9nergie renouvelable et de r\u00e9cup\u00e9ration (ENR\u0026amp;R) du r\u00e9seau de chaleur de la collectivit\u00e9. La m\u00e9thodologie de calcul doit \u00eatre conforme \u00e0 celle \u00e9labor\u00e9e par le SNCU, reprise r\u00e9glementairement dans le cadre de l\u0027instruction fiscale ou le classement du r\u00e9seau de chaleur. En pr\u00e9sence de plusieurs r\u00e9seaux de chaleur, une moyenne doit \u00eatre r\u00e9alis\u00e9e. La valeur cible est fix\u00e9e \u00e0 75%.\u003c/p\u003e\n',
    thematique_id: 'energie',
    unite: 'ENR\u0026R',
  }),

  new IndicateurReferentiel({
    id: 'cae-23',
    action_ids: ['citergie__3.2.2'],
    nom: 'Taux de couverture des besoins de chaleur du territoire (r\u00e9sidentiel et tertiaire) par les r\u00e9seaux de chaleur ENR\u0026R (en %)',
    description:
      '\u003cp\u003eCet indicateur est le ratio entre la consommation d\u0027\u00e9nergie pour le chauffage assur\u00e9e par le(s) r\u00e9seau(x) de chaleur ENR\u0026amp;R et la consommation totale d\u0027\u00e9nergie pour le chauffage du territoire (pour le r\u00e9sidentiel et le tertiaire, donc hors industrie).\u003c/p\u003e\n\u003cp\u003eLa valeur limite (10%) est bas\u00e9e sur le taux moyen de couverture des besoins de chaleur par les r\u00e9seaux de chaleur en Europe (source : AMORCE).\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eATTENTION: Les r\u00e9seaux de chaleur 100% fossiles ne sont pas pris en compte ici.\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: 'r\u00e9sidentiel et tertiaire',
  }),

  new IndicateurReferentiel({
    id: 'cae-24a',
    action_ids: ['citergie__3.2.2'],
    nom: 'Production de chaleur/froid renouvelable  (MWh)',
    description:
      '\u003cp\u003eCet indicateur mesure la production de chaleur et de rafraichissement  renouvelable sur le territoire (initiative publique et priv\u00e9e). Les \u00e9nergies renouvelables prise en compte sont celles cit\u00e9es selon les fili\u00e8res cit\u00e9es dans le D\u00e9cret n\u00b0 2016-849 du 28 juin 2016  relatif au plan climat-air-\u00e9nergie territorial :  biomasse  solide,  pompes  \u00e0  chaleur,  g\u00e9othermie,  solaire  thermique,  biogaz.\u003c/p\u003e\n\u003cp\u003ePar convention, 50% de la chaleur produite par l\u2019incin\u00e9ration des d\u00e9chets est consid\u00e9r\u00e9e issue de d\u00e9chets urbains renouvelables (source DGEC, dans ses bilans). Les pompes \u00e0 chaleur prise en compte sont les pompes \u00e0 chaleur eau/eau, sol/eau, sol/sol  avec une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 126 % (PAC basse temp\u00e9rature) et une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 111 % (PAC moyenne ou haute temp\u00e9rature) (exigences du cr\u00e9dit d\u2019imp\u00f4t pour la transition \u00e9nerg\u00e9tique 2018).\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eATTENTION: La cog\u00e9n\u00e9ration \u00e0 partir d\u0027\u00e9nergie fossile n\u0027est pas prise en compte.\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: 'MWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-24b',
    action_ids: ['citergie__3.2.2'],
    nom: 'Taux de production d\u0027\u00e9nergie renouvelable pour la chaleur et le rafra\u00eechissement sur le territoire (en %)',
    description:
      '\u003cp\u003eCet indicateur mesure la production de chaleur et de rafraichissement  renouvelable sur le territoire (initiative publique et priv\u00e9e), divis\u00e9e par les consommations totales de chaleur et de froid du territoire (en \u00e9nergie finale). Les \u00e9nergies renouvelables prise en compte sont celles cit\u00e9es selon les fili\u00e8res cit\u00e9es dans le D\u00e9cret n\u00b0 2016-849 du 28 juin 2016  relatif au plan climat-air-\u00e9nergie territorial :  biomasse  solide,  pompes  \u00e0  chaleur,  g\u00e9othermie,  solaire  thermique,  biogaz. Par convention, 50% de la chaleur produite par l\u2019incin\u00e9ration des d\u00e9chets est consid\u00e9r\u00e9e issue de d\u00e9chets urbains renouvelables (source DGEC, dans ses bilans). Les pompes \u00e0 chaleur prise en compte sont les pompes \u00e0 chaleur eau/eau, sol/eau, sol/sol  avec une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 126 % (PAC basse temp\u00e9rature) et une efficacit\u00e9 \u00e9nerg\u00e9tique \u2265 111 % (PAC moyenne ou haute temp\u00e9rature) (exigences du cr\u00e9dit d\u2019imp\u00f4t pour la transition \u00e9nerg\u00e9tique 2018). La cog\u00e9n\u00e9ration \u00e0 partir d\u0027\u00e9nergie fossile n\u0027est pas prise en compte.\u003c/p\u003e\n\u003cp\u003ePour conna\u00eetre cet indicateur, la collectivit\u00e9 doit avoir effectu\u00e9 un bilan de ses consommations et production d\u0027ENR tel que d\u00e9crit \u00e0 l\u0027action 1.1.2:\u003c/p\u003e\n\u003cp\u003eR\u00e9aliser le diagnostic Climat-Air-Energie du territoire\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cul\u003e\n\u003cli\u003eValeur cible : 38% en M\u00e9tropole, 75% dans les DOM\u003c/li\u003e\n\u003c/ul\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: 'en %',
  }),

  new IndicateurReferentiel({
    id: 'cae-25a',
    action_ids: ['citergie__3.2.3'],
    nom: 'Production d\u0027\u00e9lectricit\u00e9 renouvelable  (MWh)',
    description:
      '\u003cp\u003eCet indicateur mesure la production d\u0027\u00e9lectricit\u00e9 renouvelable sur le territoire (initiative publique et priv\u00e9e). Les \u00e9nergies renouvelables prise en compte sont celles cit\u00e9es selon les fili\u00e8res cit\u00e9es dans le D\u00e9cret n\u00b0 2016-849 du 28 juin 2016  relatif au plan climat-air-\u00e9nergie territorial :  \u00e9olien terrestre, solaire PV, solaire thermodynamique, hydraulique, biomasse solide, biogaz, g\u00e9othermie.\u003c/p\u003e\n',
    thematique_id: 'energie',
    unite: 'MWh',
  }),

  new IndicateurReferentiel({
    id: 'cae-25b',
    action_ids: ['citergie__3.2.3'],
    nom: 'Taux de production d\u0027\u00e9lectricit\u00e9 renouvelable sur le territoire (%)',
    description:
      '\u003cp\u003eCet indicateur mesure la production d\u0027\u00e9lectricit\u00e9 renouvelable sur le territoire, par la collectivit\u00e9, ses partenaires et les particuliers, rapport\u00e9 \u00e0 la consommation totale d\u0027\u00e9lectricit\u00e9 du territoire (\u00e9nergie finale). Les \u00e9nergies renouvelables consid\u00e9r\u00e9es sont celles cit\u00e9es dans le d\u00e9cret D\u00e9cret n\u00b0 2016-849 du 28 juin 2016  relatif au plan climat-air-\u00e9nergie territorial  (\u00e9olien  terrestre,  solaire  photovolta\u00efque,  solaire  thermodynamique,  hydraulique,  biomasse  solide, biogaz,  g\u00e9othermie). L\u0027\u00e9lectricit\u00e9 produite par cog\u00e9n\u00e9ration via incin\u00e9ration des d\u00e9chets en m\u00e9lange compte pour 50% comme une \u00e9nergie renouvelable (biomasse solide). La cog\u00e9n\u00e9ration \u00e0 partir d\u0027\u00e9nergie fossile n\u0027est pas prise en compte.\u003c/p\u003e\n\u003cp\u003eLa collectivit\u00e9 doit avoir effectu\u00e9 un bilan de ses consommations et productions d\u0027ENR tel que d\u00e9crit \u00e0 l\u0027action 1.1.2:\u003c/p\u003e\n\u003cp\u003eR\u00e9aliser le diagnostic Climat-Air-Energie du territoire\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cul\u003e\n\u003cli\u003eValeur cible pour les territoires sans potentiel \u00e9olien et hydraulique : 16%\u003c/li\u003e\n\u003c/ul\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible pour les territoires \u00e0 fort potentiel : 40%\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible pour les DOM : 75%\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-26',
    action_ids: ['citergie__3.2.3'],
    nom: 'Puissance photovolta\u00efque install\u00e9e sur le territoire (Wc/hab)',
    description:
      '\u003cp\u003eL\u0027installation de panneaux solaires photovolta\u00efques est possible dans toutes les collectivit\u00e9s. Un indicateur en puissance install\u00e9e plut\u00f4t qu\u0027en production permet de ne pas prendre en compte les diff\u00e9rences d\u0027ensoleillement des territoires. Les valeurs cibles sont \u00e9tablies \u00e0 partir des donn\u00e9es collect\u00e9es dans le cadre des d\u00e9marches Cit\u0027ergie.\u003c/p\u003e\n\u003cp\u003eLes valeurs cibles sont les suivantes\u00a0:\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003epour les collectivit\u00e9s \u0026gt; 100 000 habitants : 20 Wc/hab (M\u00e9tropole) / 60 Wc/hab (DOM-ROM)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003epour les collectivit\u00e9s \u0026gt; 50 000 habitants : 40 Wc/hab (M\u00e9tropole) - 120 Wc/hab (DOM-ROM)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003epour les collectivit\u00e9s \u0026lt; 50 000 habitants : 60 Wc/hab (M\u00e9tropole) - 180 Wc/hab (DOM-ROM)\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: 'Wc/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-27',
    action_ids: ['citergie__3.2.3'],
    nom: 'Mix \u00e9nerg\u00e9tique propos\u00e9 par les r\u00e9gies et SEM fournisseur d\u0027\u00e9lectricit\u00e9 (%)',
    description:
      '\u003cp\u003eLes SEM et r\u00e9gies peuvent, en plus de leur propre production d\u2019\u00e9nergies renouvelables, acheter de l\u0027\u00e9lectricit\u00e9 renouvelable ou verte (labellis\u00e9e) pour compl\u00e9ter leur offre. Les objectifs fix\u00e9s (production et achat) sont bas\u00e9s sur les objectifs 2030 de la loi de transition \u00e9nerg\u00e9tique.\u003c/p\u003e\n\u003cp\u003eValeur cible\u202f:\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003e40% (M\u00e9tropole)  ;\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003e100% (DOM)\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'energie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-28a',
    action_ids: ['citergie__3.3.1'],
    nom: 'Consommation \u00e9nerg\u00e9tique du syst\u00e8me d\u0027alimentation en eau potable (captage/traitement/distribution) en kWh/hab',
    description:
      '\u003cp\u003eLe syst\u00e8me d\u0027alimentation en eau potable est tr\u00e8s d\u00e9pendant de l\u0027\u00e9tat de la ressource en eau sur le territoire. L\u0027\u00e9valuation des effets se fait donc de mani\u00e8re relative, sur plusieurs ann\u00e9es, en \u00e9tant vigilant sur les conditions climatiques de l\u0027ann\u00e9e \u00e9tudi\u00e9e. L\u0027indicateur peut \u00eatre en kWh/hab.\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: 'captage/traitement/distribution',
  }),

  new IndicateurReferentiel({
    id: 'cae-28b',
    action_ids: ['citergie__3.3.1'],
    nom: 'Rendement du syst\u00e8me d\u0027alimentation en eau potable (captage/traitement/distribution) en m3 brut/m3 vendu',
    description:
      '\u003cp\u003eLe syst\u00e8me d\u0027alimentation en eau potable est tr\u00e8s d\u00e9pendant de l\u0027\u00e9tat de la ressource en eau sur le territoire. L\u0027\u00e9valuation des effets se fait donc de mani\u00e8re relative, sur plusieurs ann\u00e9es, en \u00e9tant vigilant sur les conditions climatiques de l\u0027ann\u00e9e \u00e9tudi\u00e9e. L\u0027indicateur est en m3 brut/m3 vendu pour mesurer les pertes (la cible \u00e9tant dans ce cas de se rapprocher de 1).\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: 'captage/traitement/distribution',
  }),

  new IndicateurReferentiel({
    id: 'cae-29',
    action_ids: ['citergie__3.3.2'],
    nom: 'Consommation \u00e9nerg\u00e9tique des STEP kWh/kgDBO5 \u00e9limin\u00e9',
    description:
      '\u003cp\u003eL\u0027indicateur de consommation \u00e9nerg\u00e9tique des STEP (station d\u0027\u00e9puration) s\u0027exprime en kWh/kg de DBO5 (demande biologique en oxyg\u00e8ne mesur\u00e9 \u00e0 5 jours) \u00e9limin\u00e9s, plus fiables que les indicateurs en kWh/m3 d\u0027eau trait\u00e9. La composition des eaux entrantes influe en effet sur les consommations \u00e9nerg\u00e9tiques de la station sans pour autant refl\u00e9ter ses performances. Le privil\u00e8ge est donc donn\u00e9 \u00e0 cet indicateur, qui se situe habituellement se situe, selon la fili\u00e8re, autour des valeurs suivantes : BA (boues activ\u00e9es) entre 2 et 4, SBR (r\u00e9acteur biologique s\u00e9quenc\u00e9) autour de 4 et BRM (bior\u00e9acteur \u00e0 membranes) autour de 5 (dires d\u0027experts). L\u0027\u00e9nergie est mesur\u00e9e en \u00e9nergie finale. Dans le cas d\u0027une moyenne entre plusieurs STEP, pond\u00e9rer selon les \u00e9quivalents habitants.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite : BA 4, SBR 5, BRM 7\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible : BA 2, SBR 3, BRM 4\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'eau',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-30',
    action_ids: ['citergie__3.3.4'],
    nom: 'Quantit\u00e9 annuelle d\u0027engrais/m2 d\u0027espaces verts',
    description:
      '\u003cp\u003eL\u0027objectif est de mesurer les efforts de la collectivit\u00e9 en mati\u00e8re de limitation des engrais sur ses espaces verts. La quantit\u00e9 annuelle d\u0027engrais apport\u00e9e est divis\u00e9e par la surface d\u0027espaces verts g\u00e9r\u00e9s par la collectivit\u00e9. L\u0027unit\u00e9 de l\u0027indicateur est fix\u00e9 selon les possibilit\u00e9s de la collectivit\u00e9 et les produits employ\u00e9s : unit\u00e9 d\u0027azote/m2, kg/m2, litre/m2, euros/m2...\u003c/p\u003e\n',
    thematique_id: 'foret_biodiv',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-31',
    action_ids: ['citergie__3.3.4'],
    nom: 'Quantit\u00e9 annuelle d\u0027eau/m2 d\u0027espaces verts',
    description:
      '\u003cp\u003eL\u0027objectif est de mesurer les efforts de la collectivit\u00e9 en mati\u00e8re de limitation des consommations d\u0027eau pour l\u0027arrosage de ses espaces verts. Le volume annuel d\u0027eau est divis\u00e9 par la surface d\u0027espaces verts g\u00e9r\u00e9s par la collectivit\u00e9. L\u0027unit\u00e9 de l\u0027indicateur est en m3/m2. Les espaces verts sont entendus au sens large, \u00e0 savoir : parcs et jardins, espaces sportifs v\u00e9g\u00e9talis\u00e9s, ronds-points ou accotement enherb\u00e9es de la comp\u00e9tence de la collectivit\u00e9.\u003c/p\u003e\n',
    thematique_id: 'foret_biodiv',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-32',
    action_ids: ['citergie__3.3.5'],
    nom: 'Rendement \u00e9nerg\u00e9tique UIOM en % (valorisation \u00e9nerg\u00e9tique \u00e9lectricit\u00e9 et chaleur)',
    description:
      '\u003cp\u003eLe rendement de l\u0027UIOM (unit\u00e9 d\u0027incin\u00e9ration des ordures m\u00e9nag\u00e8res) est calcul\u00e9 selon la formule permettant la modulation du taux de la TGAP (arr\u00eat\u00e9 du 7 d\u00e9cembre 2016 modifiant l\u0027arr\u00eat\u00e9 du 20 septembre 2002 relatif aux installations d\u0027incin\u00e9ration et de co\u00efncin\u00e9ration de d\u00e9chets non dangereux et aux installations incin\u00e9rant des d\u00e9chets d\u0027activit\u00e9s de soins \u00e0 risques infectieux). Le niveau de performance \u00e9nerg\u00e9tique choisi comme valeur cible est celui utilis\u00e9 \u00e0 l\u0027article 266 nonies du code des douanes pour b\u00e9n\u00e9ficier d\u2019une TGAP r\u00e9duite.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eValeur limite et cible : 65%\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'dechets',
    unite:
      'valorisation \u00e9nerg\u00e9tique \u00e9lectricit\u00e9 et chaleur',
  }),

  new IndicateurReferentiel({
    id: 'cae-33',
    action_ids: ['citergie__3.3.5'],
    nom: 'Energie produite par la valorisation des biod\u00e9chets en kWh/an (\u00e0 d\u00e9faut kg/hab.an de biod\u00e9chets collect\u00e9s de mani\u00e8re s\u00e9parative -m\u00e9thanisation et/ou compostage)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure l\u0027\u00e9lectricit\u00e9 et la chaleur (en kWh) produite \u00e0 partir de biod\u00e9chets pour l\u0027ensemble du territoire (m\u00e9nages et activit\u00e9s \u00e9conomiques, agricoles...). A d\u00e9faut, l\u0027indicateur indique le tonnage des biod\u00e9chets collect\u00e9s de mani\u00e8re s\u00e9parative. Pour information, le ratio moyen de d\u00e9chets alimentaires collect\u00e9s par l\u2019ensemble des collectivit\u00e9s en France en 2015 est de 63 kg/habitant desservi (\u00e9tude suivi technico-\u00e9conomique biod\u00e9chets, Ademe, 2017) :\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003e46 kg/habitant desservi pour la collecte de d\u00e9chets alimentaires seuls;\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003e99 kg/habitant desservi pour la collecte de d\u00e9chets alimentaires et d\u00e9chets verts.\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'dechets',
    unite:
      '\u00e0 d\u00e9faut kg/hab.an de biod\u00e9chets collect\u00e9s de mani\u00e8re s\u00e9parative -m\u00e9thanisation et/ou compostage-',
  }),

  new IndicateurReferentiel({
    id: 'cae-34',
    action_ids: ['citergie__3.3.5'],
    nom: 'Taux de valorisation \u00e9nerg\u00e9tique du biogaz des centres de stockage des d\u00e9chets (en %)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure la part de biogaz valoris\u00e9 par le centre de stockage des d\u00e9chets.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite: 75% (fix\u00e9e par le seuil de valorisation permettant la modulation de la TGAP)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible : 100%\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'dechets',
    unite: 'en %',
  }),

  new IndicateurReferentiel({
    id: 'cae-35',
    action_ids: ['citergie__4.1.1', 'citergie__4.3.1'],
    nom: 'Part modale pi\u00e9ton',
    description:
      '\u003cp\u003eLa part modale est une part modale en nombre de d\u00e9placements.\u003c/p\u003e\n\u003cp\u003eLes valeurs limites et cibles (selon le nombre d\u0027habitants, limite de 15-25%, cible de 25-35%) sont donn\u00e9es \u00e0 titre indicatif pour le conseiller, qui doit \u00e9galement juger de l\u0027\u00e9volution de la part modale au fil du temps et des caract\u00e9ristiques du territoire (ville centre dense favorisant la marche ou territoire \u00e9tendu d\u0027une agglom\u00e9ration...). A d\u00e9faut de poss\u00e9der les parts modales issues d\u0027une enqu\u00eate m\u00e9nages, les collectivit\u00e9s peuvent utiliser les donn\u00e9es INSEE donnant les parts modales des d\u00e9placements domicile-travail pour la population active (tableau NAV2A ou NAV2B).\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-36',
    action_ids: ['citergie__4.1.1', 'citergie__4.3.2'],
    nom: 'Part modale v\u00e9lo',
    description:
      '\u003cp\u003eLa part modale est une part modale en nombre de d\u00e9placements.\u003c/p\u003e\n\u003cp\u003eLes valeurs limites et cibles sont donn\u00e9es \u00e0 titre indicatif pour le conseiller, qui doit \u00e9galement juger de l\u0027\u00e9volution de la part modale au fil du temps et selon le territoire. En France, la moyenne est de 3%, les meilleures collectivit\u00e9s fran\u00e7aises atteignent 10% des d\u00e9placements. En Allemagne les parts modales atteignent 25% dans plusieurs villes. A d\u00e9faut de poss\u00e9der les parts modales issues d\u0027une enqu\u00eate m\u00e9nages, les collectivit\u00e9s peuvent utiliser les donn\u00e9es INSEE donnant les parts modales des d\u00e9placements domicile-travail pour la population active (tableau NAV2A ou NAV2B).\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-37',
    action_ids: ['citergie__4.1.1', 'citergie__4.3.3'],
    nom: 'Part modale TC',
    description:
      '\u003cp\u003eLa part modale est une part modale en nombre de d\u00e9placements.\u003c/p\u003e\n\u003cp\u003eIl s\u2019agit (si possible) des transports en commun en g\u00e9n\u00e9ral : bus urbain, car interurbain, tram, m\u00e9tro, train..., pas uniquement les TCU (transport collectif urbain). La rentabilit\u00e9 \u00e9conomique du syst\u00e8me est prise en compte dans la r\u00e9duction de potentiel. Les valeurs limites et cibles (d\u00e9but de valorisation entre 5 et 10% selon les infrastructures en place, cible \u0026gt;20% -r\u00e9gion parisienne) sont donn\u00e9es \u00e0 titre indicatif pour le conseiller, qui doit \u00e9galement juger de l\u0027\u00e9volution de la part modale au fil du temps et de l\u0027offre TC sur le territoire. A d\u00e9faut de poss\u00e9der les parts modales issues d\u0027une enqu\u00eate m\u00e9nages, les collectivit\u00e9s peuvent utiliser les donn\u00e9es INSEE donnant les parts modales des d\u00e9placements domicile-travail \u00a0pour la population active (tableau NAV2A ou NAV2B).\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-38',
    action_ids: ['citergie__4.1.1', 'citergie__4.3.3', 'citergie__4.3.4'],
    nom: 'Indicateur alternatif \u00e0 la part modale TC (\u00e0 d\u00e9finir par la collectivit\u00e9 et son conseiller le cas \u00e9ch\u00e9ant)',
    description:
      '\u003cp\u003eEn remplacement de l\u0027indicateur sur les parts modales des transports en commun, la collectivit\u00e9 peut mesurer par un autre indicateur la progression d\u0027un moyen de transport alternatif \u00e0 la voiture individuelle, mieux adapt\u00e9 \u00e0 sa situation (milieu rural notamment) : co-voiturage, transport \u00e0 la demande... Il peut \u00e9galement s\u2019agir de la part de d\u00e9placements intermodaux r\u00e9alis\u00e9s par les habitants du territoire, c\u2019est-\u00e0-dire la part de d\u00e9placements m\u00e9canis\u00e9s (tout mode hors marche-a-pied)  compos\u00e9s d\u0027au moins deux trajets effectu\u00e9s \u00e0 l\u2019aide de plusieurs modes m\u00e9canis\u00e9s. Pour obtenir la totalit\u00e9 des points, la valeur collect\u00e9e doit t\u00e9moigner d\u0027une bonne performance de la collectivit\u00e9 par rapport \u00e0 des valeurs de r\u00e9f\u00e9rences nationales ou locales. A pr\u00e9ciser en commentaires.\u003c/p\u003e\n\u003cp\u003eA titre indicatif,  [valeur limite ; valeur cible] pour la part de d\u00e9placements intermodaux:\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003ePour les collectivit\u00e9s \u0026gt; 800 000 hab: [4% ; 12%]\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ePour les collectivit\u00e9s \u0026gt; 300 000 hab :  [2% : 6%]\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ePour les collectivit\u00e9s \u0026gt; 50 000 hab : [0,5% ; 2%]\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ePour les collectivit\u00e9s \u0026lt;50 000 hab : [0,25% ; 1,2%]\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n\u003cp\u003e(source : analyse de rapport d\u2019\u00e9tudes et de recherches sur l\u2019intermodalit\u00e9, CEREMA \u2013 IFSTTAR, 2015 et 2016, tendances observ\u00e9es depuis 1985 dans le cadre des EMD)\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite:
      '\u00e0 d\u00e9finir par la collectivit\u00e9 et son conseiller le cas \u00e9ch\u00e9ant',
  }),

  new IndicateurReferentiel({
    id: 'cae-39',
    action_ids: ['citergie__4.1.1'],
    nom: 'Part de la population active couverte par un PDE/PDA (%)',
    description:
      '\u003cp\u003eL\u0027indicateur comptabilise le nombre d\u0027employ\u00e9s couverts par un Plan de D\u00e9placements Entreprise (PDE) et Administration (PDA) sur le territoire et le rapporte \u00e0 la population active du territoire. Ce chiffre doit \u00eatre en augmentation chaque ann\u00e9e. Des valeurs indicatives limites et cibles sont donn\u00e9es, bas\u00e9es sur des donn\u00e9es ADEME (enqu\u00eate nationale 2009 et Poitou-Charentes 2012) et les meilleurs scores des collectivit\u00e9s Cit\u0027ergie.\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-40a',
    action_ids: ['citergie__4.1.2'],
    nom: 'Consommation annuelle d\u0027\u00e9nergie des v\u00e9hicules (VP) de la collectivit\u00e9 (kWh/an.employ\u00e9)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure la consommation d\u0027\u00e9nergie en kWh (gazole, essence, GPL, GNV, \u00e9lectricit\u00e9, biogaz, agro-carburants...) des v\u00e9hicules de type \u0026quot;v\u00e9hicule particulier\u0026quot; pour le fonctionnement de la collectivit\u00e9, divis\u00e9 par le nombre d\u0027agents et/ou par kilom\u00e8tre effectu\u00e9. Facteurs de conversion simplifi\u00e9s : gazole et essence 10 kWh/L, GPL 7 kWh/L, GNV 11 kWh/m3.\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'VP',
  }),

  new IndicateurReferentiel({
    id: 'cae-40b',
    action_ids: ['citergie__4.1.2'],
    nom: 'Consommation annuelle d\u0027\u00e9nergie des v\u00e9hicules (VP) de la collectivit\u00e9 (kWh/an.km)',
    description:
      '\u003cp\u003ed\u00e9clinaison par kilom\u00e8tre de l\u0027indicateur 40a:\u003c/p\u003e\n\u003cp\u003eConsommation annuelle d\u0027\u00e9nergie des v\u00e9hicules (VP) de la collectivit\u00e9 (kWh/an.employ\u00e9)\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'VP',
  }),

  new IndicateurReferentiel({
    id: 'cae-41',
    action_ids: ['citergie__4.1.2'],
    nom: 'Part modale des d\u00e9placements alternatifs \u00e0 la voiture individuelle pour les d\u00e9placements  domicile-travail des agents de la collectivit\u00e9 (%)',
    description:
      '\u003cp\u003eVia une enqu\u00eate r\u00e9alis\u00e9e aupr\u00e8s des agents, l\u2019indicateur mesure la part modale (en nombre de d\u00e9placements) cumul\u00e9e des d\u00e9placements alternatifs \u00e0 la voiture individuelle (somme des parts modales marche, v\u00e9lo, transport en commun, co-voiturage) dans les d\u00e9placements domicile-travail des agents. L\u2019indicateur est d\u00e9clin\u00e9 si possible \u00e9galement en kilom\u00e8tres parcourus.\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-42',
    action_ids: ['citergie__4.2.1'],
    nom: 'Nombre de places de stationnement public pour les voitures par habitant (nb/hab)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le nombre de places de stationnement public pour les voitures par habitant (stationnements publics gratuit ou payant, sur voirie ou dans des ouvrages, exploit\u00e9 en r\u00e9gie par la collectivit\u00e9 \u2013commune ou EPCI- ou d\u00e9l\u00e9gu\u00e9). Si le p\u00e9rim\u00e8tre suivi est partiel, l\u2019indiquer en commentaire.\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'nb/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-43',
    action_ids: ['citergie__4.3.1', 'citergie__4.2.2'],
    nom: 'Part de voiries \u00ab\u00a0apais\u00e9es\u00a0\u00bb (%)',
    description:
      '\u003cp\u003eL\u2019indicateur mesure la part des voiries o\u00f9 un dispositif r\u00e8glementaire permet l\u2019apaisement de la circulation\u00a0(r\u00e9duction des vitesses en dessous de 50 km/heures ou limitation de la circulation) par rapport au lin\u00e9aire total de voirie de la collectivit\u00e9. Les dispositifs pris en compte sont les zones de rencontre, les zones 30, les aires pi\u00e9tonnes, les zones de circulation restreinte.\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-44',
    action_ids: ['citergie__4.3.2'],
    nom: 'Part de voiries am\u00e9nag\u00e9es pour les cycles (%  Ou \u00e0 d\u00e9faut km/1000hab)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le kilom\u00e9trage de voiries am\u00e9nag\u00e9es (pistes le long de la voirie, bandes cyclables et couloirs bus autoris\u00e9s aux v\u00e9los, les zones 30, les aires pi\u00e9tonnes\u2026) sur le kilom\u00e9trage total de voirie. Les am\u00e9nagements \u00e0 double-sens compte pour 1, les sens unique pour 0,5 ; les am\u00e9nagements hors voirie ne sont pas pris en compte (voies vertes, pistes ne suivant pas le trac\u00e9 de la voirie, all\u00e9es de parcs, ...). A d\u00e9faut, un indicateur en km/1000 habitants pourra \u00eatre utilis\u00e9. Les valeurs de r\u00e9f\u00e9rences sont bas\u00e9es sur un traitement des donn\u00e9es du Club des villes et territoires cyclables, dans le cadre de l\u2019Observatoire des mobilit\u00e9s actives, enqu\u00eate 2015-2016.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeurs limites :  25% ou 1 km/1000 hab (ville) et 20% ou 0,8 km/1000 hab(EPCI)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeurs cibles (objectifs) :  50% ou 2 km/1000 hab  (ville) et 40% ou 1,5 km/1000 hab (EPCI)\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'mobilites',
    unite: '%  Ou \u00e0 d\u00e9faut km/1000hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-45',
    action_ids: ['citergie__4.3.2'],
    nom: 'Nombre de places de stationnement v\u00e9lo, hors pince-roues (nb / 100 habitants)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le nombre de places de stationnement v\u00e9lo pour 100 habitants : arceaux sur l\u2019espace public, consignes ou boxes \u00e0 v\u00e9los, stationnements v\u00e9los en gare, en parking automobiles... Attention, les stationnements de type r\u00e2telier v\u00e9lo ou \u00ab pince-roues \u00bb sur l\u2019espace public, qui ne permettent pas une accroche s\u00e9curitaire, ne sont pas pris en compte.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeurs limites : 2 (commune) et 1 (EPCI)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeurs cibles : 4 (communes) et 2 (EPCI)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eATTENTION: pour les collectivit\u00e9s rurales, se focaliser sur la pr\u00e9sence d\u2019abris et de stationnements propos\u00e9s aux endroits cl\u00e9s (centres bourgs, autour des \u00e9coles et p\u00f4les d\u2019activit\u00e9s, lieux publics de rencontre, commerces, etc).\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'mobilites',
    unite: 'nb / 100 habitants',
  }),

  new IndicateurReferentiel({
    id: 'cae-46',
    action_ids: ['citergie__4.3.3'],
    nom: 'Fr\u00e9quentation des TC (voyages/hab)',
    description:
      '\u003cp\u003eIl s\u0027agit du nombre moyen de voyages en transport en commun effectu\u00e9 chaque ann\u00e9e par un habitant. Source de l\u0027indicateur : L\u0027ann\u00e9e 2007 des transports urbains, GART \u2013 Enqu\u00eate annuelle sur les transports urbains (CERTU-DGITMGART-UTP) sur 192 r\u00e9seaux.\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite : 32 (\u0026lt;100 000 hab) et 64 (\u0026gt;100 000 hab)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible : 114 (\u0026lt;100 000 hab) et 140 (\u0026gt;100 000 hab)\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'mobilites',
    unite: 'voyages/hab',
  }),

  new IndicateurReferentiel({
    id: 'cae-47',
    action_ids: ['citergie__4.3.3'],
    nom: 'Maillage du territoire par le r\u00e9seau TC',
    description:
      '\u003cp\u003eL\u0027indicateur a pour objectif de mesurer le maillage du territoire par les TC : nombre moyen d\u0027arr\u00eats par km du r\u00e9seau de transport en commun, nb arr\u00eats/hab, km de r\u00e9seau/hab ou par ha de territoire, % de population desservie dans un rayon de 300-500 m\u00e8tres... L\u0027indicateur est bas\u00e9 sur une moyenne tous modes de TC confondus.\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-48',
    action_ids: ['citergie__5.1.1'],
    nom: 'Part d\u0027ETP de la collectivit\u00e9 \u00a0d\u00e9di\u00e9 \u00e0 la mise en \u0153uvre de la politique climat air \u00e9nergie ( %)',
    description:
      '\u003cp\u003eL\u2019indicateur mesure le nombre de personnes en \u00e9quivalent temps plein d\u00e9di\u00e9es \u00e0 la mise en \u0153uvre de la politique climat-air-\u00e9nergie. Pour \u00eatre comptabilis\u00e9 \u00e0 100%, l\u2019intitul\u00e9 du poste doit clairement se r\u00e9f\u00e9rer \u00e0 cette politique (e\u00a0: charg\u00e9 de mission \u00e9nergie, plan climat, mobilit\u00e9 douce\u2026)\u00a0; pour des postes mixtes (ex\u00a0: charg\u00e9 de mission b\u00e2timents), le poste ne doit pas \u00eatre compt\u00e9 enti\u00e8rement dans l\u2019indicateur, mais uniquement l\u2019estimation du % des t\u00e2ches en lien avec la politique climat-air-\u00e9nergie. Le personnel externe (prestataires) ne doit pas \u00eatre pris en compte. Pour faciliter la comparaison, le nombre d\u2019ETP est ramen\u00e9 au nombre total d\u0027ETP de la collectivit\u00e9.\u003c/p\u003e\n',
    thematique_id: 'orga_interne',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-49a',
    action_ids: ['citergie__5.2.1'],
    nom: 'Budget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)',
    description:
      '\u003cp\u003eL\u0027indicateur suit et totalise les budgets annuels associ\u00e9s aux actions les plus clairement identifiables de la politique climat-air-\u00e9nergie de la collectivit\u00e9, en fonctionnement et en investissement. L\u0027indicateur doit exister et \u00eatre suivi annuellement pour \u00eatre valoris\u00e9 (pas de valeur limite ou cible). Pour faciliter la comparaison au fil du temps et entre collectivit\u00e9s, le budget est rapport\u00e9 au nombre d\u0027habitant et la d\u00e9composition suivante peut \u00eatre utilis\u00e9e :\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003e\u00e9tudes/expertises concernant la ma\u00eetrise de l\u2019\u00e9nergie et la baisse des \u00e9missions de GES dans les diff\u00e9rents secteurs consommateurs et \u00e9metteurs, les \u00e9nergies renouvelables, l\u0027adaptation au changement climatique, la qualit\u00e9 de l\u0027air\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003epolitique cyclable (\u00e9tudes, infrastructures et services)\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eactions communication/sensibilisation climat-air-\u00e9nergie\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003esubventions climat-air-\u00e9nergie\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eprojets de coop\u00e9ration climat-air-\u00e9nergie\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003etravaux de r\u00e9novation \u00e9nerg\u00e9tique du patrimoine public\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003einstallations d\u0027\u00e9nergie renouvelable\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n\u003cp\u003eA noter : Dans une approche v\u00e9ritablement transversale et int\u00e9gr\u00e9e, l\u0027ensemble des budgets des diff\u00e9rents services contribuent \u00e0 la politique climat-air-\u00e9nergie, mais dans une proportion difficilement quantifiable.  Les budgets associ\u00e9s aux services d\u00e9chets/eau/assainissement/transports publics/voirie, sont notamment associ\u00e9s \u00e0 cette politique, mais r\u00e9pondent \u00e0 des objectifs plus larges.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'euros/hab.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-49b',
    action_ids: ['citergie__5.2.1'],
    nom: 'Budget \u00e9tudes/expertises MDE/ENR/qualit\u00e9 de l\u0027air/adaptation au changement climatique (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 49a:\u003c/p\u003e\n\u003cp\u003eBudget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-49c',
    action_ids: ['citergie__5.2.1'],
    nom: 'Budget actions communication/sensibilisation climat-air-\u00e9nergie  (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 49a:\u003c/p\u003e\n\u003cp\u003eBudget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-49d',
    action_ids: ['citergie__6.5.5'],
    nom: 'Montant des aides financi\u00e8res accord\u00e9es aux particuliers et acteurs priv\u00e9s (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 49a:\u003c/p\u003e\n\u003cp\u003eBudget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eIl s\u0027agit du montant des subventions octroy\u00e9es par la collectivit\u00e9 aux particuliers et autres acteurs priv\u00e9s dans le domaine \u00e9nerg\u00e9tique et climatique. La part financ\u00e9e par la collectivit\u00e9 dans des subventions partenariales est prise en compte.\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'parten_coop',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-49d',
    action_ids: ['citergie__6.5.5'],
    nom: 'Montant des aides financi\u00e8res accord\u00e9es aux particuliers et acteurs priv\u00e9s (euros/hab.an)',
    description: '\u003cp\u003eD\u00e9clinaison par habitant.\u003c/p\u003e\n',
    thematique_id: 'parten_coop',
    unite: 'euros/hab.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-49e',
    action_ids: ['citergie__6.5.5'],
    nom: 'Budget projets de coop\u00e9ration  (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 49a:\u003c/p\u003e\n\u003cp\u003eBudget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)\u003c/p\u003e\n',
    thematique_id: 'parten_coop',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-49f',
    action_ids: ['citergie__4.3.2'],
    nom: 'Budget politique cyclable  (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 49a:\u003c/p\u003e\n\u003cp\u003eBudget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003eL\u2019indicateur mesure le budget global d\u00e9di\u00e9 par la collectivit\u00e9 au d\u00e9veloppement de la pratique cyclable sur son territoire : \u00e9tudes, infrastructures et services.\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'mobilites',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-49f',
    action_ids: ['citergie__4.3.2'],
    nom: 'Budget politique cyclable  (euros/hab.an)',
    description:
      '\u003cp\u003eD\u00e9clinaison par habitant.  Pour les collectivit\u00e9s comp\u00e9tentes en la mati\u00e8re, des valeurs de r\u00e9f\u00e9rences ramen\u00e9es au nombre d\u0027habitants sont donn\u00e9es \u00e0 titre indicatif : valeur limite 5 euros/hab.an, valeur cible 10 euros/hab.an (source observatoire des mobilit\u00e9s actives, ADEME 2016)\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'euros/hab.an',
  }),

  new IndicateurReferentiel({
    id: 'cae-49g',
    action_ids: ['citergie__4.3.2'],
    nom: 'Budget travaux r\u00e9novation \u00e9nerg\u00e9tique patrimoine public  (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 49a:\u003c/p\u003e\n\u003cp\u003eBudget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-49h',
    action_ids: ['citergie__4.3.2'],
    nom: 'Budget installations ENR publiques  (euros)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 49a:\u003c/p\u003e\n\u003cp\u003eBudget associ\u00e9 \u00e0 la politique climat-air-\u00e9nergie (euros/hab.an)\u003c/p\u003e\n',
    thematique_id: 'mobilites',
    unite: 'euros',
  }),

  new IndicateurReferentiel({
    id: 'cae-50',
    action_ids: ['citergie__5.2.1'],
    nom: 'Valorisation des CEE (kWhcumac  valoris\u00e9/an)',
    description:
      '\u003cp\u003eLes kWhcumac valoris\u00e9s chaque ann\u00e9e par la collectivit\u00e9 sont calcul\u00e9s selon les modalit\u00e9s r\u00e8glementaires du dispositif des certificats d\u0027\u00e9conomie d\u0027\u00e9nergie. Il s\u0027agit de ceux dont la rente revient \u00e0 la collectivit\u00e9.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: 'kWhcumac  valoris\u00e9/an',
  }),

  new IndicateurReferentiel({
    id: 'cae-51',
    action_ids: ['citergie__5.2.2'],
    nom: 'Part des march\u00e9s int\u00e9grant des clauses environnementales (%)',
    description:
      '\u003cp\u003ePart des march\u00e9s (en nombre) int\u00e9grant des clauses environnementales dans les sp\u00e9cifications techniques ou les crit\u00e8res d\u2019attribution en augmentation\u003c/p\u003e\n',
    thematique_id: 'conso_resp',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-52',
    action_ids: ['citergie__6.1.1'],
    nom: 'Part du budget consacr\u00e9 \u00e0 des projets de coop\u00e9ration d\u00e9centralis\u00e9e en lien avec le climat, l\u2019air ou l\u2019\u00e9nergie (%)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le montant des subventions ou investissements consentis pour les projets de coop\u00e9ration d\u00e9centralis\u00e9e, en lien avec le climat, l\u2019air et l\u2019\u00e9nergie, rapport\u00e9 au budget total (investissement et fonctionnement) de la collectivit\u00e9. Pour information, l\u0027aide publique au d\u00e9veloppement en France est estim\u00e9e \u00e0 0,38% du RNB en 2017, toutes th\u00e9matiques confondues (sant\u00e9, \u00e9ducation, alimentaire, eau, climat...). Lors du sommet du mill\u00e9naire de 2000, l\u0027objectif fix\u00e9 par la commission europ\u00e9enne \u00e9tait d\u0027atteindre 0,7 % du RNB en 2015.\u003c/p\u003e\n',
    thematique_id: 'parten_coop',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-53',
    action_ids: ['citergie__6.1.1'],
    nom: 'Part du budget consacr\u00e9 aux projets de coop\u00e9ration significatifs et multi-acteurs par an sur le climat, l\u2019air et l\u2019\u00e9nergie (%)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le montant des d\u00e9penses engag\u00e9es pour les projets de coop\u00e9ration significatifs et multi-acteurs par an sur le climat, l\u2019air et l\u2019\u00e9nergie (hors coop\u00e9ration d\u00e9centralis\u00e9e), rapport\u00e9 au budget total (investissement et fonctionnement) de la collectivit\u00e9.\u003c/p\u003e\n',
    thematique_id: 'parten_coop',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-54',
    action_ids: ['citergie__6.1.3'],
    nom: 'Nombre de manifestations/actions par an sur le climat l\u0027air et l\u0027\u00e9nergie',
    description:
      '\u003cp\u003eIl s\u0027agit du nombre de manifestions/actions de communication men\u00e9es sur le th\u00e8me de l\u0027\u00e9nergie et du climat. L\u0027\u00e9valuation est diff\u00e9renci\u00e9e selon la taille de la collectivit\u00e9. Cet indicateur fait partie d\u0027un ensemble (indicateurs qualitatifs et quantitatifs).\u003c/p\u003e\n\u003cp\u003eValeur limite : 2 (\u0026lt; 3 000 hab) ; 5 (\u0026gt; 3 000 hab) ; 10 (\u0026gt; 50 000 hab)\u003c/p\u003e\n\u003cp\u003eLes actions importantes peuvent \u00eatre compt\u00e9es comme \u00e9quivalentes \u00e0 deux actions.\u003c/p\u003e\n',
    thematique_id: 'forma_sensib',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-55',
    action_ids: ['citergie__6.2.1'],
    nom: 'Nombre de m\u00e9nages demandeurs et b\u00e9n\u00e9ficiaires du FSL pour l\u2019aide au paiement des factures d\u2019\u00e9nergie sur le territoire',
    description:
      '\u003cp\u003eL\u2019indicateur mesure annuellement le nombre de m\u00e9nages demandeurs et b\u00e9n\u00e9ficiaires du fond de solidarit\u00e9 logement (FSL) pour l\u2019aide au paiement des factures d\u2019\u00e9nergie sur le territoire. Il peut \u00eatre obtenu aupr\u00e8s des Conseils D\u00e9partementaux qui g\u00e8rent ce fond (indicateur suivi au niveau national par l\u2019office national de la pr\u00e9carit\u00e9 \u00e9nerg\u00e9tique).\u003c/p\u003e\n',
    thematique_id: 'preca_energie',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-56',
    action_ids: ['citergie__6.2.1'],
    nom: 'Nombre de dossiers \u00ab\u00a0Habiter mieux\u00a0\u00bb d\u00e9pos\u00e9s \u00e0 l\u2019Anah sur le territoire',
    description:
      '\u003cp\u003eL\u2019indicateur mesure le nombre de dossier d\u00e9pos\u00e9s chaque ann\u00e9e aupr\u00e8s de l\u2019ANAH dans le cadre du programme Habiter mieux. Ce programme vise les propri\u00e9taires occupants (sous conditions de ressources) et les propri\u00e9taires bailleurs.\u003c/p\u003e\n',
    thematique_id: 'preca_energie',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-57',
    action_ids: ['citergie__6.3.2'],
    nom: 'Taux d\u2019h\u00e9bergements labellis\u00e9s Ecolabel europ\u00e9en (ou \u00e9quivalent)',
    description:
      '\u003cp\u003eNombre d\u0027h\u00e9bergements labellis\u00e9s Ecolabel Europ\u00e9en / Total d\u0027h\u00e9bergements touristiques sur le territoire\u003c/p\u003e\n\u003cp\u003e(Indicateur compl\u00e9mentaire : Nombre d\u2019h\u00e9bergements labellis\u00e9s Ecolabel Europ\u00e9en)\u003c/p\u003e\n',
    thematique_id: 'tourisme',
    unite: 'ou \u00e9quivalent',
  }),

  new IndicateurReferentiel({
    id: 'cae-58',
    action_ids: ['citergie__6.4.1'],
    nom: 'Emissions directes de polluants atmosph\u00e9riques du secteur agriculture par ha (tonne/ha)',
    description:
      '\u003cp\u003eIndicateur exig\u00e9 dans la r\u00e8glementation PCAET (diagnostic). Arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatif au plan climat-air-\u00e9nergie territorial. Ramen\u00e9 \u00e0 l\u2019hectare pour comparaison.\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'tonne/ha',
  }),

  new IndicateurReferentiel({
    id: 'cae-59',
    action_ids: ['citergie__6.4.1'],
    nom: 'Part de surface agricole certifi\u00e9e agriculture biologique ou en conversion et haute valeur environnementale (%)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le pourcentage % de SAU impliqu\u00e9e dans une d\u00e9marche de certification environnementale (par rapport \u00e0 la SAU totale) : agriculture biologique (certifi\u00e9e et en conversion) et haute valeur environnementale (HVE). L\u0027agriculture raisonn\u00e9e (ou niveau 2 de certification environnementale selon les d\u00e9crets et arr\u00eat\u00e9s du 20 et 21 juin 2011) n\u0027est pas prise en compte. Pour la France m\u00e9tropole, la valeur limite est bas\u00e9e sur la valeur moyenne fran\u00e7aise des surfaces labellis\u00e9es AB en 2016 (5,7% - Agence bio) et la valeur cible est bas\u00e9e sur l\u2019objectif 2020 fix\u00e9 dans la loi Grenelle I (20%).\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-60',
    action_ids: ['citergie__6.4.1'],
    nom: 'Part de produits biologiques dans la restauration collective publique (%)',
    description:
      '\u003cp\u003eL\u2019indicateur mesure la part des achats (en euros) labellis\u00e9s \u00ab\u00a0agriculture biologique\u00a0\u00bb dans les achats totaux d\u2019alimentation de la restauration collective publique (ma\u00eetris\u00e9e par la collectivit\u00e9).  Pour la France m\u00e9tropole, la valeur limite est bas\u00e9e sur la part nationale des achats biologiques dans la restauration collective \u00e0 caract\u00e8re social en 2015 (3,2% - Agence Bio) et la valeur cible sur l\u2019objectif 2022 du projet de loi pour l\u2019\u00e9quilibre des relations commerciales dans le secteur agricole et alimentaire et une alimentation saine et durable (20%).\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-61',
    action_ids: ['citergie__6.4.1'],
    nom: 'Quantit\u00e9 moyenne de viande par repas dans la restauration collective publique (g/repas)',
    description:
      '\u003cp\u003eL\u2019indicateur mesure le ratio moyen de viande par repas\u00a0: la quantit\u00e9 totale annuelle de viande achet\u00e9e dans la restauration collectivit\u00e9 publique (ma\u00eetris\u00e9e par la collectivit\u00e9) est divis\u00e9e par le nombre de repas servi sur l\u2019ann\u00e9e.\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'g/repas',
  }),

  new IndicateurReferentiel({
    id: 'cae-62',
    action_ids: ['citergie__6.4.2'],
    nom: 'Part de surface foresti\u00e8re certifi\u00e9e (%)',
    description:
      '\u003cp\u003eL\u0027indicateur mesure le % de surfaces foresti\u00e8res certifi\u00e9es FSC ou PEFC (par rapport \u00e0 la surface foresti\u00e8re totale). Les objectifs sont bas\u00e9s sur les valeurs moyennes fran\u00e7aises et des dires d\u0027experts \u00a0ADEME.\u003c/p\u003e\n',
    thematique_id: 'foret_biodiv',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'cae-63a',
    action_ids: ['citergie__6.4.2', 'citergie__6.4.1'],
    nom: 'S\u00e9questration nette de dioxyde de carbone des sols et de la for\u00eat (teq CO2)',
    description:
      '\u003cp\u003eL\u0027indicateur suit une estimation de la s\u00e9questration nette de dioxyde de carbone, identifiant au moins les sols agricoles et la for\u00eat, en tenant compte des changements d\u2019affectation des terres (d\u00e9cret n\u00b02016-849 du 28 juin 2016 et arr\u00eat\u00e9 du 4 ao\u00fbt 2016 relatifs au plan climat-air-\u00e9nergie territorial).\u003c/p\u003e\n',
    thematique_id: 'foret_biodiv',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-63b',
    action_ids: ['citergie__6.4.2'],
    nom: 'S\u00e9questration de la for\u00eat  (teq CO2)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 63a:\u003c/p\u003e\n\u003cp\u003eS\u00e9questration nette de dioxyde de carbone des sols et de la for\u00eat (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'foret_biodiv',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-63c',
    action_ids: ['citergie__6.4.1'],
    nom: 'S\u00e9questration dans les terres agricoles et les prairies (teq CO2)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 63a:\u003c/p\u003e\n\u003cp\u003eS\u00e9questration nette de dioxyde de carbone des sols et de la for\u00eat (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-63d',
    action_ids: ['citergie__6.4.1'],
    nom: 'S\u00e9questration dans les autres sols (teq CO2)',
    description:
      '\u003cp\u003eComposante de l\u0027indicateur 63a:\u003c/p\u003e\n\u003cp\u003eS\u00e9questration nette de dioxyde de carbone des sols et de la for\u00eat (teq CO2)\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'teq CO2',
  }),

  new IndicateurReferentiel({
    id: 'cae-64',
    action_ids: ['citergie__6.5.3'],
    nom: 'Part d\u0027\u00e9tablissements scolaires couverts par un PDES ou un p\u00e9dibus/v\u00e9lobus',
    description:
      '\u003cp\u003eL\u0027indicateur comptabilise le nombre d\u0027\u00e9tablissement scolaires (\u00e9coles primaires, coll\u00e8ges, lyc\u00e9es) couverts par un Plan de D\u00e9placements Etablissements Scolaires ou un p\u00e9dibus/v\u00e9lobus (pour les \u00e9coles primaires principalement) sur le territoire et le rapporte au nombre total d\u0027\u00e9tablissements scolaires. Ce chiffre doit \u00eatre en augmentation chaque ann\u00e9e. Des valeurs indicatives limites (10%) et cibles (30%) sont donn\u00e9es, bas\u00e9es sur des donn\u00e9es ADEME et les meilleurs scores des collectivit\u00e9s Cit\u0027ergie.\u003c/p\u003e\n',
    thematique_id: 'forma_sensib',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'cae-65',
    action_ids: ['citergie__6.5.4'],
    nom: 'Nombre d\u0027heures de consultations et de conseils sur la th\u00e9matique climat air \u00e9nergie pour 100 hab / an',
    description:
      '\u003cp\u003eNombre d\u0027heures de consultations et de conseil sur l\u0027\u00e9nergie et la construction pour 100 hab / an\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eValeur limite = 10 min /100 hab\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eValeur cible = 60 min / 100 hab\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n',
    thematique_id: 'parten_coop',
    unite: 'Non trouv\u00e9',
  }),

  new IndicateurReferentiel({
    id: 'eci-001',
    action_ids: ['economie_circulaire__1.1'],
    nom: 'Part du budget consacr\u00e9e \u00e0 la politique Economie Circulaire dans le budget global',
    description:
      '\u003cp\u003eLa collectivit\u00e9 d\u00e9finit le p\u00e9rim\u00e8tre de sa politique Economie Circulaire transversale avec d\u0027autres politiques et strat\u00e9gies.\u003c/p\u003e\n\u003cp\u003eLa m\u00e9thodologie \u0026quot;Evaluation climat des budgets des collectivit\u00e9s territoriales\u0026quot; peut \u00eatre utilis\u00e9e pour d\u00e9finir le p\u00e9rimetre du budget Economie Circualire.\u003c/p\u003e\n\u003cp\u003eLe budget Economie Circulaire peut inclure :\u003c/p\u003e\n\u003cul\u003e\n\u003cli\u003e\n\u003cp\u003eles salaires (ou part des salaires) des salari\u00e9s travaillant sur l\u0027Economie Circulaire,\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ele co\u00fbt des formations sur l\u0027Economie Circulaire,\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003eles soutien financier et non-financier des acteurs du territoires et leurs projets pour l\u0027Economie Circulaire,\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ele financement d\u0027\u00e9v\u00e8nements consacr\u00e9s \u00e0 l\u0027Economie Circulaire,\u003c/p\u003e\n\u003c/li\u003e\n\u003cli\u003e\n\u003cp\u003ele financement des projets propres \u00e0 la collectivit\u00e9\u003c/p\u003e\n\u003c/li\u003e\n\u003c/ul\u003e\n\u003cp\u003e-etc.\u003c/p\u003e\n\u003cp\u003eLe budget peut inclure des instruments financiers mobilisant des financement public d\u0027autres institutions, voire des financements priv\u00e9s.\u003c/p\u003e\n\u003cp\u003eLes collectivit\u00e9s utilisant la comptabilit\u00e9 analytique peuvent cr\u00e9er un compte analytique associ\u00e9.\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-002',
    action_ids: ['economie_circulaire__1.2'],
    nom: 'Part des services de la collectivit\u00e9 form\u00e9s \u00e0 l\u0027Economie Circulaire',
    description:
      '\u003cp\u003eNombre de Services avec au moins un salari\u00e9 actuellement pr\u00e9sent a \u00e9t\u00e9 form\u00e9 \u00e0 l\u0027Economie Circulaire dans les 4 derni\u00e8res ann\u00e9es/ Nombre de services de la collectivit\u00e9 * 100. Les Unit\u00e9 de Gestion (Services) incluent toutes les th\u00e9matiques et secteurs, y compris fonctions support.\u003c/p\u003e\n',
    thematique_id: 'orga_interne',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-003',
    action_ids: ['economie_circulaire__1.2'],
    nom: 'Part de formations Economie Circulaire dans le programme de formation de la collectivit\u00e9',
    description:
      '\u003cp\u003eNombre de formations en lien avec l\u0027Economie Circulaire / Nombre total de formations suivis par les agents *100\u003c/p\u003e\n',
    thematique_id: 'orga_interne',
    unite: 'nombre',
  }),

  new IndicateurReferentiel({
    id: 'eci-005',
    action_ids: ['economie_circulaire__2.1'],
    nom: 'Ratio de D\u00e9chets M\u00e9nagers et Assimil\u00e9s (DMA) par habitant',
    description:
      '\u003cp\u003ePoids de DMA produits sur le territoire / Population du territoire\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'kg/habitant.an',
  }),

  new IndicateurReferentiel({
    id: 'eci-006',
    action_ids: ['economie_circulaire__2.2'],
    nom: 'Part de d\u00e9chets soumis \u00e0 la collecte s\u00e9par\u00e9e dans les Ordures M\u00e9nagers et Assimil\u00e9s (OMR) et la benne tout venant d\u00e9chetterie',
    description:
      '\u003cp\u003ePoids de d\u00e9chets soumis \u00e0 la collecte s\u00e9par\u00e9e (d\u0027apr\u00e8s le r\u00e8glement de collecte) / Poids des OMR et de la benne tout venant des d\u00e9ch\u00e8teries.\u003c/p\u003e\n\u003cp\u003eM\u00e9thode d\u0027\u00e9chantillonnage : https://www.sinoe.org/contrib/ademe/carademe/pages/guide_OMCS_echant1.php\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-007',
    action_ids: ['economie_circulaire__2.3'],
    nom: 'Part des DMA envoy\u00e9e vers les exutoires pour la r\u00e9utilisation, le recyclage et la valorisation organique ou \u00e9nerg\u00e9tique',
    description:
      '\u003cp\u003ePoids des DMA envoy\u00e9s vers les exutoires / Poids des DMA produits sur le territoire.\u003c/p\u003e\n\u003cp\u003eIl est possible de d\u00e9tailler cet indicateur pr\u00e9cisant l\u0027exutoire (les exutoires) cibl\u00e9(s).\u003c/p\u003e\n\u003cp\u003eExemples d\u0027exutoires : recycleriez, usine de compostage,\u003c/p\u003e\n\u003cp\u003em\u00e9thanisation, etc.\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-008',
    action_ids: ['economie_circulaire__2.3'],
    nom: 'Taux de mise en d\u00e9charge de DMA',
    description:
      '\u003cp\u003ePoids de d\u00e9chets envoy\u00e9s en d\u00e9charge / Poids de d\u00e9chets produits sur le territoire\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-009',
    action_ids: ['economie_circulaire__2.4'],
    nom: 'Part de d\u00e9chets b\u00e9n\u00e9ficiant d\u0027un mode de transport \u00e0 faible impact',
    description:
      '\u003cp\u003eEvolution des \u00e9quipements de transport de d\u00e9chet vers des v\u00e9hicules GNV ou biogaz, par voie fluviale, par voie ferroviaire, par v\u00e9hicules \u00e9lectriques, mobilit\u00e9 douce ou active, \u2026\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-010',
    action_ids: ['economie_circulaire__2.4'],
    nom: 'Emissions GES des Installations de Stockage de D\u00e9chets Non-Dangereux (ISDND)',
    description:
      '\u003cp\u003eEquivalent en tonnes de CO2 par an / tonne de d\u00e9chets entrant\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'eqtCO2/tonne de d\u00e9chets entrant',
  }),

  new IndicateurReferentiel({
    id: 'eci-011',
    action_ids: ['economie_circulaire__2.4'],
    nom: 'Emissions GES\u00a0de la collecte des DMA sur le territoire',
    description:
      '\u003cp\u003eNombre de kilom\u00e8tres parcourues * Facteur d\u0027\u00e9mission des v\u00e9hicules utilis\u00e9s (eqtCO2/km)\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'eqtCO2',
  }),

  new IndicateurReferentiel({
    id: 'eci-012',
    action_ids: ['economie_circulaire__2.5'],
    nom: 'Nombre de fili\u00e8res anim\u00e9s par la collectivit\u00e9 ou ses partenaires pour la prise en charge des d\u00e9chets (BTP, DAE\u2026)',
    description:
      '\u003cp\u003eLa collectivit\u00e9 d\u00e9finit le p\u00e9rim\u00e8tre des fili\u00e8res pertinent pour le territoire. L\u0027animation sous-entend des actions allant de soutien de dialogue \u00e0 l\u0027accompagnement d\u0027action pour am\u00e9liorer la dynamique d\u00e9chets des acteurs \u00e9conomiques (pr\u00e9vention, am\u00e9lioration de tri, de collecte et de valorisation, etc.)\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'nombre',
  }),

  new IndicateurReferentiel({
    id: 'eci-013',
    action_ids: ['economie_circulaire__3.1'],
    nom: 'Nombre de boucles locales d\u0027\u00e9conomie circulaire mises en place dans les 4 derni\u00e8res ann\u00e9es',
    description:
      '\u003cp\u003eL\u0027indicateur prend en compte les boucles locales op\u00e9rationnelles, c\u2019est-\u00e0-dire celles o\u00f9 au moins un \u00e9change mati\u00e8re/produit a \u00e9t\u00e9 effectu\u00e9 dans la derni\u00e8re ann\u00e9e. Comptabiliser les boucles mises en place depuis 4 ans.\u003c/p\u003e\n\u003cp\u003eUne boucle locale d\u2019\u00e9conomie circulaire vise \u00e0 conserver le plus longtemps possible dans l\u2019\u00e9conomie (locale) la valeur d\u2019un produit, de ses composants ou des mati\u00e8res (des ressources) en limitant la g\u00e9n\u00e9ration de d\u00e9chets (et en d\u00e9veloppant le partage, la r\u00e9paration, le r\u00e9emploi, la r\u00e9utilisation, la r\u00e9novation, la refabrication et le recyclage) dans une perspective de d\u00e9veloppement d\u2019activit\u00e9 \u00e9conomique (durable, faible en carbone et r\u00e9duction de l\u2019utilisation des ressources naturelles) et d\u2019emplois locaux (ou de proximit\u00e9).\u2009\u00bb\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'nombre',
  }),

  new IndicateurReferentiel({
    id: 'eci-014',
    action_ids: ['economie_circulaire__3.2'],
    nom: 'Pourcentage de contrat d\u0027achats publiques de la collectivit\u00e9 comportant au moins une consid\u00e9ration environnementale',
    description:
      '\u003cp\u003eLes contrat sur une ann\u00e9e civile sont pris en compte.\u003c/p\u003e\n\u003cp\u003eVoir la notion de la concid\u00e9ration environnementale au PNAAPD 2021-2025 - objectif 100% des march\u00e9s comportent une consid\u00e9ration environnementale.\u003c/p\u003e\n',
    thematique_id: 'conso_resp',
    unite: '% de contrat en nombre ou % de contrat en montant (au choix)',
  }),

  new IndicateurReferentiel({
    id: 'eci-015',
    action_ids: ['economie_circulaire__3.2'],
    nom: 'Part de biens ou de constructions temporaires acquis annuellement par la collectivit\u00e9 issus du r\u00e9emploi ou de la r\u00e9utilisation ou int\u00e8grent des mati\u00e8res recycl\u00e9es',
    description:
      '\u003cp\u003eDonn\u00e9es de suivi des objectifs de la loi AGEC articles 56 et 58 (d\u00e9cret n\u00b0 2021-254 du 9 mars 2021)\u003c/p\u003e\n\u003cp\u003eObjectif de 20% de achats reconditionn\u00e9s.\u003c/p\u003e\n',
    thematique_id: 'conso_resp',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-016',
    action_ids: ['economie_circulaire__3.3'],
    nom: 'Id\u00e9es d\u0027indicateurs issues du GT Collectivit\u00e9 et du CO2',
    description:
      '\u003cp\u003eNombre de commerce VRAC.\u003c/p\u003e\n\u003cp\u003eNombre de commerces locaux, AMAPs ?\u003c/p\u003e\n\u003cp\u003eComment mesurer la r\u00e9duction de la consommation ?\u003c/p\u003e\n\u003cp\u003eR\u00e9duction des surfaces commerciales ?\u003c/p\u003e\n',
    thematique_id: 'conso_resp',
    unite: 'nombre',
  }),

  new IndicateurReferentiel({
    id: 'eci-017',
    action_ids: ['economie_circulaire__3.4'],
    nom: 'Part d\u0027entreprises et d\u0027\u00e9tablissements ayant \u00e9t\u00e9 form\u00e9es \u00e0 l\u0027\u00e9coconception durant les 4 derni\u00e8res ann\u00e9es',
    description:
      '\u003cp\u003eNombre d\u0027entreprises et d\u0027\u00e9tablissements ayant \u00e9t\u00e9 form\u00e9es \u00e0 l\u0027\u00e9coconception / Nombre d\u0027entreprises et d\u0027\u00e9tablissements sur le territoire\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-018',
    action_ids: ['economie_circulaire__3.5'],
    nom: 'Nombre de synergies d\u0027Ecologie Industrielle et Territoriale (EIT) op\u00e9rationnelles sur le territoire',
    description:
      '\u003cp\u003eSynergie est consid\u00e9r\u00e9e comme op\u00e9rationnelle \u00e0 partir d\u0027au moins un \u00e9change mati\u00e8re r\u00e9alis\u00e9\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'nombre',
  }),

  new IndicateurReferentiel({
    id: 'eci-019',
    action_ids: ['economie_circulaire__3.5'],
    nom: 'Nombre d\u0027entreprises engag\u00e9es dans les synergie d\u0027EIT',
    description:
      '\u003cp\u003eSynergie est consid\u00e9r\u00e9e comme op\u00e9rationnelle \u00e0 partir d\u0027au moins un \u00e9change mati\u00e8re r\u00e9alis\u00e9\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'nombre d\u0027entreprises',
  }),

  new IndicateurReferentiel({
    id: 'eci-020',
    action_ids: [],
    nom: 'Part de l\u2019alimentation durable en restauration collective sous la comp\u00e9tence de la collectivit\u00e9',
    description:
      '\u003cp\u003eDonn\u00e9e obligatoire \u00e0 suivre dans le cadre de la loi Egalim.\u003c/p\u003e\n\u003cp\u003eReprise de la description de l\u0027indicateur CTE:\u003c/p\u003e\n\u003cp\u003eProduits entrants dans le d\u00e9compte :\u003c/p\u003e\n\u003cp\u003e\u2022 Les produits issus de l\u2019agriculture biologique (\u00e0 hauteur de 20 % minimum).\u003c/p\u003e\n\u003cp\u003e\u2022 Les produits de qualit\u00e9 et durables autres que les produits biologiques :\u003c/p\u003e\n\u003cp\u003e\u25e6 Les produits b\u00e9n\u00e9ficiant des autres signes officiels d\u2019identification de la qualit\u00e9 et de l\u2019origine (SIQO) ou des mentions valorisantes (voir ci-dessous)\u003c/p\u003e\n\u003cp\u003e\u25e6  les produits issus d\u2019une exploitation b\u00e9n\u00e9ficiant de la certification environnementale de niveau 2 (jusqu\u2019au 31/12/2029),\u003c/p\u003e\n\u003cp\u003e\u25e6 Les produits issus de la p\u00eache maritime b\u00e9n\u00e9ficiant de l\u2019\u00e9colabel P\u00eache durable\u003c/p\u003e\n\u003cp\u003e\u25e6 Les produits b\u00e9n\u00e9ficiant du logo \u00ab R\u00e9gion ultrap\u00e9riph\u00e9rique \u00bb (RUP)\u003c/p\u003e\n\u003cp\u003e\u25e6 Les produits \u00ab \u00e9quivalents \u00bb aux produits b\u00e9n\u00e9ficiant de ces signes, mentions, \u00e9colabels ou certifications.\u003c/p\u003e\n\u003cp\u003e\u25e6 Les produits acquis selon des modalit\u00e9s prenant en compte les co\u00fbts imput\u00e9s aux externalit\u00e9s environnementales li\u00e9es au produit pendant son cycle de vie.\u003c/p\u003e\n\u003cp\u003eLes ratios sont calcul\u00e9s en valeur HT d\u2019achats en \u20ac de produits alimentaires par ann\u00e9e civile (sur l\u2019ensemble des repas, boissons et collations comprises) qui r\u00e9pondent \u00e0 au moins un des crit\u00e8res , rapport\u00e9e \u00e0 la valeur HT en \u20ac de l\u2019ensemble des achats de produits alimentaires entrant dans la composition des repas.\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-021',
    action_ids: [],
    nom: 'Gaspillage alimentaire de la restauration collective sous la comp\u00e9tence de la collectivit\u00e9',
    description:
      '\u003cp\u003eQuantit\u00e9 de d\u00e9chets alimentaires produit par la restauration collective publique du territoire/ nombre de repas servis par les par la restauration collective publique du territoire. Facile \u00e0 mesurer pour la restauration scolaire et collective\u003c/p\u003e\n\u003cp\u003eObjectif l\u00e9gal (Egalim ?)\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'g/repas servi',
  }),

  new IndicateurReferentiel({
    id: 'eci-022',
    action_ids: [],
    nom: 'Part des restaurants collectif sous la comp\u00e9tence de la collectivit\u00e9 engag\u00e9e dans une d\u00e9marche de r\u00e9duction du gaspillage alimentaire',
    description:
      '\u003cp\u003eNombre restaurant collectif engag\u00e9 dans une d\u00e9marche de r\u00e9duction du gaspillage alimentaire / Nombre de restaurants collectif total.\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: 'nombre',
  }),

  new IndicateurReferentiel({
    id: 'eci-023',
    action_ids: [],
    nom: 'Ratio d\u0027\u00e9volution de terres artificialis\u00e9s vs. terres agricoles et/ou naturelles et/ou foresti\u00e8res',
    description:
      '\u003cp\u003eNombre d\u0027hectares artificialis\u00e9s total / Nombre d\u0027hectares des terres agricoles, naturelles et foresti\u00e8res.\u003c/p\u003e\n\u003cp\u003eDans la logique du Z\u00e9ro Artificialisation Net.\u003c/p\u003e\n',
    thematique_id: 'agri_alim',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-024',
    action_ids: [],
    nom: 'Proportion d\u0027\u00e9nergie utile fossile par rapport aux \u00e9nergies renouvelables consomm\u00e9es',
    description:
      '\u003cp\u003eMWh d\u0027\u00e9nergie fossile consomm\u00e9e sur le territoire/MWh d\u0027\u00e9nergie renouvelable  consomm\u00e9e sur le territoire\u003c/p\u003e\n',
    thematique_id: 'energie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-025',
    action_ids: [],
    nom: 'Part des sources d\u0027\u00e9nergie renouvelable (ENR) locales',
    description:
      '\u003cp\u003eMWh d\u0027\u00e9nergie renouvelable consomm\u00e9e sur le territoire / MWh d\u0027\u00e9nergie renouvelable produite sur le territoire *100\u003c/p\u003e\n',
    thematique_id: 'energie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-026',
    action_ids: [],
    nom: 'Perte en eau du r\u00e9seau',
    description:
      '\u003cp\u003eVolume d\u0027eau consomm\u00e9e sur le territoire/ volume d\u0027eau dirig\u00e9e vers le territoire\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-027',
    action_ids: [],
    nom: 'Quantit\u00e9 d\u0027eau potable \u00e9conomis\u00e9e',
    description:
      '\u003cp\u003eMesure de consommation d\u0027eau sur le territoire de l\u0027Ann\u00e9e N / Mesure de consommation d\u0027eau sur le territoire de l\u0027Ann\u00e9e N-X (p\u00e9riodicit\u00e9 d\u00e9finie par la collectivit\u00e9).\u003c/p\u003e\n\u003cp\u003eCet indicateur est pertinent si la collectivit\u00e9 choisit l\u0027eau comme un enjeu fort pour le territoire et y associe des actions. Le choix de la p\u00e9riodicit\u00e9 permet de suivre l\u0027impact d\u0027une action ou d\u0027une s\u00e9rie d\u0027actions.\u003c/p\u003e\n',
    thematique_id: 'eau',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-028',
    action_ids: [],
    nom: 'Emploi\u00a0en \u00e9conomie circulaire',
    description:
      '\u003cp\u003eD\u0027apr\u00e8s la liste des professions et cat\u00e9gorie socioprofessionnelles \u00e9tablie par l\u0027observatoire national des emploi et m\u00e9tiers de l\u0027\u00e9conomie verte (ONEMEV).\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-029',
    action_ids: [],
    nom: 'Proportion de l\u0027activit\u00e9 de r\u00e9paration dans l\u0027activit\u00e9 \u00e9conomique',
    description:
      '\u003cp\u003eNombre d\u0027entreprises ayant un code NAF associ\u00e9 \u00e0 la r\u00e9paration/nombre total d\u0027entreprises sur le territoire.\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-030',
    action_ids: ['economie_circulaire__1.2.2'],
    nom: 'Part des comp\u00e9tences obligatoires et facultatives exerc\u00e9es par la collectivit\u00e9 (mobilit\u00e9, urbanisme, etc.) pour lesquelles l\u2019\u00e9quipe Economie Circulaire a co-construit au moins une action favorisant l\u2019Economie Circulaire dans les 4 derni\u00e8res ann\u00e9es',
    description:
      '\u003cp\u003e% des comp\u00e9tences obligatoires et facultatives exerc\u00e9es par la collectivit\u00e9 (mobilit\u00e9, urbanisme, etc.) pour lesquelles l\u2019\u00e9quipe Economie Circulaire a co-construit au moins une action favorisant l\u2019Economie Circulaire dans les 4 derni\u00e8res ann\u00e9es\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-031',
    action_ids: ['economie_circulaire__1.2.3'],
    nom: 'Part des strat\u00e9gies ou des politiques dans lesquelles l\u2019\u00e9quipe Economie Circulaire a \u00e9t\u00e9 associ\u00e9e pour leur conception',
    description:
      '\u003cp\u003e% des strat\u00e9gies ou des politiques dans lesquelles l\u2019\u00e9quipe Economie Circulaire a \u00e9t\u00e9 associ\u00e9e pour leur conception\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-032',
    action_ids: ['economie_circulaire__4.2.4'],
    nom: 'Part de la population de la collectivit\u00e9 couverte par la Tarification Incitative',
    description:
      '\u003cp\u003e% de la population de la collectivit\u00e9 couverte par la TI\u003c/p\u003e\n',
    thematique_id: 'strategie',
    unite: '%',
  }),

  new IndicateurReferentiel({
    id: 'eci-033',
    action_ids: ['economie_circulaire__3.6'],
    nom: 'Nombre d\u0027actions de la collectivit\u00e9 en \u00e9conomie de la fonctionnalit\u00e9',
    description:
      '\u003cp\u003ePour le p\u00e9rim\u00e8tre de l\u0027\u00e9conomie de la fonctionnalit\u00e9 - voir les fiches ressources du R\u00e9f\u00e9rentiel Economie Circulaire\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'nombre d\u0027actions',
  }),

  new IndicateurReferentiel({
    id: 'eci-034',
    action_ids: ['economie_circulaire__3.6'],
    nom: 'Nombre d\u0027entreprises accompagn\u00e9es sur les questions de l\u0027\u00e9conomie de la fonctionnalit\u00e9',
    description:
      '\u003cp\u003ePour le p\u00e9rim\u00e8tre de l\u0027\u00e9conomie de la fonctionnalit\u00e9 - voir les fiches ressources du R\u00e9f\u00e9rentiel Economie Circulaire\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'nombre d\u0027entreprises',
  }),

  new IndicateurReferentiel({
    id: 'eci-035',
    action_ids: ['economie_circulaire__3.7'],
    nom: 'Nombre de projets de recherche, d\u0027innovation ou d\u0027exp\u00e9rimentation accompagn\u00e9s financi\u00e8rement ou non-financi\u00e8rement par la collectivit\u00e9',
    description:
      '\u003cp\u003eLes projets peuvent porter sur des sujets techniques, technologiques, organisationnels ou de mod\u00e8les d\u0027affires. Si la collectivit\u00e9 souhaite aller plus loin dans le suivi, elle peut prendre en compte l\u0027ampleur des projets (budgets, nombre de partenaires, etc.).\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'nombre de projets',
  }),

  new IndicateurReferentiel({
    id: 'eci-036',
    action_ids: ['economie_circulaire__3.7'],
    nom: 'L\u0027effet de levier d\u0027accompagnement financier des projets de recherche, d\u0027innovation et d\u0027exp\u00e9rimentation en mati\u00e8re d\u0027Economie Circulaire',
    description:
      '\u003cp\u003e[Total des budgets de projets Economie Circulaire soutenus par la collectivit\u00e9]-[Total d\u0027aide financi\u00e8re apport\u00e9e aux projets Economie Circulaire par la collectivit\u00e9] / [Total d\u0027aide financi\u00e8re apport\u00e9e aux projets Economie Circulaire par la collectivit\u00e9]\u003c/p\u003e\n',
    thematique_id: 'dev_eco',
    unite: 'Euros',
  }),

  new IndicateurReferentiel({
    id: 'eci-037',
    action_ids: ['economie_circulaire__4.1'],
    nom: 'D\u00e9pense annuelle consacr\u00e9e \u00e0 la gestion des d\u00e9chets',
    description:
      '\u003cp\u003eVoir la m\u00e9thode de calcul de la matrice des co\u00fbts\u003c/p\u003e\n',
    thematique_id: 'dechets',
    unite: 'euros/habitant',
  }),
];
