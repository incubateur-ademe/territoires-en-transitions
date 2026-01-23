import { expect, Locator, Page } from '@playwright/test';
import assert from 'assert';

export class DropdownPom {
  constructor(public readonly page: Page, public readonly dropdown: Locator) {}

  async selectOption(optionName: string) {
    await this.dropdown.isVisible();
    await this.dropdown.click();
    const option = this.page.getByRole('button', { name: optionName });
    await expect(option).toBeVisible();
    await option.click();

    // pour que le dropdown se ferme après avoir sélectionné une option
    // il faut appuyer sur Escape :
    //    this.dropdown.press('Escape');
    // ou cliquer en dehors du dropdown
    // pb: Escape ne fonctionne pas quand le dropdown est
    // dans une de nos modales (ferme la modale si elle n'a pas l'option `disableDismiss`)
    const box = await this.dropdown.boundingBox();
    assert(box, 'Cannot get dropdown bounding box');
    await this.page.mouse.click(box.x - 10, box.y);
  }
}
