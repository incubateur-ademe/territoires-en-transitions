import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useDownloadFile } from '@/app/utils/useDownloadFile';
import { EmptyCard, Event, useEventTracker } from '@tet/ui';
import { DOC_METHODO } from '../../../../indicateurs/trajectoires/trajectoire-constants';
import DbErrorPicto from './db-error.svg';
import { useTelechargementModele } from './useTelechargementModele';

export const MethodologyNotApplicableCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const { mutate: download, isPending: isDownloading } =
    useTelechargementModele();
  const { mutate: downloadFile, isPending: isDownloadingFile } =
    useDownloadFile();
  const trackEvent = useEventTracker();

  return (
    <EmptyCard
      picto={(props) => <DbErrorPicto {...props} />}
      title={title}
      description={description}
      subTitle={appLabels.trajectoireMethodologieMiseADispositionModele}
      actions={[
        {
          children: isDownloading ? (
            <>
              {appLabels.telechargementEnCours} <SpinnerLoader />
            </>
          ) : (
            appLabels.trajectoireTelechargerModeleXlsx
          ),
          onClick: () => download(),
          disabled: isDownloading,
        },
        {
          children: appLabels.trajectoireTelechargerMethodologiePdf,
          onClick: () => {
            trackEvent(Event.trajectoire.downloadSnbcFile, {
              file: 'methodo',
            });
            downloadFile(DOC_METHODO);
          },
          disabled: isDownloadingFile,
          variant: 'outlined',
        },
      ]}
    />
  );
};
