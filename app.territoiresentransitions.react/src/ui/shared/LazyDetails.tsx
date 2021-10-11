import React, {useState} from 'react';
import {Chevron} from 'ui/shared/Chevron';

interface LazyDetailsProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  startOpen: boolean;
  onChange: (opened: boolean) => void;
}

/**
 * A details like component that attaches children on open.
 */
export function LazyDetails(props: LazyDetailsProps) {
  const [open, setOpen] = useState(props.startOpen);
  return (
    <section className="flex flex-col">
      <header
        className="w-full cursor-pointer"
        onClick={e => {
          e.preventDefault();
          props.onChange(!open);
          setOpen(!open);
        }}
      >
        {props.summary}
      </header>
      {open && props.children}
    </section>
  );
}

LazyDetails.defaultProps = {
  startOpen: false,
  onChange: () => undefined,
};

interface WithChevronProps {
  headerClassName: string;
  summaryClassName: string;
}

/**
 * A details like component that attaches children on open.
 */
export function LazyDetailsWithChevron(
  props: LazyDetailsProps & WithChevronProps
) {
  const [open, setOpen] = useState(props.startOpen);
  return (
    <section className="flex flex-col">
      <header
        className={props.headerClassName}
        onClick={e => {
          e.preventDefault();
          props.onChange(!open);
          setOpen(!open);
        }}
      >
        <div className={props.summaryClassName}>{props.summary}</div>
        <Chevron direction={open ? 'down' : 'left'} />
      </header>
      {open && props.children}
    </section>
  );
}

LazyDetailsWithChevron.defaultProps = {
  startOpen: false,
  headerClassName: 'w-full cursor-pointer flex flex-row items-bottom',
  summaryClassName: '-mt-1',
  onChange: () => undefined,
};
