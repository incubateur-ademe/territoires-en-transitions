<script>
  export let mesureId
  export let mesureName
</script>

<main>
  <a
    class="bg-white p-4 rounded my-4 grid grid-cols-1 lg:grid-cols-12 lg:gap-1"
    href="mesure_personnalisee?id={mesureId}.html"
  >
    <h3 class="lg:col-span-8 text-xl font-semibold mb-6 pr-28">
      {mesureName}
    </h3>
  </a>
</main>