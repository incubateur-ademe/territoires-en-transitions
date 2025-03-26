export namespace Schemas {
  // <Schemas>
  export type PorteurDto = Partial<{
    codeSiret: string | null;
    referentEmail: string | null;
    referentTelephone: string | null;
    referentPrenom: string | null;
    referentNom: string | null;
    referentFonction: string | null;
  }>;
  export type Collectivite = {
    id: string;
    nom: string;
    type: 'Commune' | 'EPCI';
    codeInsee: string | null;
    codeEpci: string | null;
    codeDepartements: string | null;
    codeRegions: string | null;
    siren: string | null;
  };
  export type ProjetResponse = {
    id: string;
    createdAt: string;
    updatedAt: string;
    nom: string;
    description: string | null;
    porteur: PorteurDto | null;
    collectivites: Array<Collectivite>;
    budgetPrevisionnel: number | null;
    dateDebutPrevisionnelle: string | null;
    phaseStatut:
      | 'En cours'
      | 'En retard'
      | 'En pause'
      | 'Bloqué'
      | 'Abandonné'
      | 'Terminé'
      | null;
    phase: 'Idée' | 'Etude' | 'Opération' | null;
    programme: string | null;
    competences:
      | 'Autres interventions de protection civile'
      | "Autres services annexes de l'enseignement"
      | 'Collecte et traitement des déchets'
      | 'Développement touristique'
      | 'Enseignement du premier degré'
      | 'Enseignement du second degré'
      | 'Enseignement supérieur, professionnel et continu'
      | 'Foires et marchés'
      | 'Hébergement et restauration scolaires'
      | 'Hygiène et salubrité publique'
      | 'Incendie et secours'
      | 'Infrastructures de transport'
      | 'Jeunesse et loisirs'
      | 'Police, sécurité, justice'
      | 'Propreté urbaine'
      | 'Routes et voiries'
      | 'Santé'
      | 'Sports'
      | 'Transports publics (hors scolaire)'
      | 'Transports scolaires'
      | 'Action sociale (hors APA et RSA) > Citoyenneté'
      | 'Action sociale (hors APA et RSA) > Cohésion sociale et inclusion'
      | 'Action sociale (hors APA et RSA) > Egalité des chances'
      | 'Action sociale (hors APA et RSA) > Famille et enfance'
      | 'Action sociale (hors APA et RSA) > Handicap'
      | 'Action sociale (hors APA et RSA) > Inclusion numérique'
      | 'Action sociale (hors APA et RSA) > Jeunesse'
      | 'Action sociale (hors APA et RSA) > Lutte contre la précarité'
      | 'Action sociale (hors APA et RSA) > Personnes âgées'
      | 'Action sociale (hors APA et RSA) > Protection animale'
      | 'Actions en matière de gestion des eaux > Assainissement des eaux'
      | "Actions en matière de gestion des eaux > Cours d'eau / canaux / plans d'eau"
      | 'Actions en matière de gestion des eaux > Eau pluviale'
      | 'Actions en matière de gestion des eaux > Eau potable'
      | 'Actions en matière de gestion des eaux > Eau souterraine'
      | 'Actions en matière de gestion des eaux > Mers et océans'
      | 'Agriculture, pêche et agro-alimentaire > Consommation alimentaire'
      | 'Agriculture, pêche et agro-alimentaire > Déchets alimentaires et/ou agricoles'
      | 'Agriculture, pêche et agro-alimentaire > Distribution'
      | 'Agriculture, pêche et agro-alimentaire > Précarité et aide alimentaire'
      | 'Agriculture, pêche et agro-alimentaire > Production agricole et foncier'
      | 'Agriculture, pêche et agro-alimentaire > Transformation des produits agricoles'
      | 'Aménagement des territoires > Foncier'
      | 'Aménagement des territoires > Friche'
      | 'Aménagement des territoires > Paysage'
      | 'Aménagement des territoires > Réseaux'
      | 'Culture > Arts plastiques et photographie'
      | 'Culture > Bibliothèques et livres'
      | 'Culture > Médias et communication'
      | 'Culture > Musée'
      | 'Culture > Patrimoine et monuments historiques'
      | 'Culture > Spectacle vivant'
      | 'Habitat > Accessibilité'
      | 'Habitat > Architecture'
      | 'Habitat > Bâtiments et construction'
      | 'Habitat > Cimetières et funéraire'
      | 'Habitat > Equipement public'
      | 'Habitat > Espace public'
      | 'Habitat > Espaces verts'
      | 'Habitat > Logement et habitat'
      | 'Industrie, commerce et artisanat > Artisanat'
      | 'Industrie, commerce et artisanat > Commerces et Services'
      | 'Industrie, commerce et artisanat > Economie locale et circuits courts'
      | 'Industrie, commerce et artisanat > Economie sociale et solidaire'
      | 'Industrie, commerce et artisanat > Fiscalité des entreprises'
      | 'Industrie, commerce et artisanat > Industrie'
      | 'Industrie, commerce et artisanat > Innovation, créativité et recherche'
      | 'Industrie, commerce et artisanat > Technologies numériques et numérisation'
      | 'Industrie, commerce et artisanat > Tiers-lieux'
      | null;
    leviers:
      | 'Gestion des forêts et produits bois'
      | 'Changements de pratiques de fertilisation azotée'
      | 'Elevage durable'
      | 'Gestion des haies'
      | 'Bâtiments & Machines agricoles'
      | 'Gestion des prairies'
      | 'Pratiques stockantes'
      | 'Sobriété foncière'
      | 'Surface en aire protégée'
      | 'Résorption des points noirs prioritaires de continuité écologique'
      | 'Restauration des habitats naturels'
      | "Réduction de l'usage des produits phytosanitaires"
      | "Développement de l'agriculture biologique et de HVE"
      | "Respect d'Egalim pour la restauration collective"
      | 'Sobriété des bâtiments (résidentiel)'
      | 'Changement chaudières fioul + rénovation (résidentiel)'
      | 'Changement chaudières gaz + rénovation (résidentiel)'
      | 'Rénovation (hors changement chaudières)'
      | 'Sobriété des bâtiments (tertiaire)'
      | 'Changement chaudières fioul + rénovation (tertiaire)'
      | 'Changement chaudières gaz + rénovation (tertiaire)'
      | 'Gaz fluorés résidentiel'
      | 'Gaz fluorés tertiaire'
      | 'Captage de méthane dans les ISDND'
      | 'Prévention déchets'
      | 'Valorisation matière des déchets'
      | 'Moindre stockage en décharge'
      | 'Collecte et tri des déchets'
      | "Sobriété dans l'utilisation de la ressource en eau"
      | "Protection des zones de captage d'eau"
      | 'Désimperméabilisation des sols'
      | 'Electricité renouvelable'
      | 'Biogaz'
      | 'Réseaux de chaleur décarbonés'
      | 'Top 50 sites industriels'
      | 'Industrie diffuse'
      | 'Fret décarboné et multimodalité'
      | 'Efficacité et sobriété logistique'
      | 'Réduction des déplacements'
      | 'Covoiturage'
      | 'Vélo'
      | 'Transports en commun'
      | 'Véhicules électriques'
      | 'Efficacité énergétique des véhicules privés'
      | 'Bus et cars décarbonés'
      | '2 roues (élec&efficacité)'
      | 'Nucléaire'
      | 'Bio-carburants'
      | 'Efficacité des aéronefs'
      | 'SAF'
      | null;
    mecId: string | null;
    tetId: string | null;
    recocoId: string | null;
  };
  export type ErrorResponse = { statusCode: number; message: string };
  export type ExtraField = { name: string; value: string };
  export type ProjetExtraFieldsResponse = { extraFields: Array<ExtraField> };
  export type CreateProjetExtraFieldRequest = {
    extraFields: Array<ExtraField>;
  };
  export type CollectiviteReference = {
    type: 'Commune' | 'EPCI';
    code: string;
  };
  export type CreateProjetRequest = {
    nom: string;
    description?: string | null | undefined;
    porteur?: PorteurDto | null | undefined;
    budgetPrevisionnel?: number | null | undefined;
    dateDebutPrevisionnelle?: string | null | undefined;
    phase?: 'Idée' | 'Etude' | 'Opération' | null | undefined;
    phaseStatut?:
      | 'En cours'
      | 'En retard'
      | 'En pause'
      | 'Bloqué'
      | 'Abandonné'
      | 'Terminé'
      | null
      | undefined;
    programme?: string | null | undefined;
    collectivites: Array<CollectiviteReference>;
    competences?:
      | Array<
          | 'Autres interventions de protection civile'
          | "Autres services annexes de l'enseignement"
          | 'Collecte et traitement des déchets'
          | 'Développement touristique'
          | 'Enseignement du premier degré'
          | 'Enseignement du second degré'
          | 'Enseignement supérieur, professionnel et continu'
          | 'Foires et marchés'
          | 'Hébergement et restauration scolaires'
          | 'Hygiène et salubrité publique'
          | 'Incendie et secours'
          | 'Infrastructures de transport'
          | 'Jeunesse et loisirs'
          | 'Police, sécurité, justice'
          | 'Propreté urbaine'
          | 'Routes et voiries'
          | 'Santé'
          | 'Sports'
          | 'Transports publics (hors scolaire)'
          | 'Transports scolaires'
          | 'Action sociale (hors APA et RSA) > Citoyenneté'
          | 'Action sociale (hors APA et RSA) > Cohésion sociale et inclusion'
          | 'Action sociale (hors APA et RSA) > Egalité des chances'
          | 'Action sociale (hors APA et RSA) > Famille et enfance'
          | 'Action sociale (hors APA et RSA) > Handicap'
          | 'Action sociale (hors APA et RSA) > Inclusion numérique'
          | 'Action sociale (hors APA et RSA) > Jeunesse'
          | 'Action sociale (hors APA et RSA) > Lutte contre la précarité'
          | 'Action sociale (hors APA et RSA) > Personnes âgées'
          | 'Action sociale (hors APA et RSA) > Protection animale'
          | 'Actions en matière de gestion des eaux > Assainissement des eaux'
          | "Actions en matière de gestion des eaux > Cours d'eau / canaux / plans d'eau"
          | 'Actions en matière de gestion des eaux > Eau pluviale'
          | 'Actions en matière de gestion des eaux > Eau potable'
          | 'Actions en matière de gestion des eaux > Eau souterraine'
          | 'Actions en matière de gestion des eaux > Mers et océans'
          | 'Agriculture, pêche et agro-alimentaire > Consommation alimentaire'
          | 'Agriculture, pêche et agro-alimentaire > Déchets alimentaires et/ou agricoles'
          | 'Agriculture, pêche et agro-alimentaire > Distribution'
          | 'Agriculture, pêche et agro-alimentaire > Précarité et aide alimentaire'
          | 'Agriculture, pêche et agro-alimentaire > Production agricole et foncier'
          | 'Agriculture, pêche et agro-alimentaire > Transformation des produits agricoles'
          | 'Aménagement des territoires > Foncier'
          | 'Aménagement des territoires > Friche'
          | 'Aménagement des territoires > Paysage'
          | 'Aménagement des territoires > Réseaux'
          | 'Culture > Arts plastiques et photographie'
          | 'Culture > Bibliothèques et livres'
          | 'Culture > Médias et communication'
          | 'Culture > Musée'
          | 'Culture > Patrimoine et monuments historiques'
          | 'Culture > Spectacle vivant'
          | 'Habitat > Accessibilité'
          | 'Habitat > Architecture'
          | 'Habitat > Bâtiments et construction'
          | 'Habitat > Cimetières et funéraire'
          | 'Habitat > Equipement public'
          | 'Habitat > Espace public'
          | 'Habitat > Espaces verts'
          | 'Habitat > Logement et habitat'
          | 'Industrie, commerce et artisanat > Artisanat'
          | 'Industrie, commerce et artisanat > Commerces et Services'
          | 'Industrie, commerce et artisanat > Economie locale et circuits courts'
          | 'Industrie, commerce et artisanat > Economie sociale et solidaire'
          | 'Industrie, commerce et artisanat > Fiscalité des entreprises'
          | 'Industrie, commerce et artisanat > Industrie'
          | 'Industrie, commerce et artisanat > Innovation, créativité et recherche'
          | 'Industrie, commerce et artisanat > Technologies numériques et numérisation'
          | 'Industrie, commerce et artisanat > Tiers-lieux'
        >
      | null
      | undefined;
    leviers?:
      | Array<
          | 'Gestion des forêts et produits bois'
          | 'Changements de pratiques de fertilisation azotée'
          | 'Elevage durable'
          | 'Gestion des haies'
          | 'Bâtiments & Machines agricoles'
          | 'Gestion des prairies'
          | 'Pratiques stockantes'
          | 'Sobriété foncière'
          | 'Surface en aire protégée'
          | 'Résorption des points noirs prioritaires de continuité écologique'
          | 'Restauration des habitats naturels'
          | "Réduction de l'usage des produits phytosanitaires"
          | "Développement de l'agriculture biologique et de HVE"
          | "Respect d'Egalim pour la restauration collective"
          | 'Sobriété des bâtiments (résidentiel)'
          | 'Changement chaudières fioul + rénovation (résidentiel)'
          | 'Changement chaudières gaz + rénovation (résidentiel)'
          | 'Rénovation (hors changement chaudières)'
          | 'Sobriété des bâtiments (tertiaire)'
          | 'Changement chaudières fioul + rénovation (tertiaire)'
          | 'Changement chaudières gaz + rénovation (tertiaire)'
          | 'Gaz fluorés résidentiel'
          | 'Gaz fluorés tertiaire'
          | 'Captage de méthane dans les ISDND'
          | 'Prévention déchets'
          | 'Valorisation matière des déchets'
          | 'Moindre stockage en décharge'
          | 'Collecte et tri des déchets'
          | "Sobriété dans l'utilisation de la ressource en eau"
          | "Protection des zones de captage d'eau"
          | 'Désimperméabilisation des sols'
          | 'Electricité renouvelable'
          | 'Biogaz'
          | 'Réseaux de chaleur décarbonés'
          | 'Top 50 sites industriels'
          | 'Industrie diffuse'
          | 'Fret décarboné et multimodalité'
          | 'Efficacité et sobriété logistique'
          | 'Réduction des déplacements'
          | 'Covoiturage'
          | 'Vélo'
          | 'Transports en commun'
          | 'Véhicules électriques'
          | 'Efficacité énergétique des véhicules privés'
          | 'Bus et cars décarbonés'
          | '2 roues (élec&efficacité)'
          | 'Nucléaire'
          | 'Bio-carburants'
          | 'Efficacité des aéronefs'
          | 'SAF'
        >
      | null
      | undefined;
    externalId: string;
  };
  export type CreateOrUpdateProjetResponse = { id: string };
  export type BulkCreateProjetsRequest = {
    projects: Array<CreateProjetRequest>;
  };
  export type BulkCreateProjetsResponse = { ids: Array<string> };
  export type UpdateProjetRequest = {
    nom?: string | undefined;
    description?: string | null | undefined;
    porteur?: PorteurDto | null | undefined;
    budgetPrevisionnel?: number | null | undefined;
    dateDebutPrevisionnelle?: string | null | undefined;
    phase?: 'Idée' | 'Etude' | 'Opération' | null | undefined;
    phaseStatut?:
      | 'En cours'
      | 'En retard'
      | 'En pause'
      | 'Bloqué'
      | 'Abandonné'
      | 'Terminé'
      | null
      | undefined;
    programme?: string | null | undefined;
    collectivites?: Array<CollectiviteReference> | undefined;
    competences?:
      | Array<
          | 'Autres interventions de protection civile'
          | "Autres services annexes de l'enseignement"
          | 'Collecte et traitement des déchets'
          | 'Développement touristique'
          | 'Enseignement du premier degré'
          | 'Enseignement du second degré'
          | 'Enseignement supérieur, professionnel et continu'
          | 'Foires et marchés'
          | 'Hébergement et restauration scolaires'
          | 'Hygiène et salubrité publique'
          | 'Incendie et secours'
          | 'Infrastructures de transport'
          | 'Jeunesse et loisirs'
          | 'Police, sécurité, justice'
          | 'Propreté urbaine'
          | 'Routes et voiries'
          | 'Santé'
          | 'Sports'
          | 'Transports publics (hors scolaire)'
          | 'Transports scolaires'
          | 'Action sociale (hors APA et RSA) > Citoyenneté'
          | 'Action sociale (hors APA et RSA) > Cohésion sociale et inclusion'
          | 'Action sociale (hors APA et RSA) > Egalité des chances'
          | 'Action sociale (hors APA et RSA) > Famille et enfance'
          | 'Action sociale (hors APA et RSA) > Handicap'
          | 'Action sociale (hors APA et RSA) > Inclusion numérique'
          | 'Action sociale (hors APA et RSA) > Jeunesse'
          | 'Action sociale (hors APA et RSA) > Lutte contre la précarité'
          | 'Action sociale (hors APA et RSA) > Personnes âgées'
          | 'Action sociale (hors APA et RSA) > Protection animale'
          | 'Actions en matière de gestion des eaux > Assainissement des eaux'
          | "Actions en matière de gestion des eaux > Cours d'eau / canaux / plans d'eau"
          | 'Actions en matière de gestion des eaux > Eau pluviale'
          | 'Actions en matière de gestion des eaux > Eau potable'
          | 'Actions en matière de gestion des eaux > Eau souterraine'
          | 'Actions en matière de gestion des eaux > Mers et océans'
          | 'Agriculture, pêche et agro-alimentaire > Consommation alimentaire'
          | 'Agriculture, pêche et agro-alimentaire > Déchets alimentaires et/ou agricoles'
          | 'Agriculture, pêche et agro-alimentaire > Distribution'
          | 'Agriculture, pêche et agro-alimentaire > Précarité et aide alimentaire'
          | 'Agriculture, pêche et agro-alimentaire > Production agricole et foncier'
          | 'Agriculture, pêche et agro-alimentaire > Transformation des produits agricoles'
          | 'Aménagement des territoires > Foncier'
          | 'Aménagement des territoires > Friche'
          | 'Aménagement des territoires > Paysage'
          | 'Aménagement des territoires > Réseaux'
          | 'Culture > Arts plastiques et photographie'
          | 'Culture > Bibliothèques et livres'
          | 'Culture > Médias et communication'
          | 'Culture > Musée'
          | 'Culture > Patrimoine et monuments historiques'
          | 'Culture > Spectacle vivant'
          | 'Habitat > Accessibilité'
          | 'Habitat > Architecture'
          | 'Habitat > Bâtiments et construction'
          | 'Habitat > Cimetières et funéraire'
          | 'Habitat > Equipement public'
          | 'Habitat > Espace public'
          | 'Habitat > Espaces verts'
          | 'Habitat > Logement et habitat'
          | 'Industrie, commerce et artisanat > Artisanat'
          | 'Industrie, commerce et artisanat > Commerces et Services'
          | 'Industrie, commerce et artisanat > Economie locale et circuits courts'
          | 'Industrie, commerce et artisanat > Economie sociale et solidaire'
          | 'Industrie, commerce et artisanat > Fiscalité des entreprises'
          | 'Industrie, commerce et artisanat > Industrie'
          | 'Industrie, commerce et artisanat > Innovation, créativité et recherche'
          | 'Industrie, commerce et artisanat > Technologies numériques et numérisation'
          | 'Industrie, commerce et artisanat > Tiers-lieux'
        >
      | null
      | undefined;
    leviers?:
      | Array<
          | 'Gestion des forêts et produits bois'
          | 'Changements de pratiques de fertilisation azotée'
          | 'Elevage durable'
          | 'Gestion des haies'
          | 'Bâtiments & Machines agricoles'
          | 'Gestion des prairies'
          | 'Pratiques stockantes'
          | 'Sobriété foncière'
          | 'Surface en aire protégée'
          | 'Résorption des points noirs prioritaires de continuité écologique'
          | 'Restauration des habitats naturels'
          | "Réduction de l'usage des produits phytosanitaires"
          | "Développement de l'agriculture biologique et de HVE"
          | "Respect d'Egalim pour la restauration collective"
          | 'Sobriété des bâtiments (résidentiel)'
          | 'Changement chaudières fioul + rénovation (résidentiel)'
          | 'Changement chaudières gaz + rénovation (résidentiel)'
          | 'Rénovation (hors changement chaudières)'
          | 'Sobriété des bâtiments (tertiaire)'
          | 'Changement chaudières fioul + rénovation (tertiaire)'
          | 'Changement chaudières gaz + rénovation (tertiaire)'
          | 'Gaz fluorés résidentiel'
          | 'Gaz fluorés tertiaire'
          | 'Captage de méthane dans les ISDND'
          | 'Prévention déchets'
          | 'Valorisation matière des déchets'
          | 'Moindre stockage en décharge'
          | 'Collecte et tri des déchets'
          | "Sobriété dans l'utilisation de la ressource en eau"
          | "Protection des zones de captage d'eau"
          | 'Désimperméabilisation des sols'
          | 'Electricité renouvelable'
          | 'Biogaz'
          | 'Réseaux de chaleur décarbonés'
          | 'Top 50 sites industriels'
          | 'Industrie diffuse'
          | 'Fret décarboné et multimodalité'
          | 'Efficacité et sobriété logistique'
          | 'Réduction des déplacements'
          | 'Covoiturage'
          | 'Vélo'
          | 'Transports en commun'
          | 'Véhicules électriques'
          | 'Efficacité énergétique des véhicules privés'
          | 'Bus et cars décarbonés'
          | '2 roues (élec&efficacité)'
          | 'Nucléaire'
          | 'Bio-carburants'
          | 'Efficacité des aéronefs'
          | 'SAF'
        >
      | null
      | undefined;
    externalId: string;
  };
  export type ExtraFieldConfig = { name: string; label: string };
  export type ServicesByProjectIdResponse = {
    id: string;
    name: string;
    description: string;
    sousTitre: string;
    redirectionUrl: string;
    logoUrl: string;
    extraFields: Array<ExtraFieldConfig>;
    isListed: boolean;
    redirectionLabel: string | null;
    iframeUrl: string | null;
    extendLabel: string | null;
  };
  export type CreateServiceRequest = {
    name: string;
    sousTitre: string;
    description: string;
    logoUrl: string;
    redirectionUrl: string;
    redirectionLabel?: string | null | undefined;
    iframeUrl?: string | null | undefined;
    extendLabel?: string | null | undefined;
    isListed?: boolean | undefined;
  };
  export type CreateServiceResponse = {
    id: string;
    name: string;
    description: string;
    sousTitre: string;
    logoUrl: string;
    redirectionUrl: string;
    redirectionLabel: unknown | null;
    iframeUrl: unknown | null;
    extendLabel: unknown | null;
  };
  export type CreateServiceContextRequest = {
    competences: Array<
      | 'Autres interventions de protection civile'
      | "Autres services annexes de l'enseignement"
      | 'Collecte et traitement des déchets'
      | 'Développement touristique'
      | 'Enseignement du premier degré'
      | 'Enseignement du second degré'
      | 'Enseignement supérieur, professionnel et continu'
      | 'Foires et marchés'
      | 'Hébergement et restauration scolaires'
      | 'Hygiène et salubrité publique'
      | 'Incendie et secours'
      | 'Infrastructures de transport'
      | 'Jeunesse et loisirs'
      | 'Police, sécurité, justice'
      | 'Propreté urbaine'
      | 'Routes et voiries'
      | 'Santé'
      | 'Sports'
      | 'Transports publics (hors scolaire)'
      | 'Transports scolaires'
      | 'Action sociale (hors APA et RSA) > Citoyenneté'
      | 'Action sociale (hors APA et RSA) > Cohésion sociale et inclusion'
      | 'Action sociale (hors APA et RSA) > Egalité des chances'
      | 'Action sociale (hors APA et RSA) > Famille et enfance'
      | 'Action sociale (hors APA et RSA) > Handicap'
      | 'Action sociale (hors APA et RSA) > Inclusion numérique'
      | 'Action sociale (hors APA et RSA) > Jeunesse'
      | 'Action sociale (hors APA et RSA) > Lutte contre la précarité'
      | 'Action sociale (hors APA et RSA) > Personnes âgées'
      | 'Action sociale (hors APA et RSA) > Protection animale'
      | 'Actions en matière de gestion des eaux > Assainissement des eaux'
      | "Actions en matière de gestion des eaux > Cours d'eau / canaux / plans d'eau"
      | 'Actions en matière de gestion des eaux > Eau pluviale'
      | 'Actions en matière de gestion des eaux > Eau potable'
      | 'Actions en matière de gestion des eaux > Eau souterraine'
      | 'Actions en matière de gestion des eaux > Mers et océans'
      | 'Agriculture, pêche et agro-alimentaire > Consommation alimentaire'
      | 'Agriculture, pêche et agro-alimentaire > Déchets alimentaires et/ou agricoles'
      | 'Agriculture, pêche et agro-alimentaire > Distribution'
      | 'Agriculture, pêche et agro-alimentaire > Précarité et aide alimentaire'
      | 'Agriculture, pêche et agro-alimentaire > Production agricole et foncier'
      | 'Agriculture, pêche et agro-alimentaire > Transformation des produits agricoles'
      | 'Aménagement des territoires > Foncier'
      | 'Aménagement des territoires > Friche'
      | 'Aménagement des territoires > Paysage'
      | 'Aménagement des territoires > Réseaux'
      | 'Culture > Arts plastiques et photographie'
      | 'Culture > Bibliothèques et livres'
      | 'Culture > Médias et communication'
      | 'Culture > Musée'
      | 'Culture > Patrimoine et monuments historiques'
      | 'Culture > Spectacle vivant'
      | 'Habitat > Accessibilité'
      | 'Habitat > Architecture'
      | 'Habitat > Bâtiments et construction'
      | 'Habitat > Cimetières et funéraire'
      | 'Habitat > Equipement public'
      | 'Habitat > Espace public'
      | 'Habitat > Espaces verts'
      | 'Habitat > Logement et habitat'
      | 'Industrie, commerce et artisanat > Artisanat'
      | 'Industrie, commerce et artisanat > Commerces et Services'
      | 'Industrie, commerce et artisanat > Economie locale et circuits courts'
      | 'Industrie, commerce et artisanat > Economie sociale et solidaire'
      | 'Industrie, commerce et artisanat > Fiscalité des entreprises'
      | 'Industrie, commerce et artisanat > Industrie'
      | 'Industrie, commerce et artisanat > Innovation, créativité et recherche'
      | 'Industrie, commerce et artisanat > Technologies numériques et numérisation'
      | 'Industrie, commerce et artisanat > Tiers-lieux'
    > | null;
    leviers: Array<
      | 'Gestion des forêts et produits bois'
      | 'Changements de pratiques de fertilisation azotée'
      | 'Elevage durable'
      | 'Gestion des haies'
      | 'Bâtiments & Machines agricoles'
      | 'Gestion des prairies'
      | 'Pratiques stockantes'
      | 'Sobriété foncière'
      | 'Surface en aire protégée'
      | 'Résorption des points noirs prioritaires de continuité écologique'
      | 'Restauration des habitats naturels'
      | "Réduction de l'usage des produits phytosanitaires"
      | "Développement de l'agriculture biologique et de HVE"
      | "Respect d'Egalim pour la restauration collective"
      | 'Sobriété des bâtiments (résidentiel)'
      | 'Changement chaudières fioul + rénovation (résidentiel)'
      | 'Changement chaudières gaz + rénovation (résidentiel)'
      | 'Rénovation (hors changement chaudières)'
      | 'Sobriété des bâtiments (tertiaire)'
      | 'Changement chaudières fioul + rénovation (tertiaire)'
      | 'Changement chaudières gaz + rénovation (tertiaire)'
      | 'Gaz fluorés résidentiel'
      | 'Gaz fluorés tertiaire'
      | 'Captage de méthane dans les ISDND'
      | 'Prévention déchets'
      | 'Valorisation matière des déchets'
      | 'Moindre stockage en décharge'
      | 'Collecte et tri des déchets'
      | "Sobriété dans l'utilisation de la ressource en eau"
      | "Protection des zones de captage d'eau"
      | 'Désimperméabilisation des sols'
      | 'Electricité renouvelable'
      | 'Biogaz'
      | 'Réseaux de chaleur décarbonés'
      | 'Top 50 sites industriels'
      | 'Industrie diffuse'
      | 'Fret décarboné et multimodalité'
      | 'Efficacité et sobriété logistique'
      | 'Réduction des déplacements'
      | 'Covoiturage'
      | 'Vélo'
      | 'Transports en commun'
      | 'Véhicules électriques'
      | 'Efficacité énergétique des véhicules privés'
      | 'Bus et cars décarbonés'
      | '2 roues (élec&efficacité)'
      | 'Nucléaire'
      | 'Bio-carburants'
      | 'Efficacité des aéronefs'
      | 'SAF'
    > | null;
    phases: Array<'Idée' | 'Etude' | 'Opération'> | null;
    description?: string | null | undefined;
    sousTitre?: string | null | undefined;
    logoUrl?: string | null | undefined;
    redirectionUrl?: string | null | undefined;
    redirectionLabel?: string | null | undefined;
    extendLabel?: string | null | undefined;
    iframeUrl?: string | null | undefined;
    extraFields?: Array<ExtraFieldConfig> | null | undefined;
  };
  export type CreateServiceContextResponse = { id: string };

  // </Schemas>
}

export namespace Endpoints {
  // <Endpoints>

  export type get_ProjetsController_findAll = {
    method: 'GET';
    path: '/projets';
    requestFormat: 'json';
    parameters: never;
    response: Array<Schemas.ProjetResponse>;
  };
  export type post_ProjetsController_create = {
    method: 'POST';
    path: '/projets';
    requestFormat: 'json';
    parameters: {
      body: Schemas.CreateProjetRequest;
    };
    response: Schemas.CreateOrUpdateProjetResponse;
  };
  export type get_ProjetsController_findOne = {
    method: 'GET';
    path: '/projets/{id}';
    requestFormat: 'json';
    parameters: {
      path: { id: string };
    };
    response: Schemas.ProjetResponse;
  };
  export type patch_ProjetsController_update = {
    method: 'PATCH';
    path: '/projets/{id}';
    requestFormat: 'json';
    parameters: {
      path: { id: string };

      body: Schemas.UpdateProjetRequest;
    };
    response: Schemas.CreateOrUpdateProjetResponse;
  };
  export type get_ProjetsController_getExtraFields = {
    method: 'GET';
    path: '/projets/{id}/extra-fields';
    requestFormat: 'json';
    parameters: {
      path: { id: string };
    };
    response: Schemas.ProjetExtraFieldsResponse;
  };
  export type post_ProjetsController_updateExtraFields = {
    method: 'POST';
    path: '/projets/{id}/extra-fields';
    requestFormat: 'json';
    parameters: {
      path: { id: string };

      body: Schemas.CreateProjetExtraFieldRequest;
    };
    response: Schemas.ProjetExtraFieldsResponse;
  };
  export type post_ProjetsController_createBulk = {
    method: 'POST';
    path: '/projets/bulk';
    requestFormat: 'json';
    parameters: {
      body: Schemas.BulkCreateProjetsRequest;
    };
    response: Schemas.BulkCreateProjetsResponse;
  };
  export type get_ServicesController_getServicesByProjectId = {
    method: 'GET';
    path: '/services/project/{id}';
    requestFormat: 'json';
    parameters: {
      query: { debug: boolean };
      path: { id: string };
    };
    response: Array<Schemas.ServicesByProjectIdResponse>;
  };
  export type post_ServicesController_create = {
    method: 'POST';
    path: '/services';
    requestFormat: 'json';
    parameters: {
      body: Schemas.CreateServiceRequest;
    };
    response: Schemas.CreateServiceResponse;
  };
  export type post_ServicesController_createServiceContext = {
    method: 'POST';
    path: '/services/contexts/{id}';
    requestFormat: 'json';
    parameters: {
      path: { id: string };

      body: Schemas.CreateServiceContextRequest;
    };
    response: Schemas.CreateServiceContextResponse;
  };

  // </Endpoints>
}

// <EndpointByMethod>
export type EndpointByMethod = {
  get: {
    '/projets': Endpoints.get_ProjetsController_findAll;
    '/projets/{id}': Endpoints.get_ProjetsController_findOne;
    '/projets/{id}/extra-fields': Endpoints.get_ProjetsController_getExtraFields;
    '/services/project/{id}': Endpoints.get_ServicesController_getServicesByProjectId;
  };
  post: {
    '/projets': Endpoints.post_ProjetsController_create;
    '/projets/{id}/extra-fields': Endpoints.post_ProjetsController_updateExtraFields;
    '/projets/bulk': Endpoints.post_ProjetsController_createBulk;
    '/services': Endpoints.post_ServicesController_create;
    '/services/contexts/{id}': Endpoints.post_ServicesController_createServiceContext;
  };
  patch: {
    '/projets/{id}': Endpoints.patch_ProjetsController_update;
  };
};

// </EndpointByMethod>

// <EndpointByMethod.Shorthands>
export type GetEndpoints = EndpointByMethod['get'];
export type PostEndpoints = EndpointByMethod['post'];
export type PatchEndpoints = EndpointByMethod['patch'];
export type AllEndpoints = EndpointByMethod[keyof EndpointByMethod];
// </EndpointByMethod.Shorthands>

// <ApiClientTypes>
export type EndpointParameters = {
  body?: unknown;
  query?: Record<string, unknown>;
  header?: Record<string, unknown>;
  path?: Record<string, unknown>;
};

export type MutationMethod = 'post' | 'put' | 'patch' | 'delete';
export type Method = 'get' | 'head' | 'options' | MutationMethod;

type RequestFormat = 'json' | 'form-data' | 'form-url' | 'binary' | 'text';

export type DefaultEndpoint = {
  parameters?: EndpointParameters | undefined;
  response: unknown;
};

export type Endpoint<TConfig extends DefaultEndpoint = DefaultEndpoint> = {
  operationId: string;
  method: Method;
  path: string;
  requestFormat: RequestFormat;
  parameters?: TConfig['parameters'];
  meta: {
    alias: string;
    hasParameters: boolean;
    areParametersRequired: boolean;
  };
  response: TConfig['response'];
};

type Fetcher = (
  method: Method,
  url: string,
  parameters?: EndpointParameters | undefined
) => Promise<Endpoint['response']>;

type RequiredKeys<T> = {
  [P in keyof T]-?: undefined extends T[P] ? never : P;
}[keyof T];

type MaybeOptionalArg<T> = RequiredKeys<T> extends never
  ? [config?: T]
  : [config: T];

// </ApiClientTypes>

// <ApiClient>
export class ApiClient {
  baseUrl: string = '';

  constructor(public fetcher: Fetcher) {}

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
    return this;
  }

  // <ApiClient.get>
  get<Path extends keyof GetEndpoints, TEndpoint extends GetEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<TEndpoint['parameters']>
  ): Promise<TEndpoint['response']> {
    return this.fetcher('get', this.baseUrl + path, params[0]) as Promise<
      TEndpoint['response']
    >;
  }
  // </ApiClient.get>

  // <ApiClient.post>
  post<Path extends keyof PostEndpoints, TEndpoint extends PostEndpoints[Path]>(
    path: Path,
    ...params: MaybeOptionalArg<TEndpoint['parameters']>
  ): Promise<TEndpoint['response']> {
    return this.fetcher('post', this.baseUrl + path, params[0]) as Promise<
      TEndpoint['response']
    >;
  }
  // </ApiClient.post>

  // <ApiClient.patch>
  patch<
    Path extends keyof PatchEndpoints,
    TEndpoint extends PatchEndpoints[Path]
  >(
    path: Path,
    ...params: MaybeOptionalArg<TEndpoint['parameters']>
  ): Promise<TEndpoint['response']> {
    return this.fetcher('patch', this.baseUrl + path, params[0]) as Promise<
      TEndpoint['response']
    >;
  }
  // </ApiClient.patch>
}

export function createApiClient(fetcher: Fetcher, baseUrl?: string) {
  return new ApiClient(fetcher).setBaseUrl(baseUrl ?? '');
}

/**
 Example usage:
 const api = createApiClient((method, url, params) =>
   fetch(url, { method, body: JSON.stringify(params) }).then((res) => res.json()),
 );
 api.get("/users").then((users) => console.log(users));
 api.post("/users", { body: { name: "John" } }).then((user) => console.log(user));
 api.put("/users/:id", { path: { id: 1 }, body: { name: "John" } }).then((user) => console.log(user));
*/

// </ApiClient
