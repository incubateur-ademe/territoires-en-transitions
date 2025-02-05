import { preset } from '@/ui/tailwind-preset';

export const PictoWarning = ({
  className,
  width = '80',
  height = '80',
  primaryColor = preset.theme.extend.colors.primary['4'],
  warningColor = preset.theme.extend.colors.warning['3'],
}: {
  className?: string;
  width?: string;
  height?: string;
  primaryColor?: string;
  warningColor?: string;
}) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M68 13C67.4486 13 67 12.5514 67 12C67 11.4486 67.4486 11 68 11C68.5514 11 69 11.4486 69 12C69 12.5514 68.5514 13 68 13Z"
      fill="#ECECFE"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M41 76C40.4486 76 40 75.5514 40 75C40 74.4486 40.4486 74 41 74C41.5514 74 42 74.4486 42 75C42 75.5514 41.5514 76 41 76Z"
      fill="#ECECFE"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M15 10C14.4486 10 14 9.5514 14 9C14 8.44855 14.4486 8 15 8C15.5514 8 16 8.44855 16 9C16 9.5514 15.5514 10 15 10Z"
      fill="#ECECFE"
    />
    <path
      d="M42 34C42 32.8954 41.1046 32 40 32C38.8954 32 38 32.8954 38 34V50C38 51.1046 38.8954 52 40 52C41.1046 52 42 51.1046 42 50V34Z"
      fill={warningColor}
    />
    <path
      d="M42 58C42 56.8954 41.1046 56 40 56C38.8954 56 38 56.8954 38 58C38 59.1046 38.8954 60 40 60C41.1046 60 42 59.1046 42 58Z"
      fill={warningColor}
    />
    <path
      d="M39.1056 12.5528C39.4547 11.8545 40.4171 11.8178 40.8308 12.4425L40.8944 12.5528L67.8944 66.5528C68.2094 67.1827 67.792 67.918 67.1151 67.9936L67 68H59C58.4477 68 58 67.5523 58 67C58 66.4872 58.3861 66.0645 58.8834 66.0067L59 66H65.381L40 15.236L14.618 66H53C53.5128 66 53.9355 66.386 53.9933 66.8834L54 67C54 67.5128 53.614 67.9355 53.1166 67.9933L53 68H13C12.2958 68 11.8247 67.2979 12.0598 66.6586L12.1056 66.5528L39.1056 12.5528Z"
      fill={primaryColor}
    />
    <path
      d="M60 46C59.4486 46 59 45.5514 59 45C59 44.4486 59.4486 44 60 44C60.5514 44 61 44.4486 61 45C61 45.5514 60.5514 46 60 46Z"
      fill={primaryColor}
    />
    <path
      d="M62.8363 48.4515C62.5622 48.0325 62.0115 47.8762 61.5528 48.1056C61.0588 48.3526 60.8586 48.9532 61.1056 49.4472L68.1056 63.4472L68.1638 63.5485C68.4378 63.9675 68.9885 64.1238 69.4472 63.8944C69.9412 63.6474 70.1414 63.0468 69.8944 62.5528L62.8944 48.5528L62.8363 48.4515Z"
      fill={primaryColor}
    />
  </svg>
);
