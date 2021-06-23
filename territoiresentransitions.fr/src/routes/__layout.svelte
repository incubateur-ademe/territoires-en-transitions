<script>
  import Header from '$components/layout/Header.svelte'
  import Footer from '../components/Footer.svelte'
  import Nav from '../components/Header/Nav.svelte'
</script>

<Header>
  <Nav slot="nav"></Nav>
</Header>

<slot></slot>
<Footer />

<style global src="../../node_modules/@gouvfr/dsfr/dist/css/dsfr.css"></style>
