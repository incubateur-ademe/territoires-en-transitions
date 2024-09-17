import BigBasketPicto from '@tet/panier/components/Picto/BigBasketPicto';
import DashboardPicto from '@tet/panier/components/Picto/DashboardPicto';
import CollectiviteEngageePicto from '@tet/panier/components/Picto/CollectiviteEngageePicto';
import Section from '@tet/panier/components/Section';
import CestParti from './CestParti';
import ReprendrePanier from './ReprendrePanier';
import {CommentCaMarche} from './CommentCaMarche';

const Landing = () => {
  return (
    <>
      <Section
        className="lg:flex-row gap-y-8 gap-x-16 items-center max-md:pt-12 md:py-24"
        containerClassName="bg-white"
      >
        <div className="lg:w-2/3">
          <h1>
            Faites vivre la transition écologique sur votre territoire.{' '}
            <span className="text-primary">la transition écologique</span>
          </h1>
          <p>
            Avec le panier d’action à impact, constituez une base d’actions
            adaptés aux compétences de votre collectivité et retrouvez là au
            sein d’un plan d’action pilotable.
          </p>
          <div className="flex gap-x-8 gap-y-4 flex-wrap">
            <CestParti />
            <ReprendrePanier />
          </div>
        </div>
        <div className="flex justify-center items-center max-w-full">
          <BigBasketPicto />
        </div>
      </Section>

      <Section className="lg:flex-row gap-y-8 gap-x-12 items-center max-md:pt-12 md:py-24">
        <div className="lg:w-1/2 flex justify-center items-center max-lg:order-last max-w-full">
          <DashboardPicto />
        </div>
        <div className="lg:w-1/2">
          <CommentCaMarche />
        </div>
      </Section>

      <Section
        className="flex-col gap-y-4 gap-x-12 items-center text-center max-md:pt-12 md:py-24"
        containerClassName="bg-white"
      >
        <CollectiviteEngageePicto />
        <h3 className="mb-0">
          Vous êtes une collectivité déjà engagée dans le programme Territoires
          Engagés Transition Écologique ?
        </h3>
        <p className="font-bold text-primary-10">
          Le panier d&apos;actions basé principalement sur les actions des
          référentiels est conçu en priorité pour faciliter le passage à
          l&apos;action aux collectivités qui ne sont pas encore engagées !{' '}
        </p>
      </Section>
    </>
  );
};

export default Landing;
