import Section from '@/site/components/sections/Section';
import { Metadata } from 'next';
import { STREAMLIT_IFRAME_SRC } from './streamlit.utils';

export const metadata: Metadata = {
  title: 'Statistiques publiques',
};

export default function StatistiquesPage() {
  return (
    <>
      <Section containerClassName="bg-primary-1">
        <h1>Notre impact</h1>
        <p>
          Visualisez les statistiques publiques d&apos;impacts et résultats de
          la plateforme Territoires en Transitions par les collectivités.
        </p>
      </Section>
      <Section>
        <div className="w-full h-[8500px]">
          <iframe
            title="Tableau de bord des statistiques publiques Territoires en Transitions"
            src={STREAMLIT_IFRAME_SRC}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </Section>
    </>
  );
}
