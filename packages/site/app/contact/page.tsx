'use server';

import NoResult from '@tet/site/components/info/NoResult';
import Section from '@tet/site/components/sections/Section';
import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import ContactForm from './ContactForm';
import { Metadata, ResolvingMetadata } from 'next';
import { getStrapiData } from './utils';
import { getUpdatedMetadata } from '@tet/site/src/utils/getUpdatedMetadata';
import { Alert, TrackPageView } from '@tet/ui';

export async function generateMetadata(
  params: { params: unknown },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const metadata = (await parent) as Metadata;
  const strapiData = await getStrapiData();

  return getUpdatedMetadata(metadata, {
    title: strapiData?.seo.metaTitle ?? 'Contact',
    networkTitle: strapiData?.seo.metaTitle,
    description: strapiData?.seo.metaDescription,
    image: strapiData?.seo.metaImage,
  });
}

const Contact = async () => {
  const data = await getStrapiData();

  return (
    <>
      <TrackPageView pageName={'site/contact'} properties={{}} />

      {data ? (
        <Section className="gap-6">
          <h1 className="text-primary-8 mb-0">
            {data.titre ?? "Contacter l'équipe"}
          </h1>

          {!!data.description && (
            <p className="text-xl text-primary-10">{data.description}</p>
          )}

          <ContactForm />

          {!!data.telephone && (
            <Alert
              title={`Tél. : ${data.telephone}`}
              description={data.horaires}
              customIcon="phone-fill"
              rounded
            />
          )}

          {!!data.couverture && (
            <StrapiImage
              data={data.couverture}
              className="w-full"
              containerClassName="w-full my-6"
              displayCaption={data.legendeVisible}
            />
          )}
        </Section>
      ) : (
        <NoResult />
      )}
    </>
  );
};

export default Contact;
