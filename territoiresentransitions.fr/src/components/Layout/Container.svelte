<script>
  export let classNames
</script>

<div class={ `Container fr-container ${classNames}` }>
    <slot></slot>
</div>

<style>
  @media screen and (min-width: 640px) {
    .Container {
      padding-right: 7rem;
      padding-left: 7rem;
    }
  }
</style>
