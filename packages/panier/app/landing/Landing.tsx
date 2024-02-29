import BigBasketPicto from '@components/Picto/BigBasketPicto';
import CestParti from './CestParti';
import DashboardPicto from '@components/Picto/DashboardPicto';
import Section from '@components/Section/Section';

const Landing = () => {
  return (
    <>
      <Section
        className="lg:flex-row gap-y-8 gap-x-16 items-center py-24"
        containerClassName="bg-white"
      >
        <div className="lg:w-2/3">
          <h1>
            Identifiez des actions à impact pour votre collectivité <br />
            en <span className="text-secondary-1">quelques clics.</span>
          </h1>
          <ul className="list-disc list-outside text-base text-primary-9 font-bold pl-4 mb-8">
            <li className="mb-4">
              Vous avez besoin d&apos;aide pour identifier des actions concrètes
              adaptées à votre territoire ?
            </li>
            <li className="mb-4">
              Vous souhaitez accélérer votre démarche de transition écologique
              pour votre commune ou votre intercommunalité ?
            </li>
            <li className="mb-4">
              Vous cherchez à prioriser quelques actions clés à valider avec vos
              élus ?
            </li>
          </ul>
          <CestParti />
        </div>
        <div className="flex justify-center items-center">
          <BigBasketPicto />
        </div>
      </Section>

      <Section className="lg:flex-row gap-y-8 gap-x-12 items-center py-24">
        <div className="lg:w-1/2 flex justify-center items-center max-lg:order-last">
          <DashboardPicto />
        </div>
        <div className="lg:w-1/2">
          <h3>Comment ça marche ? </h3>
          <ul className="list-decimal list-outside text-lg text-primary-10 font-bold pl-5">
            <li className="mb-6">
              Ajoutez à votre panier les actions impactantes et pertinentes pour
              votre collectivité.
            </li>
            <li className="mb-6">
              Retrouvez vos fiches actions directement sur votre compte
              Territoires en Transitions.
            </li>
            <li className="mb-6">
              A vous de jouer ! Vous pouvez modifiez les actions à volonté et
              vous en servir comme base de travail et outil de dialogue.
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
};

export default Landing;
