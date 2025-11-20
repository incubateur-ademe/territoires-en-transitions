'use client';

import Section from '@/site/components/sections/Section';
import CommunityPicto from '@/site/public/pictogrammes/CommunityPicto';
import PictoWithBackground from '@/site/public/pictogrammes/PictoWithBackground';
import { Button } from '@tet/ui';

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
