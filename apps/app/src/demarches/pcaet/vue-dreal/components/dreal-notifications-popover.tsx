'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@tet/ui';
import { JSX } from 'react';
import { drealNotifications } from '../vue-dreal.mock';
import { DrealFeaturedIcon } from './dreal-featured-icon';

/**
 * Bouton-cloche dans le header → ouvre un popover listant les changements de
 * statut récents des collectivités suivies.
 */
export const DrealNotificationsPopover = (): JSX.Element => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="outlined"
        size="sm"
        icon="notification-3-line"
        title="Notifications"
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-80 p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-grey-2">
        <span className="text-sm font-bold text-primary-10">Notifications</span>
        <span className="text-xs text-grey-6">{drealNotifications.length}</span>
      </div>

      <div className="flex flex-col max-h-96 overflow-y-auto px-2">
        {drealNotifications.map((notif, index) => (
          <div
            key={notif.id}
            className={`flex items-start gap-3 py-3 px-2 ${
              index > 0 ? 'border-t border-grey-2' : ''
            }`}
          >
            <DrealFeaturedIcon tone={notif.tone} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm text-primary-10">{notif.message}</span>
              <span className="text-xs text-grey-6">{notif.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-grey-2">
        <Button variant="underlined" size="sm">
          Tout voir
        </Button>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
);
