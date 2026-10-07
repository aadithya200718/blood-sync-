import * as donorRepo from '../repositories/donorRepo';
import { createAuditEntry } from '../repositories/auditRepo';

export const listDonors = async (filters?: { blood_group?: string; status?: string; search?: string }) => {
  return await donorRepo.getAllDonors(filters);
};

export const getDonor = async (id: number) => {
  const donor = await donorRepo.getDonorById(id);
  if (!donor) throw new Error('Donor not found');
  const donations = await donorRepo.getDonorDonations(id);
  return { ...donor, donations };
};

export const registerDonor = async (
  data: { name: string; blood_group: string; phone?: string; status?: string; last_donation_date?: string },
  userId?: number
) => {
  const newDonor = await donorRepo.createDonor(data);
  await createAuditEntry({
    user_id: userId,
    action: 'DONOR_REGISTERED',
    entity_type: 'donors',
    entity_id: String(newDonor.donor_id),
    after_state: newDonor,
    reason: 'Initial donor registration'
  });
  return newDonor;
};

export const updateDonorDetails = async (
  id: number,
  data: Partial<{ name: string; blood_group: string; phone: string; status: string; last_donation_date: string }>,
  userId?: number
) => {
  const existing = await donorRepo.getDonorById(id);
  if (!existing) throw new Error('Donor not found');

  const updated = await donorRepo.updateDonor(id, data);
  await createAuditEntry({
    user_id: userId,
    action: 'DONOR_UPDATED',
    entity_type: 'donors',
    entity_id: String(id),
    before_state: existing,
    after_state: updated,
    reason: 'Donor profile updated'
  });
  return updated;
};

export const removeDonor = async (id: number, userId?: number) => {
  const existing = await donorRepo.getDonorById(id);
  if (!existing) throw new Error('Donor not found');

  const result = await donorRepo.deleteDonor(id);
  await createAuditEntry({
    user_id: userId,
    action: 'DONOR_DELETED',
    entity_type: 'donors',
    entity_id: String(id),
    before_state: existing,
    reason: 'Donor removed from system'
  });
  return result;
};
