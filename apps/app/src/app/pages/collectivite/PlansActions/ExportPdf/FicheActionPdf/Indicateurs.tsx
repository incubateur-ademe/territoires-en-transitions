import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import {
  Badge,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { htmlToText } from '@/domain/utils';
import classNames from 'classnames';
import { TIndicateurDefinition } from '../../../Indicateurs/types';

type IndicateurCardProps = {
  indicateur: TIndicateurDefinition;
};

const IndicateurCard = ({ indicateur }: IndicateurCardProps) => {
  const { titre, unite, participationScore, estPerso, hasOpenData } =
    indicateur;

  return (
    <Card wrap={false} gap={1.5} className="w-[49%] p-3">
      <Title variant="h6" className="text-primary-10">
        {titre}
      </Title>
      <Paragraph className="text-grey-6">({unite})</Paragraph>

      <Stack gap={1.5} direction="row">
        {estPerso && (
          <Badge
            title="Indicateur personnalisé"
            state="success"
            size="sm"
            light
            uppercase
          />
        )}

        {hasOpenData && (
          <Badge title="Open Data" state="standard" size="sm" light uppercase />
        )}
      </Stack>

      {participationScore && (
        <Stack gap={1} className="mt-auto">
          <Divider className="h-[0.5px]" />
          <Paragraph className="text-[0.6rem] text-grey-6">
            Participe au score Climat Air Énergie
          </Paragraph>
        </Stack>
      )}
    </Card>
  );
};

type IndicateursProps = {
  fiche: Fiche;
  indicateursListe: TIndicateurDefinition[] | undefined | null;
};

const Indicateurs = ({ fiche, indicateursListe }: IndicateursProps) => {
  const { objectifs, effetsAttendus } = fiche;

  const emptyObjectifs = !objectifs || objectifs.length === 0;
  const emptyEffetsAttendus = !effetsAttendus || effetsAttendus.length === 0;

  if (
    emptyObjectifs &&
    emptyEffetsAttendus &&
    (!indicateursListe || indicateursListe.length === 0)
  )
    return null;

  const firstIndicateursList = indicateursListe?.slice(0, 2);
  const otherIndicateursList = indicateursListe?.slice(2);

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        <Title variant="h5" className="text-primary-8 uppercase">
          Indicateurs de suivi
        </Title>

        {/* Objectifs */}
        <Paragraph
          className={classNames({
            'text-grey-7': emptyObjectifs,
          })}
        >
          <Paragraph className="text-primary-9 font-bold uppercase">
            Objectifs :{' '}
          </Paragraph>
          {emptyObjectifs ? 'Non renseignés' : htmlToText(objectifs)}
        </Paragraph>

        {/* Effets attendus */}
        {emptyEffetsAttendus ? (
          <Paragraph className="text-grey-7">
            <Paragraph className="text-primary-9 font-bold uppercase">
              Effets attendus :{' '}
            </Paragraph>
            Non renseignés
          </Paragraph>
        ) : (
          <Stack gap={1.5} direction="row" className="flex-wrap items-center">
            <Paragraph className="text-primary-9 font-bold uppercase">
              Effets attendus :
            </Paragraph>
            {effetsAttendus.map((res) => (
              <Badge key={res.nom} title={res.nom} state="standard" />
            ))}
          </Stack>
        )}

        {/* Liste des indicateurs */}
        {firstIndicateursList && firstIndicateursList.length > 0 && (
          <Stack gap={2.5}>
            <Stack wrap={false} gap={1.5}>
              <Paragraph className="text-primary-9 font-bold uppercase">
                Indicateurs associés :
              </Paragraph>
              <Stack gap={2.5} direction="row" className="flex-wrap">
                {firstIndicateursList.map((indicateur) => (
                  <IndicateurCard key={indicateur.id} indicateur={indicateur} />
                ))}
              </Stack>
            </Stack>
            {otherIndicateursList && otherIndicateursList.length > 0 && (
              <Stack gap={2.5} direction="row" className="flex-wrap">
                {otherIndicateursList.map((indicateur) => (
                  <IndicateurCard key={indicateur.id} indicateur={indicateur} />
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </>
  );
};

export default Indicateurs;
