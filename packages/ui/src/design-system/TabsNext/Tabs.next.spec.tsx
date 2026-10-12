import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsList, TabsPanel, TabsTab } from './Tabs.next';

describe('TabsPanel', () => {
  it('expose son élément tabpanel par la ref', () => {
    const panelRef = createRef<HTMLDivElement>();

    render(
      <Tabs>
        <TabsList>
          <TabsTab label="Premier" isActive onClick={() => undefined} />
        </TabsList>
        <TabsPanel ref={panelRef}>Contenu</TabsPanel>
      </Tabs>
    );

    expect(panelRef.current).toBe(screen.getByRole('tabpanel'));
  });
});
