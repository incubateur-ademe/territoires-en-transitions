import { BookDemoButton } from '@/site/components/buttons/book-demo.button';
import { CreateAccountButton } from '@/site/components/buttons/create-account.button';
import Section from '@/site/components/sections/Section';
import Link from 'next/link';
import { DEPOT_ENTRY_PATH } from './demarche-pcaet.data';

export const DemarchePcaetCTASection = () => (
  <Section
    containerClassName="lg:!py-20"
    className="items-center gap-7 text-center"
  >
    <h2 className="mb-0 text-primary-9">Prêt à déposer votre PCAET ?</h2>
    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 max-sm:w-full">
      <CreateAccountButton
        label="Je crée mon compte gratuitement"
        redirectTo={DEPOT_ENTRY_PATH}
      />
      <BookDemoButton href="https://calendly.com/territoiresentransitions/demo-pcaet-decouvrir" />
    </div>
    <Link href="/contact?objet=pcaet" className="text-primary-10 underline">
      Une question sur le dépôt réglementaire ? Contactez-nous
    </Link>
  </Section>
);
