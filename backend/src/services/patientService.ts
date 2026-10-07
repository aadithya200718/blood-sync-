import * as patientRepo from '../repositories/patientRepo';
import { createAuditEntry } from '../repositories/auditRepo';

export const listPatients = async (filters?: { blood_group?: string; search?: string }) => {
  return await patientRepo.getAllPatients(filters);
};

export const getPatient = async (id: number) => {
  const patient = await patientRepo.getPatientById(id);
  if (!patient) throw new Error('Patient not found');
  const requests = await patientRepo.getPatientRequests(id);
  return { ...patient, requests };
};

export const registerPatient = async (
  data: { name: string; blood_group: string; hospital?: string },
  userId?: number
) => {
  const newPatient = await patientRepo.createPatient(data);
  await createAuditEntry({
    user_id: userId,
    action: 'PATIENT_REGISTERED',
    entity_type: 'patients',
    entity_id: String(newPatient.patient_id),
    after_state: newPatient,
    reason: 'Initial patient admission/intake'
  });
  return newPatient;
};

export const updatePatientDetails = async (
  id: number,
  data: Partial<{ name: string; blood_group: string; hospital: string }>,
  userId?: number
) => {
  const existing = await patientRepo.getPatientById(id);
  if (!existing) throw new Error('Patient not found');

  const updated = await patientRepo.updatePatient(id, data);
  await createAuditEntry({
    user_id: userId,
    action: 'PATIENT_UPDATED',
    entity_type: 'patients',
    entity_id: String(id),
    before_state: existing,
    after_state: updated,
    reason: 'Patient details updated'
  });
  return updated;
};

export const removePatient = async (id: number, userId?: number) => {
  const existing = await patientRepo.getPatientById(id);
  if (!existing) throw new Error('Patient not found');

  const result = await patientRepo.deletePatient(id);
  await createAuditEntry({
    user_id: userId,
    action: 'PATIENT_DELETED',
    entity_type: 'patients',
    entity_id: String(id),
    before_state: existing,
    reason: 'Patient deleted from system'
  });
  return result;
};
