import type { Schema, Attribute } from '@strapi/strapi';

export interface BlocAccompagnement extends Schema.Component {
  collectionName: 'components_bloc_accompagnements';
  info: {
    displayName: 'Accompagnement';
    description: '';
  };
  attributes: {
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }> &
      Attribute.DefaultTo<'B\u00E9n\u00E9ficiez d\u2019un accompagnement adapt\u00E9 \u00E0 vos besoins'>;
    Description: Attribute.Text &
      Attribute.DefaultTo<'Votre territoire est unique. Avancez \u00E9tape par \u00E9tape dans la transition \u00E9cologique selon vos comp\u00E9tences et vos moyens avec le programme Territoire Engag\u00E9 Transition \u00C9cologique.'>;
    Programme: Attribute.Component<'bloc.description-avec-image'> &
      Attribute.Required;
    Compte: Attribute.Component<'bloc.description-avec-image'> &
      Attribute.Required;
  };
}

export interface BlocCompte extends Schema.Component {
  collectionName: 'components_bloc_comptes';
  info: {
    displayName: 'Compte';
    description: '';
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

export interface BlocDescriptionAvecImage extends Schema.Component {
  collectionName: 'components_bloc_description_avec_images';
  info: {
    displayName: 'DescriptionAvecImage';
    description: '';
  };
  attributes: {
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    Description: Attribute.Text &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 200;
      }>;
    Image: Attribute.Media & Attribute.Required;
  };
}

export interface BlocDescription extends Schema.Component {
  collectionName: 'components_bloc_descriptions';
  info: {
    displayName: 'Description';
  };
  attributes: {
    Titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    Description: Attribute.Text;
  };
}

export interface BlocRessources extends Schema.Component {
  collectionName: 'components_bloc_ressources';
  info: {
    displayName: 'Ressources';
    description: '';
  };
  attributes: {
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
    AnnuaireURL: Attribute.String &
      Attribute.Required &
      Attribute.DefaultTo<'https://territoireengagetransitionecologique.ademe.fr/wp-content/uploads/2023/05/ADEME_Liste-conseillers_TE-CAE-2023_mai.pdf'>;
  };
}

export interface BlocTexteAvecImage extends Schema.Component {
  collectionName: 'components_contenu_texte_avec_images';
  info: {
    displayName: 'TexteAvecImage';
    description: '';
  };
  attributes: {
    Texte: Attribute.RichText & Attribute.Required;
    Image: Attribute.Media;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ContenuGallerie extends Schema.Component {
  collectionName: 'components_contenu_galleries';
  info: {
    displayName: 'Gallerie';
    icon: 'grid';
    description: '';
  };
  attributes: {
    Gallerie: Attribute.Media & Attribute.Required;
    NombreColonnes: Attribute.Integer &
      Attribute.Required &
      Attribute.SetMinMax<{
        min: 1;
        max: 4;
      }> &
      Attribute.DefaultTo<2>;
    Legende: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ContenuImage extends Schema.Component {
  collectionName: 'components_contenu_images';
  info: {
    displayName: 'Image';
    icon: 'landscape';
    description: '';
  };
  attributes: {
    Image: Attribute.Media & Attribute.Required;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ContenuIndicateur extends Schema.Component {
  collectionName: 'components_contenu_indicateurs';
  info: {
    displayName: 'Indicateur';
    description: '';
  };
  attributes: {
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    description: Attribute.Text & Attribute.Required;
    titre_encadre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    description_encadre: Attribute.Text & Attribute.Required;
    illustration_encadre: Attribute.Media & Attribute.Required;
    details: Attribute.RichText;
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
    displayName: 'Paragraphe';
    description: '';
    icon: 'file';
  };
  attributes: {
    Titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    Texte: Attribute.RichText;
    Image: Attribute.Media;
    AlignementImage: Attribute.Enumeration<
      ['Gauche', 'Droite', 'Centre Bas', 'Centre Haut']
    > &
      Attribute.DefaultTo<'Centre Bas'>;
    LegendeVisible: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface ContenuTexteCollectivite extends Schema.Component {
  collectionName: 'components_contenu_texte_collectivites';
  info: {
    displayName: 'TexteCollectivite';
    description: '';
  };
  attributes: {
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    contenu: Attribute.RichText & Attribute.Required;
    image: Attribute.Media;
  };
}

export interface ContenuVideo extends Schema.Component {
  collectionName: 'components_contenu_videos';
  info: {
    displayName: 'Video';
    icon: 'play';
    description: '';
  };
  attributes: {
    URL: Attribute.String & Attribute.Required;
  };
}

export interface ServicesCarte extends Schema.Component {
  collectionName: 'components_services_cartes';
  info: {
    displayName: 'carte';
    icon: 'grid';
    description: '';
  };
  attributes: {
    icone: Attribute.String & Attribute.CustomField<'plugin::react-icons.icon'>;
    pre_titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    texte: Attribute.RichText & Attribute.Required;
    image: Attribute.Media;
  };
}

export interface ServicesInfo extends Schema.Component {
  collectionName: 'components_services_infos';
  info: {
    displayName: 'info';
    icon: 'information';
    description: '';
  };
  attributes: {
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    boutons: Attribute.Component<'shared.bouton', true>;
  };
}

export interface ServicesListe extends Schema.Component {
  collectionName: 'components_services_listes';
  info: {
    displayName: 'liste';
    icon: 'bulletList';
    description: '';
  };
  attributes: {
    taille_liste: Attribute.Enumeration<['md', 'lg']> &
      Attribute.DefaultTo<'lg'>;
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    sous_titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    introduction: Attribute.RichText;
    liste: Attribute.Component<'services.carte', true>;
    disposition_cartes: Attribute.Enumeration<
      ['Gallerie', 'Grille', 'Verticale', 'Vignettes']
    > &
      Attribute.Required;
  };
}

export interface ServicesParagraphe extends Schema.Component {
  collectionName: 'components_services_paragraphes';
  info: {
    displayName: 'paragraphe';
    icon: 'layer';
    description: '';
  };
  attributes: {
    taille_paragraphe: Attribute.Enumeration<['md', 'lg']> &
      Attribute.DefaultTo<'lg'>;
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    titre_centre: Attribute.Boolean & Attribute.DefaultTo<false>;
    image_titre: Attribute.Media;
    taille_image_titre: Attribute.Enumeration<['sm', 'md', 'lg']> &
      Attribute.DefaultTo<'sm'>;
    sous_titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    texte: Attribute.RichText;
    alignement_image_droite: Attribute.Boolean & Attribute.DefaultTo<false>;
    images: Attribute.Media;
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
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    contenu: Attribute.RichText & Attribute.Required;
  };
}

export interface SharedSeo extends Schema.Component {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
    icon: 'search';
    description: '';
  };
  attributes: {
    metaTitle: Attribute.String;
    metaDescription: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 50;
      }>;
    metaImage: Attribute.Media;
  };
}

export interface SharedTemoignage extends Schema.Component {
  collectionName: 'components_shared_temoignages';
  info: {
    displayName: 'temoignage';
    description: '';
    icon: 'discuss';
  };
  attributes: {
    auteur: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
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
    portrait: Attribute.Media;
  };
}

export interface SharedVignetteAvecCta extends Schema.Component {
  collectionName: 'components_shared_vignette_avec_ctas';
  info: {
    displayName: 'vignette_avec_cta';
  };
  attributes: {
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    legende: Attribute.RichText & Attribute.Required;
    image: Attribute.Media & Attribute.Required;
    cta: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 50;
      }>;
  };
}

export interface SharedVignetteAvecMarkdown extends Schema.Component {
  collectionName: 'components_shared_vignette_avec_markdowns';
  info: {
    displayName: 'vignette_avec_markdown';
    icon: 'layout';
    description: '';
  };
  attributes: {
    titre: Attribute.String &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    legende: Attribute.RichText & Attribute.Required;
    image: Attribute.Media & Attribute.Required;
  };
}

export interface SharedVignetteAvecTitre extends Schema.Component {
  collectionName: 'components_shared_vignette_avec_titres';
  info: {
    displayName: 'vignette_avec_titre';
    icon: 'landscape';
    description: '';
  };
  attributes: {
    titre: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    legende: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    image: Attribute.Media;
  };
}

export interface SharedVignette extends Schema.Component {
  collectionName: 'components_shared_vignettes';
  info: {
    displayName: 'vignette';
    icon: 'landscape';
  };
  attributes: {
    legende: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    image: Attribute.Media & Attribute.Required;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'bloc.accompagnement': BlocAccompagnement;
      'bloc.compte': BlocCompte;
      'bloc.description-avec-image': BlocDescriptionAvecImage;
      'bloc.description': BlocDescription;
      'bloc.ressources': BlocRessources;
      'bloc.texte-avec-image': BlocTexteAvecImage;
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
      'shared.vignette-avec-cta': SharedVignetteAvecCta;
      'shared.vignette-avec-markdown': SharedVignetteAvecMarkdown;
      'shared.vignette-avec-titre': SharedVignetteAvecTitre;
      'shared.vignette': SharedVignette;
    }
  }
}
