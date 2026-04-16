import { appLabels } from '@/app/labels/catalog';
import classNames from 'classnames';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { JSX, useState } from 'react';

import { referentielToName } from '@/app/app/labels';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Badge, Button, Icon, Spacer } from '@tet/ui';
import { HistoriqueItem } from './types';

export type HistoriqueDescription = {
  titre: string;
  description: string;
};

type Props = {
  historique: HistoriqueItem;
  nom: string;
  descriptions: HistoriqueDescription[];
  icon?: string;
  detail?: JSX.Element;
  pageLink?: string;
};

const Modification = ({
  historique,
  icon = 'information-fill',
  nom,
  descriptions,
  detail,
  pageLink,
}: Props) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const searchParams = useSearchParams();
  const { modifiedAt: modifiedAtIso, modifiedByNom } = historique;
  const referentielId =
    historique.type !== 'action_statut' &&
    historique.type !== 'action_precision'
      ? null
      : getReferentielIdFromActionId(historique.actionId);

  const referentielNom = referentielId
    ? referentielToName[referentielId]
    : null;
  const modifiedAt = new Date(modifiedAtIso);

  const pageLinkWithPanel = (() => {
    if (!pageLink) return undefined;
    const panel = searchParams.get('panel');
    if (!panel) return pageLink;
    const [pathname, hash] = pageLink.split('#');
    return { pathname, query: { panel }, hash };
  })();

  return (
    <div data-test="item">
      <Badge
        variant="standard"
        type="outlined"
        size="xs"
        title={format(modifiedAt, 'dd MMMM yyyy', { locale: fr })}
      />
      <Spacer height={1} />
      <div className="">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline justify-start gap-2">
            <Icon size="lg" icon={icon} className="text-primary-9" />
            <p className="mb-2 font-bold text-primary-9">{nom}</p>
          </div>

          {!!pageLinkWithPanel && (
            <Button
              icon="arrow-right-line"
              size="xs"
              iconPosition="right"
              variant="underlined"
              className="text-primary-9 text-sm border-b-transparent"
              href={pageLinkWithPanel}
            >
              {appLabels.voirAction}
            </Button>
          )}
        </div>

        <div className="flex flex-col grow overflow-hidden">
          <div className="mb-4" data-test="desc">
            <p className="mb-2 text-sm">
              <span className="text-gray-500">{appLabels.par} : </span>
              {modifiedByNom}
            </p>
            {referentielNom ? (
              <p className="mb-2 text-sm">
                <span className="text-gray-500">
                  {appLabels.referentiel} :{' '}
                </span>
                {referentielNom}
              </p>
            ) : null}
            {descriptions.map((desc) => (
              <p key={desc.titre} className="mb-2 last:mb-0 text-sm">
                <span className="text-gray-500">{desc.titre} : </span>
                {desc.description}
              </p>
            ))}
          </div>
          {detail && (
            <div
              className="mb-4 border-t border-b border-grey-3 text-sm"
              data-test={`detail-${isDetailsOpen ? 'on' : 'off'}`}
            >
              <button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="flex items-center w-full py-4 px-2"
              >
                <div className="font-bold text-primary-9">
                  {isDetailsOpen
                    ? appLabels.masquerDetail
                    : appLabels.afficherDetail}
                </div>
                <Icon
                  size="lg"
                  icon="arrow-down-s-line"
                  className={classNames('ml-auto duration-100', {
                    'rotate-180': isDetailsOpen,
                  })}
                />
              </button>
              {isDetailsOpen && (
                <div className="max-w-full p-2 mb-4">{detail}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modification;
