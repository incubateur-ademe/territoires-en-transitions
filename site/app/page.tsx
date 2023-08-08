/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import TestimonyCard from '@components/cards/TestimonyCard';
import Section from '@components/sections/Section';
import CardsSection from '@components/sections/CardsSection';
import Slideshow from '@components/slideshow/Slideshow';
import CalendarPicto from 'public/pictogrammes/CalendarPicto';
import CommunityPicto from 'public/pictogrammes/CommunityPicto';
import InformationPicto from 'public/pictogrammes/InformationPicto';
import PictoWithBackground from 'public/pictogrammes/PictoWithBackground';
import SearchInput from '@components/inputs/SearchInput';
import {testimonies} from './data';

export default function Accueil() {
  return (
    <>
      <Section className="flex-col lg:flex-row">
        <div className="lg:mr-10 xl:mr-20 mb-8 lg:mb-0">
          <h1>Accélérez la transition écologique de votre collectivité</h1>
          <p>Quelles sont les prochaines étapes pour ma collectivité ?</p>
          <SearchInput
            id="collectivite"
            placeholder="Rechercher un EPCI, un syndicat, une commune, un PETR, un EPT"
          />
          <a
            href="/programme#carte"
            className="fr-link fr-icon-arrow-right-line fr-link--icon-right"
          >
            Voir la carte de toutes les collectivités
          </a>
        </div>
        <picture className="w-full lg:w-3/5 xl:w-2/5">
          <img src="accueil/homepage.png" alt="" className="w-full" />
        </picture>
      </Section>

      <CardsSection
        title="Bénéficiez d’un accompagnement adapté à vos besoins"
        description="Votre territoire est unique. Avancez étape par étape dans 
        la transition écologique selon vos compétences et vos moyens avec le programme 
        Territoire Engagé Transition Écologique."
        cardsList={
          <CardsWrapper cols={2}>
            <Card
              title="Engagez votre collectivité dans la transition écologique"
              description="Réalisez votre état des lieux et bénéficiez d'un accompagnement personnalisé"
              button={{title: 'Découvrir le programme', href: '/programme'}}
              image={
                <picture>
                  <img
                    src="territoire-engage.jpg"
                    alt=""
                    className="max-h-[150px]"
                  />
                </picture>
              }
            />
            <Card
              title="Suivez vos plans d'action et vos indicateurs"
              description="Collaborez de manière transversale pour atteindre vos objectifs"
              button={{
                title: 'Créer un compte',
                href: 'https://app.territoiresentransitions.fr/auth/signup',
              }}
              image={
                <picture>
                  <img src="accueil/compte.png" alt="" />
                </picture>
              }
            />
          </CardsWrapper>
        }
      />

      <CardsSection
        title="Rejoignez une communauté de collectivités engagées"
        cardsList={
          <Slideshow
            className="my-6 xl:mx-auto xl:w-5/6 "
            slides={testimonies.map(t => (
              <TestimonyCard
                key={t.id}
                content={t.content}
                author={t.author}
                role={t.role}
                imageSrc={t.image}
              />
            ))}
          />
        }
      />

      <CardsSection
        title="Vous souhaitez plus d’informations ?"
        cardsList={
          <CardsWrapper cols={3} className="!gap-14">
            <div className="flex flex-col items-center gap-8">
              <PictoWithBackground pictogram={<InformationPicto />} />
              <ButtonWithLink href="/faq" secondary fullWidth>
                Lire les questions fréquentes
              </ButtonWithLink>
            </div>
            <div className="flex flex-col items-center gap-8">
              <PictoWithBackground pictogram={<CommunityPicto />} />
              <ButtonWithLink href="/contact" secondary fullWidth>
                Contacter l'équipe
              </ButtonWithLink>
            </div>
            <div className="flex flex-col items-center gap-8">
              <PictoWithBackground pictogram={<CalendarPicto />} />
              <ButtonWithLink href="/" fullWidth>
                Participer à une démo
              </ButtonWithLink>
            </div>
          </CardsWrapper>
        }
      />
    </>
  );
}
