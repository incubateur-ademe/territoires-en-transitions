export const designTokens = {
  colors: {
    bf500: '#000091',
    grey425: '#666',
    grey975: '#F6F6F6',
    primary: {
      0: '#FBFCFE',
      1: '#F4F5FD',
      2: '#F0F0FE',
      3: '#E1E1FD',
      4: '#C3C3FB',
      5: '#A5A5F8',
      6: '#8888F6',
      DEFAULT: '#6A6AF4',
      7: '#6A6AF4',
      8: '#5555C3',
      9: '#404092',
      10: '#2A2A62',
      11: '#151531',
    },
    secondary: {
      1: '#F4C447',
      2: '#FFE4A8',
    },
    new: {
      1: '#B88729',
      2: '#FFE8BD',
    },
    success: {
      DEFAULT: '#48A775',
      1: '#48A775',
      2: '#E4FCEF',
      3: '#3AD483',
    },
    error: {
      1: '#F55B5B',
      2: '#FFD8D8',
      3: '#FF9789',
    },
    warning: {
      1: '#FFA903',
      2: '#FFF5DF',
      3: '#FBC55C',
    },
    info: {
      1: '#4380F5',
      2: '#EEF4FF',
      3: '#91B2EE',
    },
    grey: {
      1: '#FDFDFD',
      2: '#F9F9F9',
      3: '#EEEEEE',
      4: '#DDDDDD',
      5: '#CECECE',
      6: '#929292',
      7: '#8A8A8A',
      8: '#666666',
      9: '#535252',
      10: '#161616',
    },
    'orange-1': '#F28E40',
    overlay: 'hsla(240, 40%, 27%, 0.5)',
  },
  fontFamily: {
    sans: ['Marianne', 'arial', 'sans-serif'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  boxShadow: {
    button: '0 2px 4px 0 rgba(0,0,0,0.05)',
    card: '2px 2px 10px 0 rgba(233, 233, 233, 0.9)',
    't-sm': '0 -1px 2px 0 rgba(0, 0, 0, 0.05)',
    't-md':
      '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    't-lg':
      '0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    't-xl':
      '0 -20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    't-2xl': '0 -25px 50px -12px rgba(0, 0, 0, 0.25)',
    't-3xl': '0 -35px 60px -15px rgba(0, 0, 0, 0.3)',
  },
  screens: {
    '2xl': '1440px',
  },
  maxWidth: {
    '8xl': '90rem',
  },
  maxHeight: {
    '80vh': '80vh',
  },
  zIndex: {
    modal: '1000',
    dropdown: '999',
    tooltip: '1001',
  },
  animation: {
    'spin-slow': 'spin 1.5s linear infinite',
  },
} as const;

export type DesignTokens = typeof designTokens;

export type BadgeVariant =
  | 'default'
  | 'standard'
  | 'high'
  | 'success'
  | 'warning'
  | 'new'
  | 'error'
  | 'info'
  | 'grey'
  | 'custom';

export type BadgeType = 'outlined' | 'solid' | 'inverted';

export type BadgeSize = 'xs' | 'sm';

type BadgeClassnameSet = {
  text: string;
  background: string;
  border: string;
  icon: string;
};

export const badgeClassnames: Record<
  BadgeVariant,
  Record<BadgeType, BadgeClassnameSet>
> = {
  default: {
    outlined: { text: 'text-grey-8', background: 'bg-white', border: 'border-grey-5', icon: 'text-primary-7' },
    solid: { text: 'text-grey-8', background: 'bg-primary-1', border: 'border-grey-5', icon: 'text-primary-7' },
    inverted: { text: 'text-white', background: 'bg-primary-7', border: 'border-primary-7', icon: 'text-white' },
  },
  standard: {
    outlined: { text: 'text-primary-7', background: 'bg-white', border: 'border-grey-5', icon: 'text-primary-7' },
    solid: { text: 'text-primary-7', background: 'bg-primary-2', border: 'border-primary-7', icon: 'text-primary-7' },
    inverted: { text: 'text-white', background: 'bg-primary-7', border: 'border-primary-7', icon: 'text-white' },
  },
  high: {
    outlined: { text: 'text-primary-9', background: 'bg-white', border: 'border-primary-9', icon: 'text-primary-9' },
    solid: { text: 'text-primary-9', background: 'bg-primary-2', border: 'border-primary-9', icon: 'text-primary-9' },
    inverted: { text: 'text-white', background: 'bg-primary-9', border: 'border-primary-9', icon: 'text-white' },
  },
  success: {
    outlined: { text: 'text-success-1', background: 'bg-white', border: 'border-grey-5', icon: 'text-success-1' },
    solid: { text: 'text-success-1', background: 'bg-success-2', border: 'border-success-1', icon: 'text-success-1' },
    inverted: { text: 'text-white', background: 'bg-success-1', border: 'border-success-1', icon: 'text-white' },
  },
  warning: {
    outlined: { text: 'text-warning-1', background: 'bg-white', border: 'border-grey-5', icon: 'text-warning-1' },
    solid: { text: 'text-warning-1', background: 'bg-warning-2', border: 'border-warning-1', icon: 'text-warning-1' },
    inverted: { text: 'text-white', background: 'bg-warning-1', border: 'border-warning-1', icon: 'text-white' },
  },
  new: {
    outlined: { text: 'text-new-1', background: 'bg-white', border: 'border-grey-5', icon: 'text-new-1' },
    solid: { text: 'text-new-1', background: 'bg-new-2', border: 'border-new-1', icon: 'text-new-1' },
    inverted: { text: 'text-white', background: 'bg-new-1', border: 'border-new-1', icon: 'text-white' },
  },
  error: {
    outlined: { text: 'text-error-1', background: 'bg-white', border: 'border-grey-5', icon: 'text-error-1' },
    solid: { text: 'text-error-1', background: 'bg-error-2', border: 'border-error-1', icon: 'text-error-1' },
    inverted: { text: 'text-white', background: 'bg-error-1', border: 'border-error-1', icon: 'text-white' },
  },
  info: {
    outlined: { text: 'text-info-1', background: 'bg-white', border: 'border-grey-5', icon: 'text-info-1' },
    solid: { text: 'text-info-1', background: 'bg-info-2', border: 'border-info-1', icon: 'text-info-1' },
    inverted: { text: 'text-white', background: 'bg-info-1', border: 'border-info-1', icon: 'text-white' },
  },
  grey: {
    outlined: { text: 'text-grey-8', background: 'bg-white', border: 'border-grey-5', icon: 'text-grey-8' },
    solid: { text: 'text-grey-8', background: 'bg-grey-3', border: 'border-grey-8', icon: 'text-grey-8' },
    inverted: { text: 'text-white', background: 'bg-grey-8', border: 'border-grey-8', icon: 'text-white' },
  },
  custom: {
    outlined: { text: '', background: '', border: '', icon: '' },
    solid: { text: '', background: '', border: '', icon: '' },
    inverted: { text: '', background: '', border: '', icon: '' },
  },
};
