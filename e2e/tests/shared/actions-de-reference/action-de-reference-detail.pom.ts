import { expect, Locator, Page } from '@playwright/test';
import type { ActionDeReference } from '@tet/domain/shared';

export class ActionDeReferenceDetailPom {
  readonly interestedButton: Locator;
  readonly misesEnOeuvreList: Locator;
  readonly noMiseEnOeuvreMessage: Locator;

  constructor(readonly page: Page) {
    this.interestedButton = page.getByRole('button', {
      name: "Ça m'intéresse",
    });
    this.misesEnOeuvreList = page
      .getByRole('heading', { name: 'Mises en œuvre' })
      .locator('xpath=following-sibling::ul');
    this.noMiseEnOeuvreMessage = page.getByText(
      "Aucune collectivité n'a encore partagé d'action liée."
    );
  }

  url({
    collectiviteId,
    actionDeReferenceId,
  }: {
    readonly collectiviteId: number;
    readonly actionDeReferenceId: ActionDeReference['id'];
  }): string {
    return `/collectivite/${collectiviteId}/actions-reference/${actionDeReferenceId}`;
  }

  async open({
    collectiviteId,
    action,
  }: {
    readonly collectiviteId: number;
    readonly action: ActionDeReference;
  }): Promise<void> {
    await this.page.goto(
      this.url({ collectiviteId, actionDeReferenceId: action.id })
    );
    await expect(
      this.page.getByRole('heading', { level: 1, name: action.titre })
    ).toBeVisible();
  }

  miseEnOeuvre(ficheTitre: string): Locator {
    return this.misesEnOeuvreList
      .getByRole('listitem')
      .filter({ hasText: ficheTitre });
  }
}
