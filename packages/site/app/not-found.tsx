/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';

const NotFound = () => {
  return (
    <Section className="my-16">
      <div className="flex items-center justify-center divide-x divide-black">
        <h1 className="text-3xl font-normal pr-4">404</h1>
        <h2 className="text-lg font-normal pl-4">Cette page n'existe pas</h2>
      </div>
    </Section>
  );
};

export default NotFound;
