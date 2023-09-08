import {fetchCollection} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {
  ActionsCaeFetchedData,
  CitationCollectiviteData,
  CitationFetchedData,
  CollectiviteData,
  ContenuCollectiviteFetchedData,
  GallerieFetchedData,
  ImageFetchedData,
  InfoFetchedData,
  ParagrapheArticleData,
  ParagrapheCustomArticleData,
  ParagrapheCustomFetchedData,
  ParagrapheFetchedData,
  VideoFetchedData,
} from '../../types';

export const getData = async (name: string) => {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(' ')
    .join('-');

  const data = await fetchCollection('collectivites', [
    ['filters[Slug]', `${slug}`],
    ['populate[0]', 'Logos'],
    ['populate[1]', 'Sections'],
    ['populate[2]', 'Sections.Image'],
    ['populate[3]', 'Sections.Gallerie'],
    ['populate[4]', 'Sections.PlanificationTerritoriale'],
    ['populate[5]', 'Sections.PlanificationTerritoriale.Image'],
    ['populate[6]', 'Sections.PatrimoineCollectivite'],
    ['populate[7]', 'Sections.PatrimoineCollectivite.Image'],
    ['populate[8]', 'Sections.ApprovisionnementEnergie'],
    ['populate[9]', 'Sections.ApprovisionnementEnergie.Image'],
    ['populate[10]', 'Sections.Mobilite'],
    ['populate[11]', 'Sections.Mobilite.Image'],
    ['populate[12]', 'Sections.OrganisationInterne'],
    ['populate[13]', 'Sections.OrganisationInterne.Image'],
    ['populate[14]', 'Sections.CommunicationCooperation'],
    ['populate[15]', 'Sections.CommunicationCooperation.Image'],
  ]);

  if (data && data.length) {
    const formattedData: CollectiviteData = {
      logos:
        (data[0].attributes.Logos.data as unknown as StrapiItem[]) ?? undefined,
      description:
        (data[0].attributes.Introduction as unknown as string) ?? undefined,
      contenu: (
        data[0].attributes.Sections as unknown as ContenuCollectiviteFetchedData
      ).map(section => {
        if (section.__component === 'contenu.performance-collectivite') {
          return {
            type: 'performance',
            data: {
              titre: (section as ParagrapheFetchedData).Titre,
              texte: (section as ParagrapheFetchedData).Texte,
              image: (section as ParagrapheFetchedData).Image.data,
              legendeVisible: (section as ParagrapheFetchedData).LegendeVisible,
            } as ParagrapheArticleData,
          };
        } else if (section.__component === 'contenu.citation') {
          return {
            type: 'citation',
            data: {
              texte: (section as CitationFetchedData).Texte,
              auteur: (section as CitationFetchedData).Auteur,
              description: (section as CitationFetchedData).Description,
            } as CitationCollectiviteData,
          };
        } else if (section.__component === 'contenu.actions-cae') {
          let actions = [];
          if (
            (section as ActionsCaeFetchedData).PlanificationTerritoriale !==
            undefined
          ) {
            actions.push({
              titre: 'Planification territoriale',
              texte: (section as ActionsCaeFetchedData)
                .PlanificationTerritoriale.Texte,
              image: (section as ActionsCaeFetchedData)
                .PlanificationTerritoriale.Image.data,
              legendeVisible: (section as ActionsCaeFetchedData)
                .PlanificationTerritoriale.LegendeVisible,
            });
          }
          if ((section as ActionsCaeFetchedData).PatrimoineCollectivite) {
            actions.push({
              titre: 'Patrimoine de la collectivité',
              texte: (section as ActionsCaeFetchedData).PatrimoineCollectivite
                .Texte,
              image: (section as ActionsCaeFetchedData).PatrimoineCollectivite
                .Image.data,
              legendeVisible: (section as ActionsCaeFetchedData)
                .PatrimoineCollectivite.LegendeVisible,
            });
          }
          if ((section as ActionsCaeFetchedData).ApprovisionnementEnergie) {
            actions.push({
              titre: 'Approvisionnement en énergie, eau et assainissement',
              texte: (section as ActionsCaeFetchedData).ApprovisionnementEnergie
                .Texte,
              image: (section as ActionsCaeFetchedData).ApprovisionnementEnergie
                .Image.data,
              legendeVisible: (section as ActionsCaeFetchedData)
                .ApprovisionnementEnergie.LegendeVisible,
            });
          }
          if ((section as ActionsCaeFetchedData).Mobilite) {
            actions.push({
              titre: 'Mobilité',
              texte: (section as ActionsCaeFetchedData).Mobilite.Texte,
              image: (section as ActionsCaeFetchedData).Mobilite.Image.data,
              legendeVisible: (section as ActionsCaeFetchedData).Mobilite
                .LegendeVisible,
            });
          }
          if ((section as ActionsCaeFetchedData).OrganisationInterne) {
            actions.push({
              titre: 'Organisation interne',
              texte: (section as ActionsCaeFetchedData).OrganisationInterne
                .Texte,
              image: (section as ActionsCaeFetchedData).OrganisationInterne
                .Image.data,
              legendeVisible: (section as ActionsCaeFetchedData)
                .OrganisationInterne.LegendeVisible,
            });
          }
          if ((section as ActionsCaeFetchedData).CommunicationCooperation) {
            actions.push({
              titre: 'Communication et coopération',
              texte: (section as ActionsCaeFetchedData).CommunicationCooperation
                .Texte,
              image: (section as ActionsCaeFetchedData).CommunicationCooperation
                .Image.data,
              legendeVisible: (section as ActionsCaeFetchedData)
                .CommunicationCooperation.LegendeVisible,
            });
          }
          return {
            type: 'actionsCAE',
            data: actions as ParagrapheArticleData[],
          };
        } else if (section.__component === 'contenu.paragraphe') {
          return {
            type: 'paragraphe',
            data: {
              titre: (section as ParagrapheCustomFetchedData).Titre,
              texte: (section as ParagrapheCustomFetchedData).Texte,
              image: (section as ParagrapheCustomFetchedData).Image.data,
              alignementImage: (section as ParagrapheCustomFetchedData)
                .AlignementImage,
              legendeVisible: (section as ParagrapheCustomFetchedData)
                .LegendeVisible,
            } as ParagrapheCustomArticleData,
          };
        } else if (section.__component === 'contenu.image') {
          return {
            type: 'image',
            data: {
              data: (section as ImageFetchedData).Image.data,
              legendeVisible: (section as ImageFetchedData).LegendeVisible,
            },
          };
        } else if (section.__component === 'contenu.gallerie') {
          return {
            type: 'gallerie',
            data: {
              data: (section as GallerieFetchedData).Gallerie.data,
              colonnes: (section as GallerieFetchedData).NombreColonnes,
              legende: (section as GallerieFetchedData).Legende,
              legendeVisible: (section as GallerieFetchedData).LegendeVisible,
            },
          };
        } else if (section.__component === 'contenu.video') {
          return {
            type: 'video',
            data: (section as VideoFetchedData).URL,
          };
        } else if (section.__component === 'contenu.info') {
          return {
            type: 'info',
            data: (section as InfoFetchedData).Texte,
          };
        } else return {type: 'paragraphe', data: {}};
      }),
    };

    return formattedData;
  } else return null;
};
