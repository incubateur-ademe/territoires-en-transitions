import classNames from 'classnames';

type EmbededVideoProps = {
  url: string;
  title?: string;
  className?: string;
};

const EmbededVideo = ({url, title, className}: EmbededVideoProps) => {
  let embedLink = '';

  if (url.includes('youtu.be') || url.includes('youtube')) {
    if (url.includes('embed')) embedLink = url;
    else if (url.includes('watch')) {
      embedLink = url.split('watch?v=').join('embed/').split('&')[0];
    } else {
      embedLink = url.split('youtu.be').join('www.youtube.com/embed');
    }
  } else if (url.includes('dailymotion') || url.includes('dai.ly')) {
    if (url.includes('embed')) embedLink = url;
    else {
      embedLink = `https://www.dailymotion.com/embed/video/${
        url.split('/')[url.split('/').length - 1]
      }`;
    }
  }

  return embedLink.length ? (
    <iframe
      className={classNames('aspect-video w-full mx-auto', className)}
      src={embedLink}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      title={title ?? ''}
    />
  ) : null;
};

export default EmbededVideo;
