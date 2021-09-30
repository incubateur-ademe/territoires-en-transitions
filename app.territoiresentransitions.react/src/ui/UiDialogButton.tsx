import React from 'react';
import Dialog from '@material-ui/core/Dialog';

interface UiDialogButtonProps {
  useFrBtn: boolean;
  buttonClasses?: string;
  title: string;
  children: React.ReactNode;
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultProps = {
  useFrBtn: true,
};

export const UiDialogButton = (props: UiDialogButtonProps) => (
  <div>
    <button
      className={
        `${props.useFrBtn ? 'fr-btn ' : ''}` + `${props.buttonClasses ?? ''}`
      }
      onClick={e => {
        e.preventDefault();
        props.setOpened(true);
      }}
    >
      {props.title}
    </button>
    <Dialog
      open={props.opened}
      onClose={() => props.setOpened(false)}
      maxWidth="md"
      fullWidth={true}
    >
      <div className="p-7 flex flex-col items-center">
        <h3 className="text-center pb-4"> {props.title} </h3>
        <div className="w-3/4">{props.children}</div>
      </div>
    </Dialog>
  </div>
);

UiDialogButton.defaultProps = defaultProps;
