/*
  Réalise un "snapshot testing" de toutes les stories du storybook
  Ref: https://github.com/storybookjs/storybook/tree/master/addons/storyshots/storyshots-core
*/

import initStoryshots, {
  Stories2SnapsConverter,
} from '@storybook/addon-storyshots';
import {act, create} from 'react-test-renderer';

const converter = new Stories2SnapsConverter();

// Les tests contenant ces mots clés sont skippés.
const exclusions = ['floating', 'modal'];

initStoryshots({
  asyncJest: true,
  // fonction de test spécifique pour éviter certains avertissements
  // Ref: https://github.com/storybookjs/storybook/issues/7745
  test: async ({story, context, done}) => {
    const filename = '../' + converter.getSnapshotFileName(context);
    if (!filename || !done) {
      return;
    }

    for (const exclusion of exclusions) {
      if (filename.toLowerCase().includes(exclusion)) {
        done();
        return;
      }
    }

    // rendu de la story
    const renderer = create(story.render());

    // attends le changement d'état
    await act(() => new Promise(resolve => setTimeout(resolve)));

    // vérifie le storyshot
    expect(renderer.toJSON()).toMatchSpecificSnapshot(filename);

    renderer.unmount();
    done();
  },
});
