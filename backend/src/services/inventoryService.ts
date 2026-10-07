import * as inventoryRepo from '../repositories/inventoryRepo';
import { createAuditEntry } from '../repositories/auditRepo';

export const getMatchRecommendations = async (requestId: string) => {
  return await inventoryRepo.callMatchRequest(requestId);
};

export const reserveBloodUnit = async (requestId: string, unitId: string, userId: number) => {
  await inventoryRepo.callReserveUnit(requestId, unitId, userId);
  return { success: true, message: 'Unit reserved successfully' };
};

export const issueBloodUnit = async (requestId: string, unitId: string, userId: number, reasonCode: string) => {
  await inventoryRepo.callIssueUnit(requestId, unitId, userId, reasonCode);
  return { success: true, message: 'Unit issued successfully' };
};

export const getAllInventory = async (filters?: {
  blood_group?: string;
  component_type?: string;
  status?: string;
  search?: string;
}) => {
  return await inventoryRepo.getInventory(filters);
};

export const getUnit = async (unitId: string) => {
  const unit = await inventoryRepo.getUnitById(unitId);
  if (!unit) throw new Error('Blood unit not found');
  return unit;
};

export const addUnit = async (
  data: {
    unit_id: string;
    donor_id: number;
    blood_group: string;
    component_type: string;
    collection_date: string;
    expiry_date: string;
    storage_location?: string;
    status?: string;
  },
  userId?: number
) => {
  const newUnit = await inventoryRepo.addBloodUnit(data);
  await createAuditEntry({
    user_id: userId,
    action: 'UNIT_COLLECTED',
    entity_type: 'blood_units',
    entity_id: data.unit_id,
    after_state: newUnit,
    reason: 'New blood donation collected and accessioned'
  });
  return newUnit;
};

export const discardUnit = async (
  unitId: string,
  reason: string,
  userId?: number
) => {
  const unit = await inventoryRepo.getUnitById(unitId);
  if (!unit) throw new Error('Blood unit not found');

  const updated = await inventoryRepo.updateUnitStatus(unitId, 'DISCARDED', 'Disposal Bin');
  await createAuditEntry({
    user_id: userId,
    action: 'UNIT_DISCARDED',
    entity_type: 'blood_units',
    entity_id: unitId,
    before_state: unit,
    after_state: updated,
    reason: reason || 'Expired or contaminated unit discarded'
  });
  return updated;
};

export const quarantineUnit = async (
  unitId: string,
  reason: string,
  userId?: number
) => {
  const unit = await inventoryRepo.getUnitById(unitId);
  if (!unit) throw new Error('Blood unit not found');

  const updated = await inventoryRepo.updateUnitStatus(unitId, 'QUARANTINE', 'Quarantine Area');
  await createAuditEntry({
    user_id: userId,
    action: 'UNIT_QUARANTINED',
    entity_type: 'blood_units',
    entity_id: unitId,
    before_state: unit,
    after_state: updated,
    reason: reason || 'Unit quarantined pending testing / recall'
  });
  return updated;
};

export const getInventoryStatistics = async () => {
  return await inventoryRepo.getInventoryStats();
};
