import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
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
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
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
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
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
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
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
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
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
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
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
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
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
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiActualiteActualite extends Struct.CollectionTypeSchema {
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
    categories: Schema.Attribute.Relation<
      'oneToMany',
      'api::actualites-categorie.actualites-categorie'
    >;
    Couverture: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    DateCreation: Schema.Attribute.DateTime;
    Epingle: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::actualite.actualite'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    Resume: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    Sections: Schema.Attribute.DynamicZone<
      [
        'contenu.paragraphe',
        'contenu.image',
        'contenu.gallerie',
        'contenu.video',
        'contenu.bouton-groupe',
        'contenu.info',
      ]
    >;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    Titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiActualitesCategorieActualitesCategorie
  extends Struct.CollectionTypeSchema {
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
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::actualites-categorie.actualites-categorie'
    > &
      Schema.Attribute.Private;
    nom: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCollectiviteCollectivite
  extends Struct.CollectionTypeSchema {
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
    actions: Schema.Attribute.Component<'contenu.texte-collectivite', true> &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    code_siren_insee: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    couverture: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::collectivite.collectivite'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images'>;
    nom: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    temoignages: Schema.Attribute.Component<'shared.temoignage', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
          min: 1;
        },
        number
      >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String;
    video_en_haut: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    video_url: Schema.Attribute.String;
  };
}

export interface ApiConseillerConseiller extends Struct.CollectionTypeSchema {
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
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    linkedin: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::conseiller.conseiller'
    > &
      Schema.Attribute.Private;
    nom: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    photo: Schema.Attribute.Media<'images'>;
    prenom: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    region: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    site: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    structure: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ville: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ApiFaqFaq extends Struct.CollectionTypeSchema {
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
    Contenu: Schema.Attribute.RichText & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::faq.faq'> &
      Schema.Attribute.Private;
    onglet: Schema.Attribute.Enumeration<
      ['Le programme Territoire Engag\u00E9', "L'outil num\u00E9rique"]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Le programme Territoire Engag\u00E9'>;
    publishedAt: Schema.Attribute.DateTime;
    Rang: Schema.Attribute.Integer & Schema.Attribute.Unique;
    Titre: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPageAccueilPageAccueil extends Struct.SingleTypeSchema {
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
    Accompagnement: Schema.Attribute.Component<'bloc.accompagnement', false> &
      Schema.Attribute.Required;
    accueil_description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Votre territoire est unique. Avancez \u00E9tape par \u00E9tape dans la transition \u00E9cologique selon vos comp\u00E9tences et vos moyens.'>;
    accueil_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Une offre compl\u00E8te pour un seul objectif : votre transition \u00E9cologique'>;
    collectivites_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Explorer les collectivit\u00E9s'>;
    collectivites_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Rejoignez une communaut\u00E9 de collectivit\u00E9s engag\u00E9es'>;
    contact_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Je souhaite \u00EAtre recontact\u00E9'>;
    contact_description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<"Vous souhaitez agir mais n'\u00EAtes pas s\u00FBr de ce qu'il vous faut ?">;
    Couverture: Schema.Attribute.Media<'images'>;
    couverture_desktop: Schema.Attribute.Media<'images'> &
      Schema.Attribute.Required;
    couverture_mobile: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    Informations: Schema.Attribute.Component<'bloc.description', false> &
      Schema.Attribute.Required;
    linkedin_btn: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Voir la page Linkedin'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::page-accueil.page-accueil'
    > &
      Schema.Attribute.Private;
    Newsletter: Schema.Attribute.Component<'bloc.description', false> &
      Schema.Attribute.Required;
    newsletter_btn: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<"S'inscrire">;
    newsletter_description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Infolettre trimestrielle - 1 email par mois maximum.'>;
    newsletter_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Suivez les actualit\u00E9s du programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    objectifs_liste: Schema.Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    > &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 5;
        },
        number
      >;
    objectifs_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Pourquoi engager votre collectivit\u00E9 ?'>;
    plateforme: Schema.Attribute.Component<'shared.vignette-avec-cta', false> &
      Schema.Attribute.Required;
    programme: Schema.Attribute.Component<'shared.vignette-avec-cta', false> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    Temoignages: Schema.Attribute.Component<'bloc.description', false> &
      Schema.Attribute.Required;
    temoignages_liste: Schema.Attribute.Relation<
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    temoignages_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Rejoignez une communaut\u00E9 de collectivit\u00E9s engag\u00E9es'>;
    Titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }> &
      Schema.Attribute.DefaultTo<'Acc\u00E9l\u00E9rez la transition \u00E9cologique de votre collectivit\u00E9'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPageBudgetPageBudget extends Struct.SingleTypeSchema {
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
    budget_description: Schema.Attribute.RichText & Schema.Attribute.Required;
    budget_tableau: Schema.Attribute.JSON & Schema.Attribute.Required;
    budget_titre: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    description_liste: Schema.Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    > &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    description_titre: Schema.Attribute.String & Schema.Attribute.Required;
    fonctionnement_description: Schema.Attribute.RichText &
      Schema.Attribute.Required;
    fonctionnement_titre: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::page-budget.page-budget'
    > &
      Schema.Attribute.Private;
    performance_edl_titre: Schema.Attribute.String & Schema.Attribute.Required;
    performance_fa_titre: Schema.Attribute.String & Schema.Attribute.Required;
    performance_titre: Schema.Attribute.String & Schema.Attribute.Required;
    principes_description: Schema.Attribute.Text;
    principes_liste: Schema.Attribute.Component<'shared.vignette', true> &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    principes_titre: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    repartition_titre: Schema.Attribute.String & Schema.Attribute.Required;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    titre_principal: Schema.Attribute.String & Schema.Attribute.Required;
    titre_secondaire: Schema.Attribute.String;
    tva_description: Schema.Attribute.RichText & Schema.Attribute.Required;
    tva_titre: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPageCollectivitePageCollectivite
  extends Struct.SingleTypeSchema {
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
    artificialisation_sols: Schema.Attribute.Component<
      'contenu.indicateur',
      false
    >;
    connexion_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Se connecter'>;
    connexion_description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Vous \u00EAtes membre de cette collectivit\u00E9 ?'>;
    couverture: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    gaz_effet_serre: Schema.Attribute.Component<'contenu.indicateur', false>;
    inscription_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Cr\u00E9er un compte'>;
    inscription_description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Faites un pas suppl\u00E9mentaire vers la transition \u00E9cologique en cr\u00E9ant un compte gratuit'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::page-collectivite.page-collectivite'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPageContactPageContact extends Struct.SingleTypeSchema {
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
    couverture: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Des questions sur le programme ou sur la plateforme ? \u00C9crivez-nous et nous vous r\u00E9pondrons d\u00E8s que possible.'>;
    horaires: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Permanence de 9h \u00E0 12h30 et de 14h \u00E0 16h30, du lundi au vendredi'>;
    legende_visible: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::page-contact.page-contact'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    telephone: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'04 15 09 82 07'>;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<"Contacter l'\u00E9quipe">;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPageOutilsNumeriquePageOutilsNumerique
  extends Struct.SingleTypeSchema {
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
    accroche: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'D\u00E9couvrez ce service gratuit d\u00E9di\u00E9 \u00E0 accompagner votre collectivit\u00E9 ! '>;
    avantages: Schema.Attribute.Component<'shared.vignette', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 2;
        },
        number
      >;
    couverture: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta_contact: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<"Je contacte l'\u00E9quipe">;
    cta_demo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Je participe \u00E0 une d\u00E9mo'>;
    cta_faq: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Je consulte la FAQ'>;
    cta_inscription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Je m\u2019inscris'>;
    equipe_citation: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<"\u201CDans un environnement qui change, il n'y a pas de plus grand risque que de rester immobile.\u201D">;
    equipe_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<"D\u00E9couvrir les membres de l'\u00E9quipe">;
    equipe_description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'C\u2019est avec cette envie de faire avancer les choses que le projet Territoires en Transitions est n\u00E9. Nicolas Vall\u00E9e, intrapreneur et salari\u00E9 de l\u2019ADEME, a toujours aim\u00E9 faire bouger les lignes. C\u2019est donc dans cette optique qu\u2019il s\u2019est entour\u00E9 des meilleurs (\u00E9videmment) pour atteindre un objectif : changer le monde. Enfin, d\u00E9j\u00E0 changer le quotidien des collectivit\u00E9s pour leur permettre de r\u00E9ussir leur transition \u00E9cologique.'>;
    equipe_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Qui sommes-nous ?'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::page-outils-numerique.page-outils-numerique'
    > &
      Schema.Attribute.Private;
    panier_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<"\u00C7a m'int\u00E9resse">;
    panier_description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Vous avez besoin d'aide pour identifier des actions concr\u00E8tes adapt\u00E9es \u00E0 votre territoire ? Vous souhaitez acc\u00E9l\u00E9rer votre d\u00E9marche de transition \u00E9cologique pour votre commune ou votre intercommunalit\u00E9 ? Vous cherchez \u00E0 prioriser quelques actions cl\u00E9s \u00E0 valider avec vos \u00E9lus ?">;
    panier_image: Schema.Attribute.Media<'images'>;
    panier_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Identifiez des actions \u00E0 impact pour votre collectivit\u00E9 en moins de quelques clics'>;
    publishedAt: Schema.Attribute.DateTime;
    questions_description: Schema.Attribute.RichText &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<"N'h\u00E9sitez pas \u00E0 consulter notre FaQ ou \u00E0 nous contacter. Notre \u00E9quipe r\u00E9pond via le chat en moins de 20 minutes.">;
    questions_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Vous avez une question ?'>;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    temoignages_liste: Schema.Attribute.Relation<
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Vous cherchez un outil pour piloter vos plans d\u2019action et suivre vos indicateurs ?'>;
    trajectoire_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'En savoir plus'>;
    trajectoire_description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'La trajectoire SNBC territorialis\u00E9e n\u2019est aucunement prescriptive. C\u2019est un outil d\u2019aide \u00E0 la d\u00E9cision, un point de rep\u00E8re pour : - D\u00E9finir vos objectifs ou les interroger lorsque ceux-ci sont d\u00E9finis (par exemple \u00E0 l\u2019occasion d\u2019un suivi annuel ou d\u2019un bilan \u00E0 mi-parcours d\u2019un PCAET) - Quantifier les efforts \u00E0 r\u00E9aliser secteur par secteur - Identifier sa contribution \u00E0 la SNBC'>;
    trajectoire_image: Schema.Attribute.Media<'images'>;
    trajectoire_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Je calcule ma trajectoire SNBC territorialis\u00E9e'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url_demo: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action'>;
    url_inscription: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'https://app.territoiresentransitions.fr'>;
  };
}

export interface ApiPageProgrammePageProgramme extends Struct.SingleTypeSchema {
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
    Benefices: Schema.Attribute.Component<'bloc.description', false> &
      Schema.Attribute.Required;
    benefices_liste: Schema.Attribute.Component<
      'shared.vignette-avec-titre',
      true
    >;
    benefices_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Les b\u00E9n\u00E9fices'>;
    collectivites_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Explorer les collectivit\u00E9s'>;
    collectivites_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'De nombreuses collectivit\u00E9s d\u00E9j\u00E0 engag\u00E9es'>;
    Compte: Schema.Attribute.Component<'bloc.compte', false> &
      Schema.Attribute.Required;
    compte_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Cr\u00E9er un compte'>;
    compte_description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"- Centralisez vos donn\u00E9es et pilotez vos plans d\u2019actions - Evaluez l'impact de vos actions via vos tableaux de bord - Mesurez votre progression gr\u00E2ce aux indicateurs - R\u00E9alisez votre \u00E9tat des lieux Climat-Air-\u00C9nergie et \u00C9conomie Circulaire - Collaborez avec vos coll\u00E8gues pour le suivi des actions">;
    compte_image: Schema.Attribute.Media<'images'>;
    compte_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Cr\u00E9er un compte gratuitement sur notre service num\u00E9rique'>;
    contact_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Contactez-nous'>;
    contact_description: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Vous souhaitez en savoir plus sur le programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    Description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<"L'outil op\u00E9rationnel de planification \u00E9cologique qui met \u00E0 votre disposition une ing\u00E9nierie territoriale et un accompagnement personnalis\u00E9.">;
    Etapes: Schema.Attribute.Component<'bloc.description', false> &
      Schema.Attribute.Required;
    etapes_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'D\u00E9marrer maintenant'>;
    etapes_liste: Schema.Attribute.Component<
      'shared.vignette-avec-titre',
      true
    >;
    etapes_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Les \u00E9tapes '>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::page-programme.page-programme'
    > &
      Schema.Attribute.Private;
    Objectifs: Schema.Attribute.Component<'bloc.description', false> &
      Schema.Attribute.Required;
    objectifs_liste: Schema.Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    >;
    publishedAt: Schema.Attribute.DateTime;
    Ressources: Schema.Attribute.Component<'bloc.ressources', false> &
      Schema.Attribute.Required;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    Services: Schema.Attribute.Component<'bloc.description', false> &
      Schema.Attribute.Required;
    services_liste_rel: Schema.Attribute.Relation<
      'oneToMany',
      'api::service.service'
    >;
    services_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Composez votre offre avec des services sur-mesure'>;
    Titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<'D\u00E9couvrez le programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    VideoURL: Schema.Attribute.String;
  };
}

export interface ApiPageTrajectoirePageTrajectoire
  extends Struct.SingleTypeSchema {
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
    bloc1_image: Schema.Attribute.Media<'images'>;
    bloc1_texte: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'La m\u00E9thodogie permettant de calculer votre trajectoire SNBC territorialis\u00E9e a \u00E9t\u00E9 d\u00E9velopp\u00E9e pour l\u2019ADEME par Solagro et l\u2019Institut Negawatt. Fruit d\u2019un travail de 18 mois avec la contribution de 13 collectivit\u00E9s pilotes volontaires, elle a permis de construire une m\u00E9thode de r\u00E9f\u00E9rence pour aider les territoires \u00E0 d\u00E9finir et \u00E0 interroger leur trajectoire bas-carbone.'>;
    bloc1_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Une m\u00E9thode de r\u00E9f\u00E9rence'>;
    bloc2_image: Schema.Attribute.Media<'images'>;
    bloc2_texte: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'La trajectoire SNBC territorialis\u00E9e n\u2019est aucunement prescriptive. C\u2019est un outil d\u2019aide \u00E0 la d\u00E9cision, un point de rep\u00E8re pour : - D\u00E9finir vos objectifs ou les interroger lorsque ceux-ci sont d\u00E9finis (par exemple \u00E0 l\u2019occasion d\u2019un suivi annuel ou d\u2019un bilan \u00E0 mi-parcours d\u2019un PCAET) - Quantifier les efforts \u00E0 r\u00E9aliser secteur par secteur - Identifier sa contribution \u00E0 la SNBC'>;
    bloc2_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Un outil d\u2019aide \u00E0 la d\u00E9cision : pas un engagement contractuel'>;
    calcul_description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'\uD83D\uDC49 La trajectoire SNBC territorialis\u00E9e est disponible sous deux formes, en fonction de votre besoin et de votre temps disponible'>;
    calcul_liste: Schema.Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    > &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 2;
        },
        number
      >;
    calcul_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'2 modes de calcul disponibles, adapt\u00E9 \u00E0 votre besoin'>;
    couverture: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    cta_connexion: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Je me connecte pour en profiter'>;
    documentation_description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Retrouvez ici les principaux documents de l\u2019\u00E9tude pilot\u00E9e par l\u2019ADEME pour d\u00E9finir cette trajectoire SNBC territorialis\u00E9e'>;
    documentation_excel: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Mod\u00E8le de calcul de la trajectoire SNBC territorialis\u00E9e. Le fichier a \u00E9t\u00E9 con\u00E7u pour \u00EAtre autoporteur. Nous vous recommandons de vous approprier le fichier et la m\u00E9thode en d\u00E9butant par les onglets \u201CIntroduction\u201D et \u201CNotice\u201D.'>;
    documentation_info: Schema.Attribute.RichText &
      Schema.Attribute.DefaultTo<'Nous vous recommandons d\u2019utiliser la plateforme depuis le compte de votre collectivit\u00E9 pour gagner du temps. Le mode int\u00E9gr\u00E9 \u00E0 la plateforme vous permettra d\u2019acc\u00E9der \u00E0 une visualisation plus confortable. L\u2019Excel t\u00E9l\u00E9charg\u00E9 depuis votre espace vous permettra de disposer du mod\u00E8le de calcul avec vos donn\u00E9es renseign\u00E9es'>;
    documentation_pdf: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Document d\u00E9taillant la m\u00E9thodologie appliqu\u00E9e pour territorialiser la SNBC. Il pr\u00E9sente les \u00E9tapes cl\u00E9s, les outils et les approches utilis\u00E9s pour adapter les objectifs nationaux aux territoires.'>;
    documentation_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Documentation et mod\u00E8le de calcul'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::page-trajectoire.page-trajectoire'
    > &
      Schema.Attribute.Private;
    methode_description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Exemple - pour le secteur r\u00E9sidentiel, les pivots de territorialisation sont :'>;
    methode_exemples: Schema.Attribute.Component<'shared.vignette', true> &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 2;
        },
        number
      >;
    methode_image: Schema.Attribute.Media<'images'>;
    methode_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<"La m\u00E9thode s'appuie, pour chaque secteur, sur des pivots de territorialisation qui d\u00E9terminent la contribution du territoire \u00E0 la SNBC.">;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    temoignages_liste: Schema.Attribute.Relation<
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Territorialisation de la SNBC pour votre collectivit\u00E9'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webinaire_cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Schema.Attribute.DefaultTo<'Je m\u2019inscris'>;
    webinaire_description: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'D\u00E9couvrez comment la trajectoire SNBC territorialis\u00E9e peut vous aider \u00E0 valider vos objectifs. Inscrivez-vous \u00E0 nos webinaires pour une pr\u00E9sentation d\u00E9taill\u00E9e, des d\u00E9monstrations en direct et des sessions de questions-r\u00E9ponses avec nos experts'>;
    webinaire_titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Schema.Attribute.DefaultTo<'Webinaire de pr\u00E9sentation'>;
    webinaire_url: Schema.Attribute.String;
  };
}

export interface ApiServiceService extends Struct.CollectionTypeSchema {
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
    contenu: Schema.Attribute.DynamicZone<
      ['services.paragraphe', 'services.liste', 'services.info']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String & Schema.Attribute.Required;
    description_markdown: Schema.Attribute.RichText &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 1500;
      }>;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service.service'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo', false>;
    sous_page: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    titre: Schema.Attribute.String & Schema.Attribute.Required;
    uid: Schema.Attribute.UID<'titre'> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTemoignageTemoignage extends Struct.CollectionTypeSchema {
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
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    identifiant: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::temoignage.temoignage'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    temoignage: Schema.Attribute.Component<'shared.temoignage', false> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
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
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
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
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
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
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
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
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
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
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
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
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
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
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
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
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
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
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
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
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
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
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
