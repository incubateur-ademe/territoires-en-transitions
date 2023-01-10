import Header from '@codegouvfr/react-dsfr/Header';

const AppHeader = () => (
  <Header
    brandTop={
      <>
        République
        <br />
        Française
      </>
    }
    homeLinkProps={{
      href: '/',
      title: 'Territoires en Transitions',
    }}
    navigation={[
      {
        linkProps: {
          href: '/stats',
          target: '_self',
        },
        text: 'Stats',
      },
    ]}
  />
);

export default AppHeader;
