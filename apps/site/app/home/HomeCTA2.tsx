import { BookDemoButton } from '@/site/components/buttons/book-demo.button';
import { CreateAccountButton } from '@/site/components/buttons/create-account.button';
import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';

export const HomeCTA2 = () => (
  <Section
    className="items-center justify-center"
    containerClassName="bg-primary-7 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
  >
    <TitreSection className="text-white">
      Prêt à piloter efficacement les transitions de votre territoire ?
    </TitreSection>
    <p className="text-white text-lg">
      Rejoignez gratuitement les centaines de collectivités qui utlisent déjà
      Territoires en Transitions.
    </p>
    <div className="flex flex-row gap-4">
      <CreateAccountButton label="Commencer" />
      <BookDemoButton />
    </div>
  </Section>
);
