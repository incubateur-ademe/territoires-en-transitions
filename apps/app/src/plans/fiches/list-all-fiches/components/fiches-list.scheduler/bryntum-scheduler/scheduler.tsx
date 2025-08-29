'use client';

import dynamic from 'next/dynamic';

import { SchedulerProps } from './scheduler.base';

const SchedulerBase = dynamic(() => import('./scheduler.base'), {
  ssr: false,
});

export const Scheduler = (props: SchedulerProps) => {
  return <SchedulerBase {...props} />;
};
