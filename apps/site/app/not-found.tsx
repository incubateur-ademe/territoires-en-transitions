import Section from '@/site/components/sections/Section';
import { Button } from '@tet/ui';

export const NotFound = () => {
  return (
    <Section className="my-16">
      <div className="flex items-center justify-center divide-x divide-black">
        <h1 className="text-3xl font-normal pr-4">404</h1>
        <h2 className="text-lg font-normal pl-4">Cette page n'existe pas</h2>
      </div>
      <div className="flex items-center justify-center">
        <Button
          variant="underlined"
          href={'/'}
          className="!text-grey-8 border-b-transparent hover:border-b-grey-8 hover:!border-b !font-normal"
        >
          Retourner à la page d'accueil
        </Button>
      </div>
    </Section>
  );
};

export default NotFound;
