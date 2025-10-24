type PlanData = {
  titreCompleted: number;
  descriptionCompleted: number;
  objectifsCompleted: number;
  pilotesCompleted: number;
  statutCompleted: number;
  indicateursCompleted: number;
  budgetsCompleted: number;
  suiviRecent: number;
};

type CompletionData = {
  titre: {
    count: number;
    percentage: number;
  };
  description: {
    count: number;
    percentage: number;
  };
  objectifs: {
    count: number;
    percentage: number;
  };
  pilotes: {
    count: number;
    percentage: number;
  };
  statut: {
    count: number;
    percentage: number;
  };
  indicateurs: {
    count: number;
    percentage: number;
  };
  budgets: {
    count: number;
    percentage: number;
  };
  suiviRecent: {
    count: number;
    percentage: number;
  };
};

export const getCompletion = (
  planData: PlanData,
  totalFiches: number
): CompletionData => {
  const calculatePercentage = (count: number) => {
    return totalFiches > 0 ? Math.round((count / totalFiches) * 100) : 0;
  };

  return {
    titre: {
      count: totalFiches - planData.titreCompleted,
      percentage: calculatePercentage(planData.titreCompleted),
    },
    description: {
      count: totalFiches - planData.descriptionCompleted,
      percentage: calculatePercentage(planData.descriptionCompleted),
    },
    objectifs: {
      count: totalFiches - planData.objectifsCompleted,
      percentage: calculatePercentage(planData.objectifsCompleted),
    },
    pilotes: {
      count: totalFiches - planData.pilotesCompleted,
      percentage: calculatePercentage(planData.pilotesCompleted),
    },
    statut: {
      count: totalFiches - planData.statutCompleted,
      percentage: calculatePercentage(planData.statutCompleted),
    },
    indicateurs: {
      count: totalFiches - planData.indicateursCompleted,
      percentage: calculatePercentage(planData.indicateursCompleted),
    },
    budgets: {
      count: totalFiches - planData.budgetsCompleted,
      percentage: calculatePercentage(planData.budgetsCompleted),
    },
    suiviRecent: {
      count: totalFiches - planData.suiviRecent,
      percentage: calculatePercentage(planData.suiviRecent),
    },
  };
};
