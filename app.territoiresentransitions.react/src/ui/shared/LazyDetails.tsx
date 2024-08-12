import React, { useState } from 'react';

interface LazyDetailsProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  startOpen: boolean;
  onChange: (opened: boolean) => void;
}

/**
 * A details like component that attaches children on open.
 */
export function LazyDetails({
  startOpen = false,
  onChange = () => undefined,
  ...props
}: LazyDetailsProps) {
  const [open, setOpen] = useState(startOpen);
  return (
    <section className="flex flex-col">
      <header
        className="w-full cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          onChange(!open);
          setOpen(!open);
        }}
      >
        {props.summary}
      </header>
      {open && props.children}
    </section>
  );
}
