import {Meta, StoryObj} from '@storybook/nextjs-vite';
import {Tooltip} from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

/** Tooltip par défaut, sans aucune props renseignée. */
export const Default: Story = {
  render: () => (
    <Tooltip label="Message">
      <div className="bg-primary-1 py-2 px-3 w-fit mt-10">
        Survoler pour voir l'info bulle
      </div>
    </Tooltip>
  ),
};

/** Tooltip avec différentes valeurs de placement. */
export const Placement: Story = {
  render: () => (
    <div className="flex items-center">
      <div className="my-10 flex flex-col gap-2">
        <div className="flex gap-2">
          <Tooltip label="Message" placement="top-start">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              top-start
            </div>
          </Tooltip>
          <Tooltip label="Message" placement="top">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">top</div>
          </Tooltip>
          <Tooltip label="Message" placement="top-end">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              top-end
            </div>
          </Tooltip>
        </div>

        <div className="flex gap-2">
          <Tooltip label="Message" placement="bottom-start">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              bottom-start
            </div>
          </Tooltip>
          <Tooltip label="Message" placement="bottom">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              bottom
            </div>
          </Tooltip>
          <Tooltip label="Message" placement="bottom-end">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              bottom-end
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="mx-20 flex flex-col gap-2">
        <div className="flex gap-2">
          <Tooltip label="Message" placement="left-start">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              left-start
            </div>
          </Tooltip>
          <Tooltip label="Message" placement="right-start">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              right-start
            </div>
          </Tooltip>
        </div>

        <div className="flex gap-2">
          <Tooltip label="Message" placement="left">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">left</div>
          </Tooltip>
          <Tooltip label="Message" placement="right">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">right</div>
          </Tooltip>
        </div>

        <div className="flex gap-2">
          <Tooltip label="Message" placement="left-end">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              left-end
            </div>
          </Tooltip>
          <Tooltip label="Message" placement="right-end">
            <div className="bg-primary-1 py-2 px-3 w-32 text-center">
              right-end
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};

/** Tooltip avec texte long. */
export const LongText: Story = {
  render: () => (
    <Tooltip label="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin viverra erat non luctus porta. Aliquam vitae maximus enim, ut elementum arcu. Fusce euismod risus non eros sodales, nec sollicitudin justo rhoncus. Nulla commodo mauris vitae lectus elementum, sed iaculis elit tristique. Nam nec quam non quam viverra mattis vel vitae lorem. Etiam a ante sit amet urna elementum pretium et in enim. Mauris molestie dolor non sapien luctus, sed sollicitudin justo consequat.">
      <div className="bg-primary-1 py-2 px-3 w-fit mt-20">
        Survoler pour voir l'info bulle
      </div>
    </Tooltip>
  ),
};

/** Tooltip avec texte long avec largeur fixe. */
export const LongTextWithFixedWidth: Story = {
  render: () => (
    <Tooltip
      label={
        <div className="w-96">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin viverra
          erat non luctus porta. Aliquam vitae maximus enim, ut elementum arcu.
          Fusce euismod risus non eros sodales, nec sollicitudin justo rhoncus.
          Nulla commodo mauris vitae lectus elementum, sed iaculis elit
          tristique. Nam nec quam non quam viverra mattis vel vitae lorem. Etiam
          a ante sit amet urna elementum pretium et in enim. Mauris molestie
          dolor non sapien luctus, sed sollicitudin justo consequat.
        </div>
      }
    >
      <div className="bg-primary-1 py-2 px-3 w-fit mt-32">
        Survoler pour voir l'info bulle
      </div>
    </Tooltip>
  ),
};

/** Tooltip sans flèche. */
export const WithoutArrow: Story = {
  render: () => (
    <Tooltip label="Message" withArrow={false}>
      <div className="bg-primary-1 py-2 px-3 w-fit mt-10">
        Survoler pour voir l'info bulle
      </div>
    </Tooltip>
  ),
};

/** Tooltip activée par click. */
export const ActivatedByClick: Story = {
  render: () => (
    <Tooltip label="Message" activatedBy="click">
      <div className="bg-primary-1 py-2 px-3 w-fit mt-10">
        Cliquer pour voir l'info bulle
      </div>
    </Tooltip>
  ),
};

/** Tooltip avec contenu custom. */
export const CustomContent: Story = {
  render: () => (
    <Tooltip
      label={
        <div className="w-52">
          <h6>Titre</h6>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
            viverra erat non luctus porta.
          </p>
          <div className="mt-4">
            <div className="flex flex-row gap-1 items-center">
              <div className="w-3 h-3 bg-primary-7" />
              <div>Lorem ipsum dolor sit amet</div>
            </div>
            <div className="flex flex-row gap-1 items-center">
              <div className="w-3 h-3 bg-secondary-1" />
              <div>Lorem ipsum dolor sit amet</div>
            </div>
          </div>
        </div>
      }
    >
      <div className="bg-primary-1 py-2 px-3 w-fit mt-32">
        Survoler pour voir l'info bulle
      </div>
    </Tooltip>
  ),
};
