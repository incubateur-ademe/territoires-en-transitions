import { CreateAccountButton } from '@/site/components/buttons/create-account.button';
import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';

export const HomeCTA = () => (
  <Section
    className="items-center justify-center"
    containerClassName="bg-primary-7 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
  >
    <TitreSection className="text-white">
      Passez à l&apos;action en moins de 5 minutes
    </TitreSection>
    <p className="text-white text-lg">
      Notre équipe vous accompagne gratuitement à la prise en main.
    </p>
    <ol className="text-white text-lg font-bold">
      <li>Créez votre compte</li>
      <li>Ajoutez vos Actions et vos Plans</li>
      <li>Pilotez</li>
    </ol>
    <CreateAccountButton />
  </Section>
);
