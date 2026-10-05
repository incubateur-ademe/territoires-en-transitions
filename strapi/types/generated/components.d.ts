import type { Schema, Struct } from '@strapi/strapi';

export interface ContenuBoutonGroupe extends Struct.ComponentSchema {
  collectionName: 'components_shared_bouton_groupes';
  info: {
    description: '';
    displayName: 'Boutons';
    icon: 'link';
  };
  attributes: {
    boutons: Schema.Attribute.Component<'shared.bouton', true> &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
  };
}

export interface ContenuGallerie extends Struct.ComponentSchema {
  collectionName: 'components_contenu_galleries';
  info: {
    description: '';
    displayName: 'Gallerie';
    icon: 'grid';
  };
  attributes: {
    Gallerie: Schema.Attribute.Media<'images', true> &
      Schema.Attribute.Required;
    Legende: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    LegendeVisible: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    NombreColonnes: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<2>;
  };
}

export interface ContenuImage extends Struct.ComponentSchema {
  collectionName: 'components_contenu_images';
  info: {
    description: '';
    displayName: 'Image';
    icon: 'landscape';
  };
  attributes: {
    Image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    LegendeVisible: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface ContenuIndicateur extends Struct.ComponentSchema {
  collectionName: 'components_contenu_indicateurs';
  info: {
    description: '';
    displayName: 'Indicateur';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    description_encadre: Schema.Attribute.Text & Schema.Attribute.Required;
    details: Schema.Attribute.RichText;
    illustration_encadre: Schema.Attribute.Media<'images'> &
      Schema.Attribute.Required;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre_encadre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ContenuInfo extends Struct.ComponentSchema {
  collectionName: 'components_contenu_infos';
  info: {
    displayName: 'Info';
    icon: 'information';
  };
  attributes: {
    Texte: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface ContenuParagraphe extends Struct.ComponentSchema {
  collectionName: 'components_contenu_paragraphes';
  info: {
    description: '';
    displayName: 'Paragraphe';
    icon: 'file';
  };
  attributes: {
    AlignementImage: Schema.Attribute.Enumeration<
      ['Gauche', 'Droite', 'Centre Bas', 'Centre Haut']
    > &
      Schema.Attribute.DefaultTo<'Centre Bas'>;
    Image: Schema.Attribute.Media<'images'>;
    LegendeVisible: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    Texte: Schema.Attribute.RichText;
    Titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ContenuTexteCollectivite extends Struct.ComponentSchema {
  collectionName: 'components_contenu_texte_collectivites';
  info: {
    description: '';
    displayName: 'TexteCollectivite';
  };
  attributes: {
    contenu: Schema.Attribute.RichText & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ContenuVideo extends Struct.ComponentSchema {
  collectionName: 'components_contenu_videos';
  info: {
    description: '';
    displayName: 'Video';
    icon: 'play';
  };
  attributes: {
    URL: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ServicesCarte extends Struct.ComponentSchema {
  collectionName: 'components_services_cartes';
  info: {
    description: '';
    displayName: 'carte';
    icon: 'grid';
  };
  attributes: {
    boutons: Schema.Attribute.Component<'shared.bouton', true> &
      Schema.Attribute.SetMinMax<
        {
          max: 2;
        },
        number
      >;
    image: Schema.Attribute.Media<'images'>;
    pre_titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    texte: Schema.Attribute.RichText & Schema.Attribute.Required;
    titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ServicesInfo extends Struct.ComponentSchema {
  collectionName: 'components_services_infos';
  info: {
    description: '';
    displayName: 'info';
    icon: 'information';
  };
  attributes: {
    boutons: Schema.Attribute.Component<'shared.bouton', true>;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ServicesListe extends Struct.ComponentSchema {
  collectionName: 'components_services_listes';
  info: {
    description: '';
    displayName: 'liste';
    icon: 'bulletList';
  };
  attributes: {
    disposition_cartes: Schema.Attribute.Enumeration<
      ['Gallerie', 'Grille', 'Verticale', 'Vignettes']
    > &
      Schema.Attribute.Required;
    introduction: Schema.Attribute.RichText;
    liste: Schema.Attribute.Component<'services.carte', true>;
    sous_titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    taille_liste: Schema.Attribute.Enumeration<['md', 'lg']> &
      Schema.Attribute.DefaultTo<'lg'>;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ServicesParagraphe extends Struct.ComponentSchema {
  collectionName: 'components_services_paragraphes';
  info: {
    description: '';
    displayName: 'paragraphe';
    icon: 'layer';
  };
  attributes: {
    alignement_image_droite: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    image_titre: Schema.Attribute.Media<'images'>;
    images: Schema.Attribute.Media<'images', true>;
    sous_titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    taille_image_titre: Schema.Attribute.Enumeration<['sm', 'md', 'lg']> &
      Schema.Attribute.DefaultTo<'sm'>;
    taille_paragraphe: Schema.Attribute.Enumeration<['md', 'lg']> &
      Schema.Attribute.DefaultTo<'lg'>;
    texte: Schema.Attribute.RichText;
    titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre_centre: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedBouton extends Struct.ComponentSchema {
  collectionName: 'components_shared_boutons';
  info: {
    displayName: 'bouton';
  };
  attributes: {
    label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    url: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedParagraphe extends Struct.ComponentSchema {
  collectionName: 'components_shared_paragraphes';
  info: {
    displayName: 'paragraphe';
    icon: 'layer';
  };
  attributes: {
    contenu: Schema.Attribute.RichText & Schema.Attribute.Required;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 50;
      }>;
    metaImage: Schema.Attribute.Media<'images'>;
    metaTitle: Schema.Attribute.String;
  };
}

export interface SharedTemoignage extends Struct.ComponentSchema {
  collectionName: 'components_shared_temoignages';
  info: {
    description: '';
    displayName: 'temoignage';
    icon: 'discuss';
  };
  attributes: {
    auteur: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    portrait: Schema.Attribute.Media<'images'>;
    role: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    temoignage: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 700;
      }>;
  };
}

export interface SharedVignette extends Struct.ComponentSchema {
  collectionName: 'components_shared_vignettes';
  info: {
    displayName: 'vignette';
    icon: 'landscape';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    legende: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedVignetteAvecCta extends Struct.ComponentSchema {
  collectionName: 'components_shared_vignette_avec_ctas';
  info: {
    displayName: 'vignette_avec_cta';
  };
  attributes: {
    cta: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    legende: Schema.Attribute.RichText & Schema.Attribute.Required;
    titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedVignetteAvecDetails extends Struct.ComponentSchema {
  collectionName: 'components_shared_vignette_avec_details';
  info: {
    description: '';
    displayName: 'vignette_avec_details';
  };
  attributes: {
    details_cta: Schema.Attribute.Component<'shared.bouton', false>;
    details_texte: Schema.Attribute.RichText & Schema.Attribute.Required;
    details_titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    image: Schema.Attribute.Media<'images'>;
    legende: Schema.Attribute.RichText & Schema.Attribute.Required;
    titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedVignetteAvecMarkdown extends Struct.ComponentSchema {
  collectionName: 'components_shared_vignette_avec_markdowns';
  info: {
    description: '';
    displayName: 'vignette_avec_markdown';
    icon: 'layout';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    legende: Schema.Attribute.RichText;
    titre: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedVignetteAvecTitre extends Struct.ComponentSchema {
  collectionName: 'components_shared_vignette_avec_titres';
  info: {
    description: '';
    displayName: 'vignette_avec_titre';
    icon: 'landscape';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    legende: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'contenu.bouton-groupe': ContenuBoutonGroupe;
      'contenu.gallerie': ContenuGallerie;
      'contenu.image': ContenuImage;
      'contenu.indicateur': ContenuIndicateur;
      'contenu.info': ContenuInfo;
      'contenu.paragraphe': ContenuParagraphe;
      'contenu.texte-collectivite': ContenuTexteCollectivite;
      'contenu.video': ContenuVideo;
      'services.carte': ServicesCarte;
      'services.info': ServicesInfo;
      'services.liste': ServicesListe;
      'services.paragraphe': ServicesParagraphe;
      'shared.bouton': SharedBouton;
      'shared.paragraphe': SharedParagraphe;
      'shared.seo': SharedSeo;
      'shared.temoignage': SharedTemoignage;
      'shared.vignette': SharedVignette;
      'shared.vignette-avec-cta': SharedVignetteAvecCta;
      'shared.vignette-avec-details': SharedVignetteAvecDetails;
      'shared.vignette-avec-markdown': SharedVignetteAvecMarkdown;
      'shared.vignette-avec-titre': SharedVignetteAvecTitre;
    }
  }
}
