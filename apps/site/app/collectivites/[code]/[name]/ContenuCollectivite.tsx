import TestimonialSlideshow from '@/site/components/slideshow/TestimonialSlideshow';
import EmbededVideo from '@/site/components/video/EmbededVideo';
import type { Temoignage } from '@/site/src/strapi/types';
import classNames from 'classnames';
import type { TexteCollectivite } from '../../utils';
import ActionCollectivite from './ActionCollectivite';

type ContenuCollectiviteProps = {
  contenu: {
    video: string | null;
    video_en_haut: boolean;
    temoignages: Temoignage[];
    actions: TexteCollectivite[];
  };
};

const ContenuCollectivite = ({
  contenu: { video, video_en_haut, temoignages, actions },
}: ContenuCollectiviteProps) => {
  return (
    <div className="col-span-full md:col-span-7 lg:col-span-8 flex flex-col gap-10 xl:gap-12">
      {!!video && (
        <EmbededVideo
          url={video}
          className={classNames('w-full md:rounded-[10px]', {
            'order-last': !video_en_haut,
          })}
        />
      )}
      {temoignages.length > 0 && (
        <TestimonialSlideshow
          contenu={temoignages}
          className="rounded-[10px] bg-grey-1 border-x-[3px] border-orange-1"
          autoSlideDelay={12000}
          autoSlide
        />
      )}
      {actions.length > 0 &&
        actions.map((action) => (
          <ActionCollectivite key={action.id} action={action} />
        ))}
    </div>
  );
};

export default ContenuCollectivite;
