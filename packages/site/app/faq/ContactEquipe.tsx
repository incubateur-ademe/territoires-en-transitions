'use client';

/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';
import {Button} from '@tet/ui';
import CommunityPicto from 'public/pictogrammes/CommunityPicto';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';

const ContactEquipe = () => {
  return (
    <Section
      className="!flex-row justify-between items-center gap-8 flex-wrap"
      containerClassName="bg-primary-1"
    >
      <p className="mb-0 flex-auto text-center">
        Cette page n’a pas répondu à votre question ? Notre équipe est à votre
        écoute !
      </p>
      <div className="flex-auto flex justify-center items-center gap-8 flex-wrap">
        <PictoWithBackground pictogram={<CommunityPicto />} />
        <Button href="/contact" variant="outlined">
          Contacter l'équipe
        </Button>
      </div>
    </Section>
  );
};

export default ContactEquipe;
