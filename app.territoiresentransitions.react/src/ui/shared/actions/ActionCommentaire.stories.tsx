import {Story, Meta} from '@storybook/react';

import {
  ActionCommentaireField,
  ActionCommentaireFieldProps,
} from './ActionCommentaire';

const Template: Story<ActionCommentaireFieldProps> = args => (
  <ActionCommentaireField {...args} />
);

export default {
  component: ActionCommentaireField,
} as Meta;

// Commentaire associé à une action
export const ExempleAction = Template.bind({});
ExempleAction.parameters = {storyshots: false};
ExempleAction.args = {
  action: {
    type: 'action',
  } as ActionCommentaireFieldProps['action'],
  value: 'mon commentaire',
};

// Commentaire associé à une tâche
export const ExempleTache = Template.bind({});
ExempleTache.parameters = {storyshots: false};
ExempleTache.args = {
  action: {
    type: 'tache',
  } as ActionCommentaireFieldProps['action'],
  value: 'mon commentaire',
};

// Le champ est redimensionné en fonction de la longueur du texte initial
export const CommentaireLong = Template.bind({});
CommentaireLong.parameters = {storyshots: false};
CommentaireLong.args = {
  action: {
    type: 'tache',
  } as ActionCommentaireFieldProps['action'],
  value: `mon commentaire vraiment très long ! 
        
          Lorem ipsum dolor sit amet. A quia animi aut aspernatur totam aut laboriosam enim qui velit repudiandae. Non ratione provident est mollitia voluptatibus ut quibusdam totam hic minima rerum et rerum reiciendis ab officia beatae et voluptate dolore. Eos labore exercitationem id dolorem dolorum eos itaque sapiente et sapiente ducimus aut pariatur autem. Ut pariatur aliquid non laborum facilis ab natus sint sit enim quia ut fuga earum nam debitis nihil est enim dolores. Sit fugiat molestiae est quia possimus nam magni quisquam hic voluptas sint. Ex illo quis ut illum quasi sit quia harum eum consequuntur veniam ut possimus harum.
          
          Et tempora minus vel deleniti inventore ea omnis enim. Et illo aspernatur qui ipsa quaerat ex magnam pariatur et maiores quis eos quia quia et rerum velit? Ab eius  hic nihil omnis est laudantium libero. Et corrupti labore ut necessitatibus omnis in accusamus aspernatur aut tempora accusantium et soluta provident qui distinctio explicabo`,
};
