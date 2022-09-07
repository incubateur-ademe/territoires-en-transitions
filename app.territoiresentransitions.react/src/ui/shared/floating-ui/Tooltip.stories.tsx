import React from 'react';
import {Meta} from '@storybook/react';
import {Tooltip} from './Tooltip';

export default {
  component: Tooltip,
} as Meta;

export const Simple = () => (
  <Tooltip label="libellé infobulle">
    <button>un élément avec une info-bulle au survol</button>
  </Tooltip>
);

export const AvecHTML = () => (
  <Tooltip
    label={`
      <p>
        Libellé html
        <ul>
          <li>super</li>
          <li>top</li>
        </ul>
      </p>
    `}
  >
    <button>un élément avec une info-bulle au survol</button>
  </Tooltip>
);

export const ActifAuClic = () => (
  <Tooltip label="libellé infobulle" activatedBy="click">
    <div>un élément avec une info-bulle au clic</div>
  </Tooltip>
);
