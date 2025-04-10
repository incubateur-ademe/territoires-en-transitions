import type { Schema, Struct } from '@strapi/strapi';

export interface BlocAccompagnement extends Struct.ComponentSchema {
  collectionName: 'components_bloc_accompagnements';
  info: {
    description: '';
    displayName: 'Accompagnement';
  };
  attributes: {
    Compte: Schema.Attribute.Component<'bloc.description-avec-image', false> &
      Schema.Attribute.Required;
    Description: Schema.Attribute.Text &
      Schema.Attribute.DefaultTo<'Votre territoire est unique. Avancez \u00E9tape par \u00E9tape dans la transition \u00E9cologique selon vos comp\u00E9tences et vos moyens avec le programme Territoire Engag\u00E9 Transition \u00C9cologique.'>;
    Programme: Schema.Attribute.Component<
      'bloc.description-avec-image',
      false
    > &
      Schema.Attribute.Required;
    Titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<'B\u00E9n\u00E9ficiez d\u2019un accompagnement adapt\u00E9 \u00E0 vos besoins'>;
  };
}

export interface BlocCompte extends Struct.ComponentSchema {
  collectionName: 'components_bloc_comptes';
  info: {
    description: '';
    displayName: 'Compte';
  };
  attributes: {
    Description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<'Cr\u00E9er un compte  sur notre plateforme num\u00E9rique : '>;
  };
}

export interface BlocDescription extends Struct.ComponentSchema {
  collectionName: 'components_bloc_descriptions';
  info: {
    displayName: 'Description';
  };
  attributes: {
    Description: Schema.Attribute.Text;
    Titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface BlocDescriptionAvecImage extends Struct.ComponentSchema {
  collectionName: 'components_bloc_description_avec_images';
  info: {
    description: '';
    displayName: 'DescriptionAvecImage';
  };
  attributes: {
    Description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    Image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    Titre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
  };
}

export interface BlocRessources extends Struct.ComponentSchema {
  collectionName: 'components_bloc_ressources';
  info: {
    description: '';
    displayName: 'Ressources';
  };
  attributes: {
    AnnuaireURL: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'https://territoireengagetransitionecologique.ademe.fr/wp-content/uploads/2023/05/ADEME_Liste-conseillers_TE-CAE-2023_mai.pdf'>;
    Description: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Schema.Attribute.DefaultTo<"Besoin de pr\u00E9cisions avant de m'engager !">;
    ReglementCaeURL: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'https://territoireengagetransitionecologique.ademe.fr/wp-content/uploads/2022/06/Reglement-du-label-Territoire-engage-pour-la-transition-ecologique-CAE_2022.pdf'>;
    ReglementEciURL: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'https://territoireengagetransitionecologique.ademe.fr/wp-content/uploads/2022/03/Reglement_label_ECi_20220316.pdf.pdf'>;
  };
}

export interface BlocTexteAvecImage extends Struct.ComponentSchema {
  collectionName: 'components_contenu_texte_avec_images';
  info: {
    description: '';
    displayName: 'TexteAvecImage';
  };
  attributes: {
    Image: Schema.Attribute.Media<'images'>;
    LegendeVisible: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    Texte: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

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

export interface SharedVignetteAvecMarkdown extends Struct.ComponentSchema {
  collectionName: 'components_shared_vignette_avec_markdowns';
  info: {
    description: '';
    displayName: 'vignette_avec_markdown';
    icon: 'layout';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    legende: Schema.Attribute.RichText & Schema.Attribute.Required;
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
  export module Public {
    export interface ComponentSchemas {
      'bloc.accompagnement': BlocAccompagnement;
      'bloc.compte': BlocCompte;
      'bloc.description': BlocDescription;
      'bloc.description-avec-image': BlocDescriptionAvecImage;
      'bloc.ressources': BlocRessources;
      'bloc.texte-avec-image': BlocTexteAvecImage;
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
      'shared.vignette-avec-markdown': SharedVignetteAvecMarkdown;
      'shared.vignette-avec-titre': SharedVignetteAvecTitre;
    }
  }
}
