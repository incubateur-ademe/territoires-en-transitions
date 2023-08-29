/* eslint-disable react/no-unescaped-entities */
'use server';

import NoResult from '@components/info/NoResult';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import PhoneIcon from 'public/icones/PhoneIcon';
import {fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
import ContactForm from './ContactForm';

type ContactData = {
  titre: string;
  description: string;
  couverture?: StrapiItem;
};

const getData = async () => {
  const data = await fetchSingle('contact');

  const formattedData = data
    ? {
        titre: data.attributes.Titre as unknown as string,
        description:
          (data.attributes.Description as unknown as string) ?? undefined,
        couverture:
          (data.attributes.Couverture.data as unknown as StrapiItem) ??
          undefined,
      }
    : null;

  return formattedData;
};

const Contact = async () => {
  const data: ContactData | null = await getData();

  return data ? (
    <Section className="flex-col">
      <h1>{data.titre}</h1>

      <p className="text-xl">{data.description}</p>

      <div className="p-4 md:p-14 lg:px-28 bg-gray-100 mb-6">
        <p className="text-sm">Information requises</p>
        <ContactForm />
      </div>
      <div>
        <p className="font-bold flex gap-2 mb-0">
          <PhoneIcon />
          Tél. : 04 15 09 82 07
        </p>
        <p className="text-[#666]">
          Permanence de 9h à 12h30 et de 14h à 16h30, du lundi au vendredi
        </p>
      </div>

      {!!data.couverture && (
        <picture className="w-full my-6">
          <StrapiImage data={data.couverture} className="w-full" />
        </picture>
      )}
    </Section>
  ) : (
    <NoResult />
  );
};

export default Contact;
