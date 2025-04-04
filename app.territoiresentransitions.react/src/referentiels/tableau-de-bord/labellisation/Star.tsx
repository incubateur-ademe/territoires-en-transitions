import classNames from 'classnames';

export const Star = ({
  fill,
  title,
  className,
}: {
  fill: string;
  title?: string;
  className?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="23"
    viewBox="0 0 24 23"
    fill="none"
    className={classNames('w-10 h-10', className)}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M12.5241 19.1395C12.2027 18.9417 11.7973 18.9417 11.4759 19.1395L7.10838 21.8271C6.37199 22.2802 5.44648 21.6484 5.60025 20.7975L6.6281 15.11C6.68587 14.7903 6.58474 14.4624 6.35691 14.2308L2.40976 10.2185C1.83054 9.62976 2.17435 8.63241 2.99334 8.52563L8.16625 7.85121C8.51932 7.80517 8.82129 7.57487 8.95907 7.24655L11.0779 2.19737C11.4209 1.37997 12.5791 1.37997 12.9221 2.19737L15.0409 7.24655C15.1787 7.57487 15.4807 7.80517 15.8338 7.85121L21.0067 8.52563C21.8256 8.63241 22.1695 9.62976 21.5902 10.2185L17.6431 14.2308C17.4153 14.4624 17.3141 14.7903 17.3719 15.11L18.3998 20.7975C18.5535 21.6484 17.628 22.2802 16.8916 21.8271L12.5241 19.1395Z"
      fill={fill}
    />
  </svg>
);

export const GreyStar = (props: { title?: string; className?: string }) => (
  <Star {...props} fill="#C5C5C5" />
);
export const BlueStar = (props: { title?: string; className?: string }) => (
  <Star {...props} fill="#0063CB" />
);
export const GreenStar = (props: { title?: string; className?: string }) => (
  <Star {...props} fill="#00A95F" />
);
export const RedStar = (props: { title?: string; className?: string }) => (
  <Star {...props} fill="#E40D18" />
);
