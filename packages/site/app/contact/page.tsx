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
  telephone: string;
  horaires: string;
  couverture?: StrapiItem;
  legendeVisible?: boolean;
};

const getData = async () => {
  const data = await fetchSingle('contact');

  const formattedData = data
    ? {
        titre: data.attributes.Titre as unknown as string,
        description: data.attributes.Description as unknown as string,
        telephone: data.attributes.Telephone as unknown as string,
        horaires: data.attributes.Horaires as unknown as string,
        couverture:
          (data.attributes.Couverture.data as unknown as StrapiItem) ??
          undefined,
        legendeVisible:
          (data.attributes.LegendeVisinle as unknown as boolean) ?? false,
      }
    : null;

  return formattedData;
};

const Contact = async () => {
  const data: ContactData | null = await getData();

  return data ? (
    <Section className="flex-col">
      <h2>{data.titre}</h2>

      <p className="text-xl">{data.description}</p>

      <div className="p-4 md:p-14 lg:px-28 bg-gray-100 mb-6">
        <p className="text-sm">Tous les champs sont obligatoires</p>
        <ContactForm />
      </div>
      <div>
        <p className="font-bold flex gap-2 mb-0">
          <PhoneIcon />
          Tél. : {data.telephone}
        </p>
        <p className="text-[#666]">{data.horaires}</p>
      </div>

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
  );
};

export default Contact;
