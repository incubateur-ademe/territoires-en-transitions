'use client';

import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Attributes, useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';

const Benefices = () => {
  const [benefices, setBenefices] = useState<
    {
      id: number;
      titre: Attributes;
      description: Attributes;
    }[]
  >([]);

  const fetchBenefices = async () => {
    const data = await fetchCollection('benefices');

    const formattedData = data.map(d => ({
      id: d.id,
      titre: d.attributes.Titre,
      description: d.attributes.Contenu,
    }));

    setBenefices(formattedData);
  };

  useEffect(() => {
    fetchBenefices();
  }, []);

  return (
    <CardsSection
      title="Les bénéfices"
      cardsList={
        <CardsWrapper cols={2}>
          {benefices.map(b => (
            <Card
              key={b.id}
              title={b.titre as string}
              description={b.description as string}
              className="border border-[#ddd]"
            />
          ))}
        </CardsWrapper>
      }
    />
  );
};

export default Benefices;
