import dynamic from 'next/dynamic';

// Nécessaire pour utiliser la variable `document` dans Compte
const Compte = dynamic(() => import('../_components/compte.page'), {
  ssr: false,
});

export default function Page() {
  return <Compte />;
}
