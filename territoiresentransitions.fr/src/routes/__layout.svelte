<script>
  import Header from '../components/Header.svelte'
  import Footer from '../components/Footer.svelte'
</script>

<Header />
<slot></slot>
<Footer />

<style global src="../../node_modules/@gouvfr/dsfr/dist/css/dsfr.css"></style>
