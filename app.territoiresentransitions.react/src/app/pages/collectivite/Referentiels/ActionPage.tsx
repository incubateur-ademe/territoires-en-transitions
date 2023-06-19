import {lazy, Suspense} from 'react';
import {useParams} from 'react-router-dom';
import {renderLoader} from 'utils/renderLoader';
import {Referentiel} from 'types/litterals';
import {useActionDownToTache} from 'core-logic/hooks/referentiel';
import CollectivitePageLayout from '../CollectivitePageLayout/CollectivitePageLayout';
import {SideNavLinks} from 'ui/shared/SideNav';

const ActionReferentielAvancement = lazy(
  () => import('app/pages/collectivite/Referentiels/Action')
);

const fakeLinks: SideNavLinks = [
  {displayName: 'Synthèse ', link: 'ehrthrth'},
  {
    displayName: 'Référentiel Climat Air Énergie',
    link: 'tyjtyj',
    enfants: [
      {
        displayName: 'Planification territoriale',
        link: 'Planification territoriale',
      },
      {
        displayName: 'Patrimoine de la collectivité',
        link: 'Patrimoine de la collectivité',
      },
      {
        displayName: 'Approvisionnement, énergie, eau, assainissement',
        link: 'Approvisionnement, énergie, eau, assainissement',
      },
      {displayName: 'Mobilité', link: 'Mobilité'},
      {displayName: 'Organisation interne', link: 'Organisation interne'},
      {
        displayName: 'Coopération, communication',
        link: 'Coopération, communication',
      },
      {displayName: 'Lien', link: 'fgh'},
      {displayName: 'Lien', link: 'kghkg'},
      {displayName: 'Lien', link: 'sdfsdfsd'},
      {displayName: 'Lien', link: 'fghfghgf'},
      {displayName: 'Lien', link: 'dfgdfg'},
      {displayName: 'Lien', link: 'hgfhfgh'},
      {displayName: 'Lien', link: 'mnv'},
    ],
  },
  {displayName: 'Lien', link: 'gfhngfn'},
];

export const ActionPage = () => {
  const {actionId} = useParams<{
    collectiviteId: string;
    actionId: string;
  }>();

  const [referentiel, identifiant] = actionId.split('_');

  const actions = useActionDownToTache(referentiel as Referentiel, identifiant);
  const action = actions.find(a => a.id === actionId);

  return (
    <Suspense fallback={renderLoader()}>
      <CollectivitePageLayout sideNavLinks={fakeLinks}>
        {action && <ActionReferentielAvancement action={action} />}
      </CollectivitePageLayout>
    </Suspense>
  );
};
