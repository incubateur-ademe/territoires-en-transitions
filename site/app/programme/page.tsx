/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import BlogCard from '@components/cards/BlogCard';
import Card from '@components/cards/Card';
import CardsWrapper from '@components/cards/CardsWrapper';
import InfoSection from '@components/sections/InfoSection';
import Section from '@components/sections/Section';
import CardsSection from '@components/sections/CardsSection';
import CodingPicto from 'public/pictogrammes/CodingPicto';
import DocumentPicto from 'public/pictogrammes/DocumentPicto';
import {benefits, resources, steps} from './data';
import Services from './Services';

const Programme = () => {
  return (
    <>
      <Section className="flex-col">
        <h2>Découvrez le programme Territoire Engagé Transition Écologique</h2>
        <p className="text-[1.375rem]">
          L'outil opérationnel de planification écologique qui met à votre
          disposition une ingénierie territoriale et un accompagnement
          personnalisé.
        </p>
        <iframe
          className="aspect-video w-full lg:w-4/5 mx-auto"
          src="https://www.youtube.com/embed/gAc_B6j1qcY"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Découvrez le programme Territoire Engagé Transition Écologique"
        />
      </Section>

      <CardsSection
        title="Pourquoi engager votre collectivité ?"
        cardsList={
          <CardsWrapper cols={5}>
            <div className="flex flex-col items-center gap-8">
              <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center">
                <picture>
                  <img src="programme/attractif.png" alt="" />
                </picture>
              </div>
              <p className="text-center">
                Rendre votre territoire <strong>attractif</strong> et durable
              </p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center">
                <picture>
                  <img src="programme/sobriete.png" alt="" />
                </picture>
              </div>
              <p className="text-center">
                Viser la <strong>sobriété</strong> énergétique et
                environnementale
              </p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center">
                <picture>
                  <img src="programme/sante.png" alt="" />
                </picture>
              </div>
              <p className="text-center">
                Améliorer le <strong>cadre de vie</strong> et la{' '}
                <strong>santé</strong> de votre population
              </p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center">
                <picture>
                  <img src="programme/ressources.png" alt="" />
                </picture>
              </div>
              <p className="text-center">
                Assurer et préserver vos <strong>approvisionnements</strong> en
                ressources et en énergie
              </p>
            </div>
            <div className="flex flex-col items-center gap-8">
              <div className="w-[140px] h-[140px] bg-white rounded-full flex items-center justify-center">
                <picture>
                  <img src="programme/resilience.png" alt="" />
                </picture>
              </div>
              <p className="text-center">
                Renforcer la <strong>résilience</strong> face aux changements
                climatiques
              </p>
            </div>
          </CardsWrapper>
        }
        customBackground="#fff6f0"
      />

      <Services />

      <InfoSection
        content="Une offre socle qui comprend deux référentiels d'action Climat-Air-Énergie et Économie Circulaire, hébergés sur notre plateforme numérique"
        buttons={[
          {
            title: 'Créer un compte',
            href: 'https://app.territoiresentransitions.fr/auth/signup',
          },
        ]}
        pictogram={<CodingPicto />}
      />

      <CardsSection
        title="Les bénéfices"
        cardsList={
          <CardsWrapper cols={2}>
            {benefits.map(b => (
              <Card
                key={b.id}
                title={b.title}
                description={b.description}
                className="border border-[#ddd]"
              />
            ))}
          </CardsWrapper>
        }
      />

      <CardsSection
        title="Les étapes"
        cardsList={
          <CardsWrapper cols={4}>
            {steps.map((s, index) => (
              <Card
                key={s.id}
                step={index + 1}
                title={s.title}
                description={s.description}
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

      {/* <Section id="carte">
        <h3>De nombreuses collectivités ont déjà franchi le cap !</h3>
      </Section> */}

      <InfoSection
        content="Besoin de précisions avant de m'engager !"
        buttons={resources.map(r => ({...r, external: true}))}
        pictogram={<DocumentPicto />}
        customBackground="#6a6af4"
        customTextStyle="text-white font-bold"
      />
    </>
  );
};

export default Programme;
