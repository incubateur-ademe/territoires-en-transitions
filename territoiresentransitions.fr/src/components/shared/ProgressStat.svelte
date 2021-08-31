<script>
  export let position = 'left';
  let state = 'alert';

  export let percentage = 0;

  const updateState = () => {
    if (percentage < 34) {
      state = 'alert';
    }
    if (percentage > 35 && percentage < 49) {
      state = 'warning';
    }
    if (percentage > 50 && percentage < 64) {
      state = 'ok';
    }
    if (percentage > 65 && percentage < 74) {
      state = 'good';
    }
    if (percentage > 75 && percentage < 100) {
      state = 'best';
    }
  };
  $: percentage, updateState();
</script>

<div class={`progressBar--position-${position} progressBar--status-${state}`}>
  <strong>0%</strong>
  (80/200)
</div>

<style>
  div {
    flex-shrink: 0;
    padding-left: 0.75rem;
    font-size: 0.875rem;
    font-weight: normal;
    background-color: #fff;
    border-left: 6px solid #000;
  }

  strong {
    font-size: 1rem;
  }

  .progressBar--position-right {
    margin-right: -1rem;
    padding-right: 0.75rem;
    padding-left: 1.5rem;
    border-right: 6px solid #000;
    border-left: 0;
  }

  .progressBar--position-bottom {
    padding-left: 0;
    border-left: 0;
  }

  .progressBar--position-bottom::after {
    content: '';
    display: block;
    width: 50%;
    height: 6px;
    margin: 0 auto;
    background-color: #000;
  }

  .progressBar--status-alert,
  .progressBar--position-bottom.progressBar--status-alert {
    border-color: #da0505;
  }

  .progressBar--status-warning,
  .progressBar--position-bottom.progressBar--status-warning {
    border-color: #f59e0b;
  }

  .progressBar--status-ok,
  .progressBar--position-bottom.progressBar--status-ok {
    border-color: #fcd34d;
  }

  .progressBar--status-good,
  .progressBar--position-bottom.progressBar--status-good {
    border-color: #c0d72d;
  }

  .progressBar--status-best,
  .progressBar--position-bottom.progressBar--status-best {
    border-color: #059669;
  }
</style>
