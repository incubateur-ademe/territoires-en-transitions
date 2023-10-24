import React from 'react';
import {Meta} from '@storybook/react';
import {Tooltip} from './Tooltip';
import DSTetTooltip from './DSTetTooltip';

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
    label={() => (
      <p>
        Libellé html
        <ul>
          <li>super</li>
          <li>top</li>
        </ul>
      </p>
    )}
  >
    <button>un élément avec une info-bulle au survol</button>
  </Tooltip>
);

export const ActifAuClic = () => (
  <Tooltip label="libellé infobulle" activatedBy="click">
    <div>un élément avec une info-bulle au clic</div>
  </Tooltip>
);

export const DStet = () => (
  <div className="mb-32">
    <DSTetTooltip label={() => <p>libellé infobulle</p>}>
      <button>un élément avec une info-bulle au survol</button>
    </DSTetTooltip>
  </div>
);
