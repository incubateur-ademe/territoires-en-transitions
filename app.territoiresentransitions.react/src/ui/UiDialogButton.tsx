import React from 'react';
import Dialog from '@mui/material/Dialog';
import classNames from 'classnames';

interface UiDialogButtonProps {
  useFrBtn: boolean;
  buttonClasses?: string;
  dialogClasses?: string;
  title: string;
  buttonLabel?: string;
  children: React.ReactNode;
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  'data-test'?: string;
}

export const UiDialogButton = ({
  useFrBtn = true,
  ...props
}: UiDialogButtonProps) => (
  <div onClick={(event) => event.stopPropagation()}>
    <button
      data-test={`btn-${props['data-test']}`}
      className={classNames({ 'fr-btn': useFrBtn }, props.buttonClasses)}
      onClick={(e) => {
        e.preventDefault();
        props.setOpened(true);
      }}
    >
      {props.buttonLabel || props.title}
    </button>
    <Dialog
      open={props.opened}
      onClose={() => props.setOpened(false)}
      maxWidth="md"
      fullWidth={true}
    >
      <div
        data-test={`dialog-${props['data-test']}`}
        className={`p-7 flex flex-col items-center ${
          props.dialogClasses ?? ''
        }`}
      >
        <h3 className="text-center pb-4"> {props.title} </h3>
        <div className="w-3/4">{props.children}</div>
      </div>
    </Dialog>
  </div>
);
