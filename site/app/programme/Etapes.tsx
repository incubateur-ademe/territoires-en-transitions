'use client';

import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import CardsSection from '@components/sections/CardsSection';
import {Attributes, useEffect, useState} from 'react';
import {fetchCollection} from 'src/strapi';

type EtapesProps = {
  titre: string;
  description?: string;
};

const Etapes = ({titre, description}: EtapesProps) => {
  const [etapes, setEtapes] = useState<
    {
      id: number;
      titre: Attributes;
      description: Attributes;
    }[]
  >([]);

  const fetchEtapes = async () => {
    const data = await fetchCollection('etapes');

    const formattedData = data.map(d => ({
      id: d.id,
      titre: d.attributes.Titre,
      description: d.attributes.Contenu,
    }));

    setEtapes(formattedData);
  };

  useEffect(() => {
    fetchEtapes();
  }, []);

  return etapes.length ? (
    <CardsSection
      title={titre}
      description={description}
      cardsList={
        <CardsWrapper cols={4}>
          {etapes.map((e, index) => (
            <Card
              key={e.id}
              step={index + 1}
              title={e.titre as string}
              description={e.description as string}
              className="border border-black"
            />
          ))}
        </CardsWrapper>
      }
    >
      <ButtonWithLink href="/contact" className="mt-6">
        Contactez-nous
      </ButtonWithLink>
    </CardsSection>
  ) : null;
};

export default Etapes;
