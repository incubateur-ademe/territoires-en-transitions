import type { Schema, Attribute } from '@strapi/strapi';

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    name: 'Permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
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
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    name: 'User';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
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
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    username: Attribute.String;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    registrationToken: Attribute.String & Attribute.Private;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    preferedLanguage: Attribute.String;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    name: 'Role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    name: 'Api Token';
    singularName: 'api-token';
    pluralName: 'api-tokens';
    displayName: 'Api Token';
    description: '';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    name: 'API Token Permission';
    description: '';
    singularName: 'api-token-permission';
    pluralName: 'api-token-permissions';
    displayName: 'API Token Permission';
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
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    name: 'Transfer Token';
    singularName: 'transfer-token';
    pluralName: 'transfer-tokens';
    displayName: 'Transfer Token';
    description: '';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    lastUsedAt: Attribute.DateTime;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    expiresAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    name: 'Transfer Token Permission';
    description: '';
    singularName: 'transfer-token-permission';
    pluralName: 'transfer-token-permissions';
    displayName: 'Transfer Token Permission';
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
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    singularName: 'file';
    pluralName: 'files';
    displayName: 'File';
    description: '';
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
    name: Attribute.String & Attribute.Required;
    alternativeText: Attribute.String;
    caption: Attribute.String;
    width: Attribute.Integer;
    height: Attribute.Integer;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    ext: Attribute.String;
    mime: Attribute.String & Attribute.Required;
    size: Attribute.Decimal & Attribute.Required;
    url: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<{
        min: 1;
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    singularName: 'folder';
    pluralName: 'folders';
    displayName: 'Folder';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
      }>;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginReactIconsIconlibrary extends Schema.CollectionType {
  collectionName: 'iconlibrary';
  info: {
    singularName: 'iconlibrary';
    pluralName: 'iconlibraries';
    displayName: 'IconLibrary';
  };
  options: {
    draftAndPublish: false;
    comment: '';
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
    name: Attribute.String & Attribute.Required;
    abbreviation: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        maxLength: 3;
      }>;
    isEnabled: Attribute.Boolean & Attribute.DefaultTo<true>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::react-icons.iconlibrary',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::react-icons.iconlibrary',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    singularName: 'locale';
    pluralName: 'locales';
    collectionName: 'locales';
    displayName: 'Locale';
    description: '';
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
    name: Attribute.String &
      Attribute.SetMinMax<{
        min: 1;
        max: 50;
      }>;
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
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
    name: 'permission';
    description: '';
    singularName: 'permission';
    pluralName: 'permissions';
    displayName: 'Permission';
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
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    name: 'role';
    description: '';
    singularName: 'role';
    pluralName: 'roles';
    displayName: 'Role';
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
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    description: Attribute.String;
    type: Attribute.String & Attribute.Unique;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    name: 'user';
    description: '';
    singularName: 'user';
    pluralName: 'users';
    displayName: 'User';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    resetPasswordToken: Attribute.String & Attribute.Private;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiActualiteActualite extends Schema.CollectionType {
  collectionName: 'actualites';
  info: {
    singularName: 'actualite';
    pluralName: 'actualites';
    displayName: 'Actualit\u00E9s';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    DateCreation: Attribute.DateTime;
    Epingle: Attribute.Boolean & Attribute.DefaultTo<false>;
    Couverture: Attribute.Media & Attribute.Required;
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
        'contenu.info'
      ]
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::actualite.actualite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::actualite.actualite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCollectiviteCollectivite extends Schema.CollectionType {
  collectionName: 'collectivites';
  info: {
    singularName: 'collectivite';
    pluralName: 'collectivites';
    displayName: 'Collectivit\u00E9s';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    nom: Attribute.String & Attribute.Required & Attribute.Unique;
    code_siren_insee: Attribute.String & Attribute.Required & Attribute.Unique;
    logo: Attribute.Media;
    couverture: Attribute.Media;
    url: Attribute.String;
    video_url: Attribute.String;
    video_en_haut: Attribute.Boolean &
      Attribute.Required &
      Attribute.DefaultTo<false>;
    temoignages: Attribute.Component<'shared.temoignage', true> &
      Attribute.SetMinMax<{
        min: 1;
        max: 3;
      }>;
    actions: Attribute.Component<'contenu.texte-collectivite', true> &
      Attribute.SetMinMax<{
        min: 1;
        max: 4;
      }>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::collectivite.collectivite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::collectivite.collectivite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiConseillerConseiller extends Schema.CollectionType {
  collectionName: 'conseillers';
  info: {
    singularName: 'conseiller';
    pluralName: 'conseillers';
    displayName: 'Conseillers';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    prenom: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    nom: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    structure: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    region: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    ville: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
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
    site: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    photo: Attribute.Media;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::conseiller.conseiller',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::conseiller.conseiller',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiFaqFaq extends Schema.CollectionType {
  collectionName: 'faqs';
  info: {
    singularName: 'faq';
    pluralName: 'faqs';
    displayName: 'FAQ';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    Rang: Attribute.Integer & Attribute.Unique;
    Titre: Attribute.String & Attribute.Required;
    Contenu: Attribute.RichText & Attribute.Required;
    onglet: Attribute.Enumeration<
      ['Le programme Territoire Engag\u00E9', "L'outil num\u00E9rique"]
    > &
      Attribute.Required &
      Attribute.DefaultTo<'Le programme Territoire Engag\u00E9'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::faq.faq', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    updatedBy: Attribute.Relation<'api::faq.faq', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiPageAccueilPageAccueil extends Schema.SingleType {
  collectionName: 'page_accueils';
  info: {
    singularName: 'page-accueil';
    pluralName: 'page-accueils';
    displayName: '1. Accueil';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    couverture_desktop: Attribute.Media & Attribute.Required;
    couverture_mobile: Attribute.Media;
    accueil_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Une offre compl\u00E8te pour un seul objectif : votre transition \u00E9cologique'>;
    accueil_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Votre territoire est unique. Avancez \u00E9tape par \u00E9tape dans la transition \u00E9cologique selon vos comp\u00E9tences et vos moyens.'>;
    programme: Attribute.Component<'shared.vignette-avec-cta'> &
      Attribute.Required;
    plateforme: Attribute.Component<'shared.vignette-avec-cta'> &
      Attribute.Required;
    objectifs_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Pourquoi engager votre collectivit\u00E9 ?'>;
    objectifs_liste: Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    > &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 5;
        max: 5;
      }>;
    collectivites_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Rejoignez une communaut\u00E9 de collectivit\u00E9s engag\u00E9es'>;
    collectivites_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Explorer les collectivit\u00E9s'>;
    contact_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"Vous souhaitez agir mais n'\u00EAtes pas s\u00FBr de ce qu'il vous faut ?">;
    contact_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je souhaite \u00EAtre recontact\u00E9'>;
    temoignages_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Rejoignez une communaut\u00E9 de collectivit\u00E9s engag\u00E9es'>;
    temoignages_liste: Attribute.Relation<
      'api::page-accueil.page-accueil',
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    newsletter_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Suivez les actualit\u00E9s du programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    newsletter_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Infolettre trimestrielle - 1 email par mois maximum.'>;
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
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 100;
      }> &
      Attribute.DefaultTo<'Acc\u00E9l\u00E9rez la transition \u00E9cologique de votre collectivit\u00E9'>;
    Couverture: Attribute.Media;
    Accompagnement: Attribute.Component<'bloc.accompagnement'> &
      Attribute.Required;
    Temoignages: Attribute.Component<'bloc.description'> & Attribute.Required;
    Informations: Attribute.Component<'bloc.description'> & Attribute.Required;
    Newsletter: Attribute.Component<'bloc.description'> & Attribute.Required;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-accueil.page-accueil',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    singularName: 'page-budget';
    pluralName: 'page-budgets';
    displayName: '6. Budget';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    titre_secondaire: Attribute.String;
    titre_principal: Attribute.String & Attribute.Required;
    description: Attribute.Text & Attribute.Required;
    fonctionnement_titre: Attribute.String & Attribute.Required;
    fonctionnement_description: Attribute.RichText & Attribute.Required;
    principes_titre: Attribute.String & Attribute.Required;
    principes_description: Attribute.Text;
    principes_liste: Attribute.Component<'shared.vignette', true> &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
        max: 5;
      }>;
    budget_titre: Attribute.String & Attribute.Required;
    budget_description: Attribute.RichText & Attribute.Required;
    budget_tableau: Attribute.JSON & Attribute.Required;
    repartition_titre: Attribute.String & Attribute.Required;
    description_titre: Attribute.String & Attribute.Required;
    description_liste: Attribute.Component<
      'shared.vignette-avec-markdown',
      true
    > &
      Attribute.SetMinMax<{
        min: 1;
      }>;
    tva_titre: Attribute.String & Attribute.Required;
    tva_description: Attribute.RichText & Attribute.Required;
    performance_titre: Attribute.String & Attribute.Required;
    performance_edl_titre: Attribute.String & Attribute.Required;
    performance_fa_titre: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-budget.page-budget',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    singularName: 'page-collectivite';
    pluralName: 'page-collectivites';
    displayName: '4. Collectivit\u00E9';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    couverture: Attribute.Media & Attribute.Required;
    inscription_description: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Faites un pas suppl\u00E9mentaire vers la transition \u00E9cologique en cr\u00E9ant un compte gratuit'>;
    inscription_cta: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Cr\u00E9er un compte'>;
    connexion_description: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Vous \u00EAtes membre de cette collectivit\u00E9 ?'>;
    connexion_cta: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'Se connecter'>;
    gaz_effet_serre: Attribute.Component<'contenu.indicateur'>;
    artificialisation_sols: Attribute.Component<'contenu.indicateur'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-collectivite.page-collectivite',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    singularName: 'page-contact';
    pluralName: 'page-contacts';
    displayName: '5. Contact';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"Contacter l'\u00E9quipe">;
    description: Attribute.Text &
      Attribute.DefaultTo<'Des questions sur le programme ou sur la plateforme ? \u00C9crivez-nous et nous vous r\u00E9pondrons d\u00E8s que possible.'>;
    couverture: Attribute.Media;
    telephone: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'04 15 09 82 07'>;
    horaires: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Permanence de 9h \u00E0 12h30 et de 14h \u00E0 16h30, du lundi au vendredi'>;
    legende_visible: Attribute.Boolean & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-contact.page-contact',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    singularName: 'page-outils-numerique';
    pluralName: 'page-outils-numeriques';
    displayName: '3. Outils num\u00E9rique';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Vous cherchez un outil pour piloter vos plans d\u2019action et suivre vos indicateurs ?'>;
    accroche: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'D\u00E9couvrez ce service gratuit d\u00E9di\u00E9 \u00E0 accompagner votre collectivit\u00E9 ! '>;
    cta_inscription: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je m\u2019inscris'>;
    url_inscription: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://app.territoiresentransitions.fr'>;
    cta_demo: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je participe \u00E0 une d\u00E9mo'>;
    url_demo: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://calendly.com/territoiresentransitions/demo-fonctionnalite-plans-d-action'>;
    couverture: Attribute.Media & Attribute.Required;
    avantages: Attribute.Component<'shared.vignette', true> &
      Attribute.SetMinMax<{
        min: 2;
        max: 4;
      }>;
    panier_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Identifiez des actions \u00E0 impact pour votre collectivit\u00E9 en moins de quelques clics'>;
    panier_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<"Vous avez besoin d'aide pour identifier des actions concr\u00E8tes adapt\u00E9es \u00E0 votre territoire ? Vous souhaitez acc\u00E9l\u00E9rer votre d\u00E9marche de transition \u00E9cologique pour votre commune ou votre intercommunalit\u00E9 ? Vous cherchez \u00E0 prioriser quelques actions cl\u00E9s \u00E0 valider avec vos \u00E9lus ?">;
    panier_image: Attribute.Media;
    panier_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<"\u00C7a m'int\u00E9resse">;
    trajectoire_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Je calcule ma trajectoire SNBC territorialis\u00E9e'>;
    trajectoire_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'La trajectoire SNBC territorialis\u00E9e n\u2019est aucunement prescriptive. C\u2019est un outil d\u2019aide \u00E0 la d\u00E9cision, un point de rep\u00E8re pour : - D\u00E9finir vos objectifs ou les interroger lorsque ceux-ci sont d\u00E9finis (par exemple \u00E0 l\u2019occasion d\u2019un suivi annuel ou d\u2019un bilan \u00E0 mi-parcours d\u2019un PCAET) - Quantifier les efforts \u00E0 r\u00E9aliser secteur par secteur - Identifier sa contribution \u00E0 la SNBC'>;
    trajectoire_image: Attribute.Media;
    trajectoire_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'En savoir plus'>;
    temoignages_liste: Attribute.Relation<
      'api::page-outils-numerique.page-outils-numerique',
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    equipe_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Qui sommes-nous ?'>;
    equipe_citation: Attribute.Text &
      Attribute.DefaultTo<"\u201CDans un environnement qui change, il n'y a pas de plus grand risque que de rester immobile.\u201D">;
    equipe_description: Attribute.Text &
      Attribute.DefaultTo<'C\u2019est avec cette envie de faire avancer les choses que le projet Territoires en Transitions est n\u00E9. Nicolas Vall\u00E9e, intrapreneur et salari\u00E9 de l\u2019ADEME, a toujours aim\u00E9 faire bouger les lignes. C\u2019est donc dans cette optique qu\u2019il s\u2019est entour\u00E9 des meilleurs (\u00E9videmment) pour atteindre un objectif : changer le monde. Enfin, d\u00E9j\u00E0 changer le quotidien des collectivit\u00E9s pour leur permettre de r\u00E9ussir leur transition \u00E9cologique.'>;
    equipe_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<"D\u00E9couvrir les membres de l'\u00E9quipe">;
    questions_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Vous avez une question ?'>;
    questions_description: Attribute.RichText &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"N'h\u00E9sitez pas \u00E0 consulter notre FaQ ou \u00E0 nous contacter. Notre \u00E9quipe r\u00E9pond via le chat en moins de 20 minutes.">;
    cta_faq: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je consulte la FAQ'>;
    cta_contact: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<"Je contacte l'\u00E9quipe">;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-outils-numerique.page-outils-numerique',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::page-outils-numerique.page-outils-numerique',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPageProgrammePageProgramme extends Schema.SingleType {
  collectionName: 'page_programmes';
  info: {
    singularName: 'page-programme';
    pluralName: 'page-programmes';
    displayName: '2. Programme';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Attribute.DefaultTo<'D\u00E9couvrez le programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    Description: Attribute.Text &
      Attribute.DefaultTo<"L'outil op\u00E9rationnel de planification \u00E9cologique qui met \u00E0 votre disposition une ing\u00E9nierie territoriale et un accompagnement personnalis\u00E9.">;
    VideoURL: Attribute.String;
    benefices_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Les b\u00E9n\u00E9fices'>;
    benefices_liste: Attribute.Component<'shared.vignette-avec-titre', true>;
    contact_description: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Vous souhaitez en savoir plus sur le programme Territoire Engag\u00E9 Transition \u00C9cologique'>;
    contact_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Contactez-nous'>;
    etapes_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Les \u00E9tapes '>;
    etapes_liste: Attribute.Component<'shared.vignette-avec-titre', true>;
    etapes_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'D\u00E9marrer maintenant'>;
    services_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Composez votre offre avec des services sur-mesure'>;
    services_liste_rel: Attribute.Relation<
      'api::page-programme.page-programme',
      'oneToMany',
      'api::service.service'
    >;
    collectivites_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'De nombreuses collectivit\u00E9s d\u00E9j\u00E0 engag\u00E9es'>;
    collectivites_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Explorer les collectivit\u00E9s'>;
    compte_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Cr\u00E9er un compte gratuitement sur notre service num\u00E9rique'>;
    compte_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<"- Centralisez vos donn\u00E9es et pilotez vos plans d\u2019actions - Evaluez l'impact de vos actions via vos tableaux de bord - Mesurez votre progression gr\u00E2ce aux indicateurs - R\u00E9alisez votre \u00E9tat des lieux Climat-Air-\u00C9nergie et \u00C9conomie Circulaire - Collaborez avec vos coll\u00E8gues pour le suivi des actions">;
    compte_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Cr\u00E9er un compte'>;
    compte_image: Attribute.Media;
    Objectifs: Attribute.Component<'bloc.description'> & Attribute.Required;
    objectifs_liste: Attribute.Component<'shared.vignette-avec-markdown', true>;
    Services: Attribute.Component<'bloc.description'> & Attribute.Required;
    Compte: Attribute.Component<'bloc.compte'> & Attribute.Required;
    Etapes: Attribute.Component<'bloc.description'> & Attribute.Required;
    Ressources: Attribute.Component<'bloc.ressources'> & Attribute.Required;
    Benefices: Attribute.Component<'bloc.description'> & Attribute.Required;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-programme.page-programme',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::page-programme.page-programme',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPageTrajectoirePageTrajectoire extends Schema.SingleType {
  collectionName: 'page_trajectoires';
  info: {
    singularName: 'page-trajectoire';
    pluralName: 'page-trajectoires';
    displayName: '3.1. Trajectoires';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Territorialisation de la SNBC pour votre collectivit\u00E9'>;
    couverture: Attribute.Media & Attribute.Required;
    cta_connexion: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je me connecte pour en profiter'>;
    bloc1_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Une m\u00E9thode de r\u00E9f\u00E9rence'>;
    bloc1_texte: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'La m\u00E9thodogie permettant de calculer votre trajectoire SNBC territorialis\u00E9e a \u00E9t\u00E9 d\u00E9velopp\u00E9e pour l\u2019ADEME par Solagro et l\u2019Institut Negawatt. Fruit d\u2019un travail de 18 mois avec la contribution de 13 collectivit\u00E9s pilotes volontaires, elle a permis de construire une m\u00E9thode de r\u00E9f\u00E9rence pour aider les territoires \u00E0 d\u00E9finir et \u00E0 interroger leur trajectoire bas-carbone.'>;
    bloc1_image: Attribute.Media;
    bloc2_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Un outil d\u2019aide \u00E0 la d\u00E9cision : pas un engagement contractuel'>;
    bloc2_texte: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'La trajectoire SNBC territorialis\u00E9e n\u2019est aucunement prescriptive. C\u2019est un outil d\u2019aide \u00E0 la d\u00E9cision, un point de rep\u00E8re pour : - D\u00E9finir vos objectifs ou les interroger lorsque ceux-ci sont d\u00E9finis (par exemple \u00E0 l\u2019occasion d\u2019un suivi annuel ou d\u2019un bilan \u00E0 mi-parcours d\u2019un PCAET) - Quantifier les efforts \u00E0 r\u00E9aliser secteur par secteur - Identifier sa contribution \u00E0 la SNBC'>;
    bloc2_image: Attribute.Media;
    methode_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<"La m\u00E9thode s'appuie, pour chaque secteur, sur des pivots de territorialisation qui d\u00E9terminent la contribution du territoire \u00E0 la SNBC.">;
    methode_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'Exemple - pour le secteur r\u00E9sidentiel, les pivots de territorialisation sont :'>;
    methode_exemples: Attribute.Component<'shared.vignette', true> &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 2;
      }>;
    methode_image: Attribute.Media;
    webinaire_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Webinaire de pr\u00E9sentation'>;
    webinaire_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'D\u00E9couvrez comment la trajectoire SNBC territorialis\u00E9e peut vous aider \u00E0 valider vos objectifs. Inscrivez-vous \u00E0 nos webinaires pour une pr\u00E9sentation d\u00E9taill\u00E9e, des d\u00E9monstrations en direct et des sessions de questions-r\u00E9ponses avec nos experts'>;
    webinaire_cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }> &
      Attribute.DefaultTo<'Je m\u2019inscris'>;
    webinaire_url: Attribute.String;
    calcul_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'2 modes de calcul disponibles, adapt\u00E9 \u00E0 votre besoin'>;
    calcul_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'\uD83D\uDC49 La trajectoire SNBC territorialis\u00E9e est disponible sous deux formes, en fonction de votre besoin et de votre temps disponible'>;
    calcul_liste: Attribute.Component<'shared.vignette-avec-markdown', true> &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 2;
      }>;
    temoignages_liste: Attribute.Relation<
      'api::page-trajectoire.page-trajectoire',
      'oneToMany',
      'api::temoignage.temoignage'
    >;
    documentation_titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }> &
      Attribute.DefaultTo<'Documentation et mod\u00E8le de calcul'>;
    documentation_description: Attribute.RichText &
      Attribute.Required &
      Attribute.DefaultTo<'Retrouvez ici les principaux documents de l\u2019\u00E9tude pilot\u00E9e par l\u2019ADEME pour d\u00E9finir cette trajectoire SNBC territorialis\u00E9e'>;
    documentation_info: Attribute.RichText &
      Attribute.DefaultTo<'Nous vous recommandons d\u2019utiliser la plateforme depuis le compte de votre collectivit\u00E9 pour gagner du temps. Le mode int\u00E9gr\u00E9 \u00E0 la plateforme vous permettra d\u2019acc\u00E9der \u00E0 une visualisation plus confortable. L\u2019Excel t\u00E9l\u00E9charg\u00E9 depuis votre espace vous permettra de disposer du mod\u00E8le de calcul avec vos donn\u00E9es renseign\u00E9es'>;
    documentation_excel: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'Mod\u00E8le de calcul de la trajectoire SNBC territorialis\u00E9e. Le fichier a \u00E9t\u00E9 con\u00E7u pour \u00EAtre autoporteur. Nous vous recommandons de vous approprier le fichier et la m\u00E9thode en d\u00E9butant par les onglets \u201CIntroduction\u201D et \u201CNotice\u201D.'>;
    documentation_pdf: Attribute.Text &
      Attribute.Required &
      Attribute.DefaultTo<'Document d\u00E9taillant la m\u00E9thodologie appliqu\u00E9e pour territorialiser la SNBC. Il pr\u00E9sente les \u00E9tapes cl\u00E9s, les outils et les approches utilis\u00E9s pour adapter les objectifs nationaux aux territoires.'>;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::page-trajectoire.page-trajectoire',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::page-trajectoire.page-trajectoire',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiServiceService extends Schema.CollectionType {
  collectionName: 'services';
  info: {
    singularName: 'service';
    pluralName: 'services';
    displayName: 'Services';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    seo: Attribute.Component<'shared.seo'>;
    uid: Attribute.UID<'api::service.service', 'titre'> & Attribute.Required;
    titre: Attribute.String & Attribute.Required;
    description: Attribute.String & Attribute.Required;
    description_markdown: Attribute.RichText &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 1500;
      }>;
    image: Attribute.Media & Attribute.Required;
    sous_page: Attribute.Boolean & Attribute.DefaultTo<false>;
    contenu: Attribute.DynamicZone<
      ['services.paragraphe', 'services.liste', 'services.info']
    >;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::service.service',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
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
    singularName: 'temoignage';
    pluralName: 'temoignages';
    displayName: 'T\u00E9moignages';
    description: '';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    temoignage: Attribute.Component<'shared.temoignage'> & Attribute.Required;
    identifiant: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique;
    createdAt: Attribute.DateTime;
    updatedAt: Attribute.DateTime;
    publishedAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::temoignage.temoignage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedBy: Attribute.Relation<
      'api::temoignage.temoignage',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::permission': AdminPermission;
      'admin::user': AdminUser;
      'admin::role': AdminRole;
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::react-icons.iconlibrary': PluginReactIconsIconlibrary;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
      'api::actualite.actualite': ApiActualiteActualite;
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
    }
  }
}
