import type { Attribute, Schema } from '@strapi/strapi';

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Attribute.String;
    registrationToken: Attribute.String & Attribute.Private;
    resetPasswordToken: Attribute.String & Attribute.Private;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    username: Attribute.String;
  };
}

export interface ApiActualiteActualite extends Schema.CollectionType {
  collectionName: 'actualites';
  info: {
    description: '';
    displayName: 'Actualit\u00E9s';
    pluralName: 'actualites';
    singularName: 'actualite';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    categories: Attribute.Relation<
      'api::actualite.actualite',
      'oneToMany',
      'api::actualites-categorie.actualites-categorie'
    >;
    Couverture: Attribute.Media<'images'> & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::actualite.actualite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    DateCreation: Attribute.DateTime;
    Epingle: Attribute.Boolean & Attribute.DefaultTo<false>;
    publishedAt: Attribute.DateTime;
    Resume: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    Sections: Attribute.DynamicZone<
      [
        'contenu.paragraphe',
        'contenu.image',
        'contenu.gallerie',
        'contenu.video',
        'contenu.bouton-groupe',
        'contenu.info'
      ]
    >;
    seo: Attribute.Component<'shared.seo'>;
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::actualite.actualite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiActualitesCategorieActualitesCategorie
  extends Schema.CollectionType {
  collectionName: 'actualites_categories';
  info: {
    displayName: 'Actualit\u00E9s Cat\u00E9gories';
    pluralName: 'actualites-categories';
    singularName: 'actualites-categorie';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::actualites-categorie.actualites-categorie',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    nom: Attribute.String;
    publishedAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::actualites-categorie.actualites-categorie',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCollectiviteCollectivite extends Schema.CollectionType {
  collectionName: 'collectivites';
  info: {
    description: '';
    displayName: 'Collectivit\u00E9s';
    pluralName: 'collectivites';
    singularName: 'collectivite';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    actions: Attribute.Component<'contenu.texte-collectivite', true> &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    code_siren_insee: Attribute.String & Attribute.Required & Attribute.Unique;
    couverture: Attribute.Media<'images'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::collectivite.collectivite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    logo: Attribute.Media<'images'>;
    nom: Attribute.String & Attribute.Required & Attribute.Unique;
    publishedAt: Attribute.DateTime;
    seo: Attribute.Component<'shared.seo'>;
    temoignages: Attribute.Component<'shared.temoignage', true> &
      Attribute.SetMinMax<
        {
          max: 3;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::collectivite.collectivite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url: Attribute.String;
    video_en_haut: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    video_url: Attribute.String;
  };
}

export interface ApiConseillerConseiller extends Schema.CollectionType {
  collectionName: 'conseillers';
  info: {
    displayName: 'Conseillers';
    pluralName: 'conseillers';
    singularName: 'conseiller';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::conseiller.conseiller',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    linkedin: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    nom: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    photo: Attribute.Media<'images'>;
    prenom: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    publishedAt: Attribute.DateTime;
    region: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    site: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    structure: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::conseiller.conseiller',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    ville: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ApiFaqFaq extends Schema.CollectionType {
  collectionName: 'faqs';
  info: {
    description: '';
    displayName: 'FAQ';
    pluralName: 'faqs';
    singularName: 'faq';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    Contenu: Attribute.RichText & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::faq.faq', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    onglet: Attribute.Enumeration<
      ['Le programme Territoire Engag\u00E9', "L'outil num\u00E9rique"]
    > &
      Attribute.Required &
      Attribute.DefaultTo<'Le programme Territoire Engag\u00E9'>;
    publishedAt: Attribute.DateTime;
    Rang: Attribute.Integer & Attribute.Unique;
    Titre: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::faq.faq', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiLegalLegal extends Schema.CollectionType {
  collectionName: 'legals';
  info: {
    description: '';
    displayName: 'Legals';
    pluralName: 'legals';
    singularName: 'legal';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    contenu: Attribute.RichText;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::legal.legal',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    publishedAt: Attribute.DateTime;
    slug: Attribute.UID<'api::legal.legal', 'titre'> & Attribute.Required;
    titre: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::legal.legal',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPageAccueilPageAccueil extends Schema.SingleType {
  collectionName: 'page_accueils';
  info: {
    description: '';
    displayName: '1. Accueil';
    pluralName: 'page-accueils';
    singularName: 'page-accueil';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    accueil_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Votre territoire est unique. Avancez \u00E9tape par \u00E9tape dans la transition \u00E9cologique selon vos comp\u00E9tences et vos moyens.'>;
    accueil_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Une offre compl\u00E8te pour un seul objectif : votre transition \u00E9cologique'>;
    collectivites_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Explorer les collectivit\u00E9s'>;
    collectivites_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Rejoignez une communaut\u00E9 de collectivit\u00E9s engag\u00E9es'>;
    contact_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je souhaite \u00EAtre recontact\u00E9'>;
    contact_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"Vous souhaitez agir mais n'\u00EAtes pas s\u00FBr de ce qu'il vous faut ?">;
    couverture_desktop: Attribute.Media<'images'> & Attribute.Required;
    couverture_mobile: Attribute.Media<'images'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-accueil.page-accueil',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    linkedin_btn: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Voir la page Linkedin'>;
    newsletter_btn: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<"S'inscrire">;
    newsletter_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Infolettre trimestrielle - 1 email par mois maximum.'>;
    newsletter_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Suivez les actualit\u00E9s du programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    objectifs_liste: Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    > &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 5;
        },
        number
      >;
    objectifs_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Pourquoi engager votre collectivit\u00E9 ?'>;
    plateforme: Attribute.Component<'shared.vignette-avec-cta'> &
      Attribute.Required;
    programme: Attribute.Component<'shared.vignette-avec-cta'> &
      Attribute.Required;
    publishedAt: Attribute.DateTime;
    seo: Attribute.Component<'shared.seo'>;
    temoignages_liste: Attribute.Relation<
      'api::page-accueil.page-accueil',
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    temoignages_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Rejoignez une communaut\u00E9 de collectivit\u00E9s engag\u00E9es'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::page-accueil.page-accueil',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPageBudgetPageBudget extends Schema.SingleType {
  collectionName: 'page_budgets';
  info: {
    description: '';
    displayName: '6. Budget';
    pluralName: 'page-budgets';
    singularName: 'page-budget';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    budget_description: Attribute.RichText & Attribute.Required;
    budget_tableau: Attribute.JSON & Attribute.Required;
    budget_titre: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-budget.page-budget',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.Text & Attribute.Required;
    description_liste: Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    > &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    description_titre: Attribute.String & Attribute.Required;
    fonctionnement_description: Attribute.RichText & Attribute.Required;
    fonctionnement_titre: Attribute.String & Attribute.Required;
    performance_edl_titre: Attribute.String & Attribute.Required;
    performance_fa_titre: Attribute.String & Attribute.Required;
    performance_titre: Attribute.String & Attribute.Required;
    principes_description: Attribute.Text;
    principes_liste: Attribute.Component<'shared.vignette', true> &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    principes_titre: Attribute.String & Attribute.Required;
    publishedAt: Attribute.DateTime;
    repartition_titre: Attribute.String & Attribute.Required;
    seo: Attribute.Component<'shared.seo'>;
    titre_principal: Attribute.String & Attribute.Required;
    titre_secondaire: Attribute.String;
    tva_description: Attribute.RichText & Attribute.Required;
    tva_titre: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::page-budget.page-budget',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPageCollectivitePageCollectivite extends Schema.SingleType {
  collectionName: 'page_collectivites';
  info: {
    description: '';
    displayName: '4. Collectivit\u00E9';
    pluralName: 'page-collectivites';
    singularName: 'page-collectivite';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    artificialisation_sols: Attribute.Component<'contenu.indicateur'>;
    connexion_cta: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Se connecter'>;
    connexion_description: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Vous \u00EAtes membre de cette collectivit\u00E9 ?'>;
    couverture: Attribute.Media<'images'> & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-collectivite.page-collectivite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    gaz_effet_serre: Attribute.Component<'contenu.indicateur'>;
    inscription_cta: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Cr\u00E9er un compte'>;
    inscription_description: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Faites un pas suppl\u00E9mentaire vers la transition \u00E9cologique en cr\u00E9ant un compte gratuit'>;
    publishedAt: Attribute.DateTime;
    seo: Attribute.Component<'shared.seo'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::page-collectivite.page-collectivite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPageContactPageContact extends Schema.SingleType {
  collectionName: 'page_contacts';
  info: {
    description: '';
    displayName: '5. Contact';
    pluralName: 'page-contacts';
    singularName: 'page-contact';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    couverture: Attribute.Media<'images'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-contact.page-contact',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.Text &
      Attribute.DefaultTo<'Des questions sur le programme ou sur la plateforme ? \u00C9crivez-nous et nous vous r\u00E9pondrons d\u00E8s que possible.'>;
    horaires: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Permanence de 9h \u00E0 12h30 et de 14h \u00E0 16h30, du lundi au vendredi'>;
    legende_visible: Attribute.Boolean & Attribute.DefaultTo<false>;
    publishedAt: Attribute.DateTime;
    seo: Attribute.Component<'shared.seo'>;
    telephone: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'04 15 09 82 07'>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"Contacter l'\u00E9quipe">;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::page-contact.page-contact',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPageOutilsNumeriquePageOutilsNumerique
  extends Schema.SingleType {
  collectionName: 'page_outils_numeriques';
  info: {
    description: '';
    displayName: '3. Outils num\u00E9rique';
    pluralName: 'page-outils-numeriques';
    singularName: 'page-outils-numerique';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    accroche: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'D\u00E9couvrez ce service gratuit d\u00E9di\u00E9 \u00E0 accompagner votre collectivit\u00E9 ! '>;
    avantages: Attribute.Component<'shared.vignette', true> &
      Attribute.SetMinMax<
        {
          max: 4;
          min: 2;
        },
        number
      >;
    couverture: Attribute.Media<'images'> & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-outils-numerique.page-outils-numerique',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    cta_contact: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<"Je contacte l'\u00E9quipe">;
    cta_demo: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je participe \u00E0 une d\u00E9mo'>;
    cta_faq: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je consulte la FAQ'>;
    cta_inscription: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je m\u2019inscris'>;
    equipe_citation: Attribute.Text &
      Attribute.DefaultTo<"\u201CDans un environnement qui change, il n'y a pas de plus grand risque que de rester immobile.\u201D">;
    equipe_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<"D\u00E9couvrir les membres de l'\u00E9quipe">;
    equipe_description: Attribute.Text &
      Attribute.DefaultTo<'C\u2019est avec cette envie de faire avancer les choses que le projet Territoires en Transitions est n\u00E9. Nicolas Vall\u00E9e, intrapreneur et salari\u00E9 de l\u2019ADEME, a toujours aim\u00E9 faire bouger les lignes. C\u2019est donc dans cette optique qu\u2019il s\u2019est entour\u00E9 des meilleurs (\u00E9videmment) pour atteindre un objectif : changer le monde. Enfin, d\u00E9j\u00E0 changer le quotidien des collectivit\u00E9s pour leur permettre de r\u00E9ussir leur transition \u00E9cologique.'>;
    equipe_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Qui sommes-nous ?'>;
    panier_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<"\u00C7a m'int\u00E9resse">;
    panier_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<"Vous avez besoin d'aide pour identifier des actions concr\u00E8tes adapt\u00E9es \u00E0 votre territoire ? Vous souhaitez acc\u00E9l\u00E9rer votre d\u00E9marche de transition \u00E9cologique pour votre commune ou votre intercommunalit\u00E9 ? Vous cherchez \u00E0 prioriser quelques actions cl\u00E9s \u00E0 valider avec vos \u00E9lus ?">;
    panier_image: Attribute.Media<'images'>;
    panier_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Identifiez des actions \u00E0 impact pour votre collectivit\u00E9 en moins de quelques clics'>;
    publishedAt: Attribute.DateTime;
    questions_description: Attribute.RichText &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"N'h\u00E9sitez pas \u00E0 consulter notre FaQ ou \u00E0 nous contacter. Notre \u00E9quipe r\u00E9pond via le chat en moins de 20 minutes.">;
    questions_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Vous avez une question ?'>;
    seo: Attribute.Component<'shared.seo'>;
    temoignages_liste: Attribute.Relation<
      'api::page-outils-numerique.page-outils-numerique',
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Vous cherchez un outil pour piloter vos plans d\u2019action et suivre vos indicateurs ?'>;
    trajectoire_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'En savoir plus'>;
    trajectoire_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'La trajectoire SNBC territorialis\u00E9e n\u2019est aucunement prescriptive. C\u2019est un outil d\u2019aide \u00E0 la d\u00E9cision, un point de rep\u00E8re pour : - D\u00E9finir vos objectifs ou les interroger lorsque ceux-ci sont d\u00E9finis (par exemple \u00E0 l\u2019occasion d\u2019un suivi annuel ou d\u2019un bilan \u00E0 mi-parcours d\u2019un PCAET) - Quantifier les efforts \u00E0 r\u00E9aliser secteur par secteur - Identifier sa contribution \u00E0 la SNBC'>;
    trajectoire_image: Attribute.Media<'images'>;
    trajectoire_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Je calcule ma trajectoire SNBC territorialis\u00E9e'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::page-outils-numerique.page-outils-numerique',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url_demo: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action'>;
    url_inscription: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://app.territoiresentransitions.fr'>;
  };
}

export interface ApiPageProgrammePageProgramme extends Schema.SingleType {
  collectionName: 'page_programmes';
  info: {
    description: '';
    displayName: '2. Programme';
    pluralName: 'page-programmes';
    singularName: 'page-programme';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    benefices_liste: Attribute.Component<'shared.vignette-avec-titre', true>;
    benefices_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Les b\u00E9n\u00E9fices'>;
    collectivites_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Explorer les collectivit\u00E9s'>;
    collectivites_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'De nombreuses collectivit\u00E9s d\u00E9j\u00E0 engag\u00E9es'>;
    compte_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Cr\u00E9er un compte'>;
    compte_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<"- Centralisez vos donn\u00E9es et pilotez vos plans d\u2019actions - Evaluez l'impact de vos actions via vos tableaux de bord - Mesurez votre progression gr\u00E2ce aux indicateurs - R\u00E9alisez votre \u00E9tat des lieux Climat-Air-\u00C9nergie et \u00C9conomie Circulaire - Collaborez avec vos coll\u00E8gues pour le suivi des actions">;
    compte_image: Attribute.Media<'images'>;
    compte_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Cr\u00E9er un compte gratuitement sur notre service num\u00E9rique'>;
    contact_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Contactez-nous'>;
    contact_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Vous souhaitez en savoir plus sur le programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-programme.page-programme',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    Description: Attribute.Text &
      Attribute.DefaultTo<"L'outil op\u00E9rationnel de planification \u00E9cologique qui met \u00E0 votre disposition une ing\u00E9nierie territoriale et un accompagnement personnalis\u00E9.">;
    etapes_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'D\u00E9marrer maintenant'>;
    etapes_liste: Attribute.Component<'shared.vignette-avec-titre', true>;
    etapes_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Les \u00E9tapes '>;
    publishedAt: Attribute.DateTime;
    seo: Attribute.Component<'shared.seo'>;
    services_liste_rel: Attribute.Relation<
      'api::page-programme.page-programme',
      'oneToMany',
      'api::service.service'
    >;
    services_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Composez votre offre avec des services sur-mesure'>;
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Attribute.DefaultTo<'D\u00E9couvrez le programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::page-programme.page-programme',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    VideoURL: Attribute.String;
  };
}

export interface ApiPageTrajectoirePageTrajectoire extends Schema.SingleType {
  collectionName: 'page_trajectoires';
  info: {
    description: '';
    displayName: '3.1. Trajectoires';
    pluralName: 'page-trajectoires';
    singularName: 'page-trajectoire';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    bloc1_image: Attribute.Media<'images'>;
    bloc1_texte: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'La m\u00E9thodogie permettant de calculer votre trajectoire SNBC territorialis\u00E9e a \u00E9t\u00E9 d\u00E9velopp\u00E9e pour l\u2019ADEME par Solagro et l\u2019Institut Negawatt. Fruit d\u2019un travail de 18 mois avec la contribution de 13 collectivit\u00E9s pilotes volontaires, elle a permis de construire une m\u00E9thode de r\u00E9f\u00E9rence pour aider les territoires \u00E0 d\u00E9finir et \u00E0 interroger leur trajectoire bas-carbone.'>;
    bloc1_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Une m\u00E9thode de r\u00E9f\u00E9rence'>;
    bloc2_image: Attribute.Media<'images'>;
    bloc2_texte: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'La trajectoire SNBC territorialis\u00E9e n\u2019est aucunement prescriptive. C\u2019est un outil d\u2019aide \u00E0 la d\u00E9cision, un point de rep\u00E8re pour : - D\u00E9finir vos objectifs ou les interroger lorsque ceux-ci sont d\u00E9finis (par exemple \u00E0 l\u2019occasion d\u2019un suivi annuel ou d\u2019un bilan \u00E0 mi-parcours d\u2019un PCAET) - Quantifier les efforts \u00E0 r\u00E9aliser secteur par secteur - Identifier sa contribution \u00E0 la SNBC'>;
    bloc2_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Un outil d\u2019aide \u00E0 la d\u00E9cision : pas un engagement contractuel'>;
    calcul_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'\uD83D\uDC49 La trajectoire SNBC territorialis\u00E9e est disponible sous deux formes, en fonction de votre besoin et de votre temps disponible'>;
    calcul_liste: Attribute.Component<'shared.vignette-avec-markdown', true> &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 2;
        },
        number
      >;
    calcul_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'2 modes de calcul disponibles, adapt\u00E9 \u00E0 votre besoin'>;
    couverture: Attribute.Media<'images'> & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-trajectoire.page-trajectoire',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    cta_connexion: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je me connecte pour en profiter'>;
    documentation_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'Retrouvez ici les principaux documents de l\u2019\u00E9tude pilot\u00E9e par l\u2019ADEME pour d\u00E9finir cette trajectoire SNBC territorialis\u00E9e'>;
    documentation_excel: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'Mod\u00E8le de calcul de la trajectoire SNBC territorialis\u00E9e. Le fichier a \u00E9t\u00E9 con\u00E7u pour \u00EAtre autoporteur. Nous vous recommandons de vous approprier le fichier et la m\u00E9thode en d\u00E9butant par les onglets \u201CIntroduction\u201D et \u201CNotice\u201D.'>;
    documentation_info: Attribute.RichText &
      Attribute.DefaultTo<'Nous vous recommandons d\u2019utiliser la plateforme depuis le compte de votre collectivit\u00E9 pour gagner du temps. Le mode int\u00E9gr\u00E9 \u00E0 la plateforme vous permettra d\u2019acc\u00E9der \u00E0 une visualisation plus confortable. L\u2019Excel t\u00E9l\u00E9charg\u00E9 depuis votre espace vous permettra de disposer du mod\u00E8le de calcul avec vos donn\u00E9es renseign\u00E9es'>;
    documentation_pdf: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'Document d\u00E9taillant la m\u00E9thodologie appliqu\u00E9e pour territorialiser la SNBC. Il pr\u00E9sente les \u00E9tapes cl\u00E9s, les outils et les approches utilis\u00E9s pour adapter les objectifs nationaux aux territoires.'>;
    documentation_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Documentation et mod\u00E8le de calcul'>;
    methode_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'Exemple - pour le secteur r\u00E9sidentiel, les pivots de territorialisation sont :'>;
    methode_exemples: Attribute.Component<'shared.vignette', true> &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 2;
        },
        number
      >;
    methode_image: Attribute.Media<'images'>;
    methode_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"La m\u00E9thode s'appuie, pour chaque secteur, sur des pivots de territorialisation qui d\u00E9terminent la contribution du territoire \u00E0 la SNBC.">;
    publishedAt: Attribute.DateTime;
    seo: Attribute.Component<'shared.seo'>;
    temoignages_liste: Attribute.Relation<
      'api::page-trajectoire.page-trajectoire',
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Territorialisation de la SNBC pour votre collectivit\u00E9'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::page-trajectoire.page-trajectoire',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    webinaire_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je m\u2019inscris'>;
    webinaire_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'D\u00E9couvrez comment la trajectoire SNBC territorialis\u00E9e peut vous aider \u00E0 valider vos objectifs. Inscrivez-vous \u00E0 nos webinaires pour une pr\u00E9sentation d\u00E9taill\u00E9e, des d\u00E9monstrations en direct et des sessions de questions-r\u00E9ponses avec nos experts'>;
    webinaire_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Webinaire de pr\u00E9sentation'>;
    webinaire_url: Attribute.String;
  };
}

export interface ApiServiceService extends Schema.CollectionType {
  collectionName: 'services';
  info: {
    description: '';
    displayName: 'Services';
    pluralName: 'services';
    singularName: 'service';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    contenu: Attribute.DynamicZone<
      ['services.paragraphe', 'services.liste', 'services.info']
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::service.service',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String & Attribute.Required;
    description_markdown: Attribute.RichText &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 1500;
      }>;
    image: Attribute.Media<'images'> & Attribute.Required;
    publishedAt: Attribute.DateTime;
    seo: Attribute.Component<'shared.seo'>;
    sous_page: Attribute.Boolean & Attribute.DefaultTo<false>;
    titre: Attribute.String & Attribute.Required;
    uid: Attribute.UID<'api::service.service', 'titre'> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::service.service',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTemoignageTemoignage extends Schema.CollectionType {
  collectionName: 'temoignages';
  info: {
    description: '';
    displayName: 'T\u00E9moignages';
    pluralName: 'temoignages';
    singularName: 'temoignage';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::temoignage.temoignage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    identifiant: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique;
    publishedAt: Attribute.DateTime;
    temoignage: Attribute.Component<'shared.temoignage'> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::temoignage.temoignage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    timezone: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    isEntryValid: Attribute.Boolean;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginReactIconsIconlibrary extends Schema.CollectionType {
  collectionName: 'iconlibrary';
  info: {
    displayName: 'IconLibrary';
    pluralName: 'iconlibraries';
    singularName: 'iconlibrary';
  };
  options: {
    comment: '';
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    abbreviation: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        maxLength: 3;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::react-icons.iconlibrary',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    isEnabled: Attribute.Boolean & Attribute.DefaultTo<true>;
    name: Attribute.String & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::react-icons.iconlibrary',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Attribute.String;
    caption: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    ext: Attribute.String;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    height: Attribute.Integer;
    mime: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    size: Attribute.Decimal & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url: Attribute.String & Attribute.Required;
    width: Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    type: Attribute.String & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    resetPasswordToken: Attribute.String & Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::actualite.actualite': ApiActualiteActualite;
      'api::actualites-categorie.actualites-categorie': ApiActualitesCategorieActualitesCategorie;
      'api::collectivite.collectivite': ApiCollectiviteCollectivite;
      'api::conseiller.conseiller': ApiConseillerConseiller;
      'api::faq.faq': ApiFaqFaq;
      'api::legal.legal': ApiLegalLegal;
      'api::page-accueil.page-accueil': ApiPageAccueilPageAccueil;
      'api::page-budget.page-budget': ApiPageBudgetPageBudget;
      'api::page-collectivite.page-collectivite': ApiPageCollectivitePageCollectivite;
      'api::page-contact.page-contact': ApiPageContactPageContact;
      'api::page-outils-numerique.page-outils-numerique': ApiPageOutilsNumeriquePageOutilsNumerique;
      'api::page-programme.page-programme': ApiPageProgrammePageProgramme;
      'api::page-trajectoire.page-trajectoire': ApiPageTrajectoirePageTrajectoire;
      'api::service.service': ApiServiceService;
      'api::temoignage.temoignage': ApiTemoignageTemoignage;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::react-icons.iconlibrary': PluginReactIconsIconlibrary;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
