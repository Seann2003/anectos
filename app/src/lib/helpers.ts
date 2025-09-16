export const toSdgEnum = (n: number) => {
  switch (n) {
    case 1:
      return { noPoverty: {} };
    case 2:
      return { zeroHunger: {} };
    case 3:
      return { goodHealthAndWellBeing: {} };
    case 4:
      return { qualityEducation: {} };
    case 5:
      return { genderEquality: {} };
    case 6:
      return { cleanWaterAndSanitation: {} };
    case 7:
      return { affordableAndCleanEnergy: {} };
    case 8:
      return { decentWorkAndEconomicGrowth: {} };
    case 9:
      return { industryInnovationAndInfrastructure: {} };
    case 10:
      return { reducedInequalities: {} };
    case 11:
      return { sustainableCitiesAndCommunities: {} };
    case 12:
      return { responsibleConsumptionAndProduction: {} };
    case 13:
      return { climateAction: {} };
    case 14:
      return { lifeBelowWater: {} };
    case 15:
      return { lifeOnLand: {} };
    case 16:
      return { peaceJusticeAndStrongInstitutions: {} };
    case 17:
      return { partnershipsForTheGoals: {} };
    default:
      return null;
  }
};
