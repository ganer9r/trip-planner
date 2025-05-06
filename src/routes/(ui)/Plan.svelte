<script lang="ts">
	import type { TravelPlan } from "$src/lib/domain/plan/type";

  type Props = {
    plan: TravelPlan
  };

  let { plan }: Props = $props();

</script>

<div class="plan-container">
  <h2>{plan.title} 결과</h2>
  <p>{plan.overview}</p>

  <!-- TODO: 가로 캐러셀로 구현하면 더 좋을 것 같음. -->
  <div class="plans">
    {#each plan.days as dayPlan, index}
        <div class="day-plan">
            <h3>Day {index + 1} : {dayPlan.date}</h3>
            <ul>
                <li>오전 : {dayPlan.morning}</li>
                <li>점심 : {dayPlan.lunch}</li>
                <li>오후 : {dayPlan.afternoon}</li>
                <li>저녁 : {dayPlan.evening}</li>
            </ul>
        </div>
    {/each}
  </div>
</div>

<style>
  h2 {
    color: #333;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .plans {
    margin-top: 30px;
    display: flex;
    gap: 20px;
    overflow-x: auto;

    .day-plan {
      min-width: 300px;
    }
  }

  .plan-container {
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
  }

  .day-plan {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
  }

  .day-plan h3 {
      margin-top: 0;
      color: #007bff;
  }

  .day-plan ul {
      padding-left: 25px;
      margin: 0;
  }

  .day-plan li {
      margin-bottom: 8px;
      line-height: 1.5;
  }
</style>