import type { Attribute, Schema } from '@strapi/strapi';

export interface BlocAccompagnement extends Schema.Component {
  collectionName: 'components_bloc_accompagnements';
  info: {
    description: '';
    displayName: 'Accompagnement';
  };
  attributes: {
    Compte: Attribute.Component<'bloc.description-avec-image'> &
      Attribute.Required;
    Description: Attribute.Text &
      Attribute.DefaultTo<'Votre territoire est unique. Avancez \u00E9tape par \u00E9tape dans la transition \u00E9cologique selon vos comp\u00E9tences et vos moyens avec le programme Territoire Engag\u00E9 Transition \u00C9cologique.'>;
    Programme: Attribute.Component<'bloc.description-avec-image'> &
      Attribute.Required;
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Attribute.DefaultTo<'B\u00E9n\u00E9ficiez d\u2019un accompagnement adapt\u00E9 \u00E0 vos besoins'>;
  };
}

export interface BlocCompte extends Schema.Component {
  collectionName: 'components_bloc_comptes';
  info: {
    description: '';
    displayName: 'Compte';
  };
  attributes: {
    Description: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Attribute.DefaultTo<'Cr\u00E9er un compte  sur notre plateforme num\u00E9rique : '>;
  };
}

export interface BlocDescription extends Schema.Component {
  collectionName: 'components_bloc_descriptions';
  info: {
    displayName: 'Description';
  };
  attributes: {
    Description: Attribute.Text;
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface BlocDescriptionAvecImage extends Schema.Component {
  collectionName: 'components_bloc_description_avec_images';
  info: {
    description: '';
    displayName: 'DescriptionAvecImage';
  };
  attributes: {
    Description: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    Image: Attribute.Media<'images'> & Attribute.Required;
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
  };
}

export interface BlocRessources extends Schema.Component {
  collectionName: 'components_bloc_ressources';
  info: {
    description: '';
    displayName: 'Ressources';
  };
  attributes: {
    AnnuaireURL: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://territoireengagetransitionecologique.ademe.fr/wp-content/uploads/2023/05/ADEME_Liste-conseillers_TE-CAE-2023_mai.pdf'>;
    Description: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Attribute.DefaultTo<"Besoin de pr\u00E9cisions avant de m'engager !">;
    ReglementCaeURL: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://territoireengagetransitionecologique.ademe.fr/wp-content/uploads/2022/06/Reglement-du-label-Territoire-engage-pour-la-transition-ecologique-CAE_2022.pdf'>;
    ReglementEciURL: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://territoireengagetransitionecologique.ademe.fr/wp-content/uploads/2022/03/Reglement_label_ECi_20220316.pdf.pdf'>;
  };
}

export interface BlocTexteAvecImage extends Schema.Component {
  collectionName: 'components_contenu_texte_avec_images';
  info: {
    description: '';
    displayName: 'TexteAvecImage';
  };
  attributes: {
    Image: Attribute.Media<'images'>;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
    Texte: Attribute.RichText & Attribute.Required;
  };
}

export interface ContenuBoutonGroupe extends Schema.Component {
  collectionName: 'components_shared_bouton_groupes';
  info: {
    description: '';
    displayName: 'Boutons';
    icon: 'link';
  };
  attributes: {
    boutons: Attribute.Component<'shared.bouton', true> &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
  };
}

export interface ContenuGallerie extends Schema.Component {
  collectionName: 'components_contenu_galleries';
  info: {
    description: '';
    displayName: 'Gallerie';
    icon: 'grid';
  };
  attributes: {
    Gallerie: Attribute.Media<'images', true> & Attribute.Required;
    Legende: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
    NombreColonnes: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          max: 4;
          min: 1;
        },
        number
      > &
      Attribute.DefaultTo<2>;
  };
}

export interface ContenuImage extends Schema.Component {
  collectionName: 'components_contenu_images';
  info: {
    description: '';
    displayName: 'Image';
    icon: 'landscape';
  };
  attributes: {
    Image: Attribute.Media<'images'> & Attribute.Required;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ContenuIndicateur extends Schema.Component {
  collectionName: 'components_contenu_indicateurs';
  info: {
    description: '';
    displayName: 'Indicateur';
  };
  attributes: {
    description: Attribute.Text & Attribute.Required;
    description_encadre: Attribute.Text & Attribute.Required;
    details: Attribute.RichText;
    illustration_encadre: Attribute.Media<'images'> & Attribute.Required;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre_encadre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ContenuInfo extends Schema.Component {
  collectionName: 'components_contenu_infos';
  info: {
    displayName: 'Info';
    icon: 'information';
  };
  attributes: {
    Texte: Attribute.RichText & Attribute.Required;
  };
}

export interface ContenuParagraphe extends Schema.Component {
  collectionName: 'components_contenu_paragraphes';
  info: {
    description: '';
    displayName: 'Paragraphe';
    icon: 'file';
  };
  attributes: {
    AlignementImage: Attribute.Enumeration<
      ['Gauche', 'Droite', 'Centre Bas', 'Centre Haut']
    > &
      Attribute.DefaultTo<'Centre Bas'>;
    Image: Attribute.Media<'images'>;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
    Texte: Attribute.RichText;
    Titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ContenuTexteCollectivite extends Schema.Component {
  collectionName: 'components_contenu_texte_collectivites';
  info: {
    description: '';
    displayName: 'TexteCollectivite';
  };
  attributes: {
    contenu: Attribute.RichText & Attribute.Required;
    image: Attribute.Media<'images'>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ContenuVideo extends Schema.Component {
  collectionName: 'components_contenu_videos';
  info: {
    description: '';
    displayName: 'Video';
    icon: 'play';
  };
  attributes: {
    URL: Attribute.String & Attribute.Required;
  };
}

export interface ServicesCarte extends Schema.Component {
  collectionName: 'components_services_cartes';
  info: {
    description: '';
    displayName: 'carte';
    icon: 'grid';
  };
  attributes: {
    image: Attribute.Media<'images'>;
    pre_titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    texte: Attribute.RichText & Attribute.Required;
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ServicesInfo extends Schema.Component {
  collectionName: 'components_services_infos';
  info: {
    description: '';
    displayName: 'info';
    icon: 'information';
  };
  attributes: {
    boutons: Attribute.Component<'shared.bouton', true>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ServicesListe extends Schema.Component {
  collectionName: 'components_services_listes';
  info: {
    description: '';
    displayName: 'liste';
    icon: 'bulletList';
  };
  attributes: {
    disposition_cartes: Attribute.Enumeration<
      ['Gallerie', 'Grille', 'Verticale', 'Vignettes']
    > &
      Attribute.Required;
    introduction: Attribute.RichText;
    liste: Attribute.Component<'services.carte', true>;
    sous_titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    taille_liste: Attribute.Enumeration<['md', 'lg']> &
      Attribute.DefaultTo<'lg'>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface ServicesParagraphe extends Schema.Component {
  collectionName: 'components_services_paragraphes';
  info: {
    description: '';
    displayName: 'paragraphe';
    icon: 'layer';
  };
  attributes: {
    alignement_image_droite: Attribute.Boolean & Attribute.DefaultTo<false>;
    image_titre: Attribute.Media<'images'>;
    images: Attribute.Media<'images', true>;
    sous_titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    taille_image_titre: Attribute.Enumeration<['sm', 'md', 'lg']> &
      Attribute.DefaultTo<'sm'>;
    taille_paragraphe: Attribute.Enumeration<['md', 'lg']> &
      Attribute.DefaultTo<'lg'>;
    texte: Attribute.RichText;
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre_centre: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface SharedBouton extends Schema.Component {
  collectionName: 'components_shared_boutons';
  info: {
    displayName: 'bouton';
  };
  attributes: {
    label: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    url: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedParagraphe extends Schema.Component {
  collectionName: 'components_shared_paragraphes';
  info: {
    displayName: 'paragraphe';
    icon: 'layer';
  };
  attributes: {
    contenu: Attribute.RichText & Attribute.Required;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedSeo extends Schema.Component {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'seo';
    icon: 'search';
  };
  attributes: {
    metaDescription: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 50;
      }>;
    metaImage: Attribute.Media<'images'>;
    metaTitle: Attribute.String;
  };
}

export interface SharedTemoignage extends Schema.Component {
  collectionName: 'components_shared_temoignages';
  info: {
    description: '';
    displayName: 'temoignage';
    icon: 'discuss';
  };
  attributes: {
    auteur: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    portrait: Attribute.Media<'images'>;
    role: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    temoignage: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 700;
      }>;
  };
}

export interface SharedVignette extends Schema.Component {
  collectionName: 'components_shared_vignettes';
  info: {
    displayName: 'vignette';
    icon: 'landscape';
  };
  attributes: {
    image: Attribute.Media<'images'> & Attribute.Required;
    legende: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedVignetteAvecCta extends Schema.Component {
  collectionName: 'components_shared_vignette_avec_ctas';
  info: {
    displayName: 'vignette_avec_cta';
  };
  attributes: {
    cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
    image: Attribute.Media<'images'> & Attribute.Required;
    legende: Attribute.RichText & Attribute.Required;
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedVignetteAvecMarkdown extends Schema.Component {
  collectionName: 'components_shared_vignette_avec_markdowns';
  info: {
    description: '';
    displayName: 'vignette_avec_markdown';
    icon: 'layout';
  };
  attributes: {
    image: Attribute.Media<'images'> & Attribute.Required;
    legende: Attribute.RichText & Attribute.Required;
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

export interface SharedVignetteAvecTitre extends Schema.Component {
  collectionName: 'components_shared_vignette_avec_titres';
  info: {
    description: '';
    displayName: 'vignette_avec_titre';
    icon: 'landscape';
  };
  attributes: {
    image: Attribute.Media<'images'>;
    legende: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
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
