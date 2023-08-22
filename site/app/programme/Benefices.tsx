'use client';

import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';

type BeneficesProps = {
  titre: string;
  description?: string;
};

const Benefices = ({titre, description}: BeneficesProps) => {
  const [benefices, setBenefices] = useState<
    {
      id: number;
      titre: string;
      description: string;
    }[]
  >([]);

  const fetchBenefices = async () => {
    const data = await fetchCollection('benefices');

    const formattedData = data.map(d => ({
      id: d.id,
      titre: d.attributes.Titre as unknown as string,
      description: d.attributes.Contenu as unknown as string,
    }));

    setBenefices(formattedData);
  };

  useEffect(() => {
    fetchBenefices();
  }, []);

  return benefices.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={2}>
          {benefices.map(b => (
            <Card
              key={b.id}
              title={b.titre}
              description={b.description}
              className="border border-[#ddd]"
            />
          ))}
        </CardsWrapper>
      }
    />
  ) : null;
};

export default Benefices;
