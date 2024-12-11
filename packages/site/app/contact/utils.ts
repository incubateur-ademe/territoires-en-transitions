import { fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export const getStrapiData = async () => {
  const data = await fetchSingle('page-contact', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
  ]);

  if (data) {
    const contactData = data.attributes;

    const metaImage =
      (contactData.seo?.metaImage?.data as unknown as StrapiItem)?.attributes ??
      (contactData?.attributes?.couverture?.data as unknown as StrapiItem)
        ?.attributes ??
      undefined;

    return {
      seo: {
        metaTitle:
          (contactData.seo?.metaTitle as unknown as string) ?? undefined,
        metaDescription:
          (contactData.seo?.metaDescription as unknown as string) ??
          (contactData.description as unknown as string) ??
          undefined,
        metaImage: metaImage
          ? {
              url: metaImage.url as unknown as string,
              width: metaImage.width as unknown as number,
              height: metaImage.height as unknown as number,
              type: metaImage.mime as unknown as string,
              alt: metaImage.alternativeText as unknown as string,
            }
          : undefined,
      },
      titre: (contactData.titre as unknown as string) ?? undefined,
      description: (contactData.description as unknown as string) ?? undefined,
      telephone: (contactData.telephone as unknown as string) ?? undefined,
      horaires: (contactData.horaires as unknown as string) ?? undefined,
      couverture:
        (contactData.couverture?.data as unknown as StrapiItem) ?? undefined,
      legendeVisible:
        (contactData.legende_visible as unknown as boolean) ?? false,
    };
  } else return null;
};
