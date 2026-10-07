import * as analyticsRepo from '../repositories/analyticsRepo';

export const getDashboardSummary = async () => {
  const kpis = await analyticsRepo.getDashboardKPIs();
  const bloodGroups = await analyticsRepo.getBloodGroupInventory();
  const components = await analyticsRepo.getComponentBreakdown();
  const shelfLife = await analyticsRepo.getShelfLifeBuckets();
  const recentActivities = await analyticsRepo.getRecentActivities();

  return {
    kpis,
    bloodGroups,
    components,
    shelfLife,
    recentActivities
  };
};

export const getInventoryBreakdown = async () => {
  const bloodGroups = await analyticsRepo.getBloodGroupInventory();
  const components = await analyticsRepo.getComponentBreakdown();
  const shelfLife = await analyticsRepo.getShelfLifeBuckets();

  return {
    bloodGroups,
    components,
    shelfLife
  };
};
