import React from 'react';
import Modal from './Modal';

export default {
  component: Modal,
};

export const Defaut = () => (
  <Modal
    externalOpen
    setExternalOpen={() => null}
    render={({labelId, descriptionId}) => {
      return <div>basic</div>;
    }}
  >
    <button className="p-2 bg-gray-200">trigger me</button>
  </Modal>
);

export const Petite = () => (
  <Modal
    size="sm"
    externalOpen
    setExternalOpen={() => null}
    render={({labelId, descriptionId}) => {
      return (
        <div>
          <h4 id={labelId}>Title</h4>
          <p id={descriptionId}>
            Donec vulputate tortor sit amet est posuere gravida. Suspendisse
            eget augue mollis, bibendum orci vel, varius ipsum. Etiam nunc leo,
            suscipit quis dictum nec, blandit vitae nibh. Nulla ultricies dolor
            felis, sed malesuada eros pulvinar ut. Nunc tempor sapien a rutrum
            pellentesque. Maecenas diam dolor, cursus eu turpis vitae, feugiat
            mollis felis. Nam non tellus molestie metus pellentesque interdum.
          </p>
        </div>
      );
    }}
  >
    <button className="p-2 bg-gray-200">trigger me</button>
  </Modal>
);

export const AvecBeaucoupDeContenu = () => (
  <Modal
    size="lg"
    externalOpen
    setExternalOpen={() => null}
    render={({labelId, descriptionId}) => {
      return (
        <div>
          <h1 id={labelId}>Title</h1>
          <p id={descriptionId}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed et
            aliquam sapien, eu scelerisque quam. Nulla dictum eu augue sit amet
            facilisis. Donec interdum nibh nec interdum vestibulum. Integer eu
            sollicitudin justo. Donec pulvinar nisl sit amet ipsum gravida, ut
            scelerisque risus aliquam. Sed aliquet commodo ipsum, in convallis
            nisi tempus eu. Donec varius sem ante. Nulla dignissim, enim quis
            elementum laoreet, leo ante viverra lectus, ac congue tortor ex
            rutrum arcu. Sed dolor odio, ullamcorper a euismod in, sodales at
            diam. Etiam eu neque lobortis, placerat nunc et, hendrerit ligula.
            Ut vitae tortor scelerisque, ultrices lacus id, luctus erat. Fusce
            maximus neque et tristique bibendum. Sed nibh sapien, dictum nec ex
            nec, sagittis aliquam orci. Mauris eleifend tellus non sapien
            vehicula gravida. Fusce non magna at enim consequat lobortis.
            Maecenas vehicula iaculis sem, quis molestie nibh suscipit varius.
            Donec vulputate tortor sit amet est posuere gravida. Suspendisse
            eget augue mollis, bibendum orci vel, varius ipsum. Etiam nunc leo,
            suscipit quis dictum nec, blandit vitae nibh. Nulla ultricies dolor
            felis, sed malesuada eros pulvinar ut. Nunc tempor sapien a rutrum
            pellentesque. Maecenas diam dolor, cursus eu turpis vitae, feugiat
            mollis felis. Nam non tellus molestie metus pellentesque interdum.
            Aenean feugiat bibendum lorem, auctor pellentesque mi pharetra
            pellentesque. Sed et enim venenatis, iaculis mauris at, elementum
            nisl. Maecenas volutpat venenatis interdum. Maecenas rutrum auctor
            arcu ac accumsan. Vestibulum egestas arcu eu magna egestas,
            efficitur mattis libero dignissim. Etiam venenatis fermentum est, eu
            mattis lacus commodo consequat. Suspendisse at mauris at risus
            dignissim auctor ut vel urna. Fusce id tellus laoreet, aliquet ante
            at, viverra justo. Donec volutpat orci vel euismod sagittis.
            Suspendisse sagittis magna sed finibus elementum. Curabitur porta
            consectetur aliquet. Suspendisse vel nunc ex. Donec lorem nibh,
            sodales at pharetra at, feugiat id nisi. Integer convallis aliquam
            sodales. Aenean quis nibh sit amet mauris porta faucibus fermentum
            sit amet urna. Vivamus neque ante, feugiat sit amet dolor eu,
            efficitur faucibus nibh. In vitae urna in massa cursus maximus eu
            vitae lacus. Sed erat quam, lobortis sed ligula at, hendrerit
            aliquet diam.
          </p>
        </div>
      );
    }}
  >
    <button className="p-2 bg-gray-200">trigger me</button>
  </Modal>
);
