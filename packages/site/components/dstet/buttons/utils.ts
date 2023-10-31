import classNames from 'classnames';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outlined'
  | 'white'
  | 'grey';
export type ButtonSize = 'normal' | 'big';

export const getTetButtonClassnames = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'normal',
) => {
  return classNames('fr-btn font-bold shadow-none rounded-[10px]', {
    'fr-btn--sm text-[12px] leading-[15px] py-[12.5px] px-[20px]':
      size === 'normal',
    'text-[16px] leading-[20px] py-[14px] px-[25px]': size === 'big',
    'bg-primary-7 text-white hover:!bg-primary-8 disabled:!bg-primary-4 disabled:!text-primary-3':
      variant === 'primary',
    'bg-secondary-1 text-white hover:!bg-secondary-2': variant === 'secondary',
    'bg-white text-primary-7 border border-solid border-primary-7 hover:!bg-primary-1 hover:!text-primary-8 hover:!border-primary-8 disabled:!bg-white disabled:!text-primary-4 disabled:!border-primary-4':
      variant === 'outlined',
    'bg-white text-primary-7 hover:!bg-primary-1 hover:!text-primary-8 disabled:!bg-white disabled:!text-primary-4':
      variant === 'white',
    'bg-grey-1 text-primary-7 border border-solid border-grey-4 hover:!bg-grey-2 hover:!text-primary-8 disabled:!bg-white disabled:!text-primary-4 disabled:!border-grey-2':
      variant === 'grey',
  });
};
