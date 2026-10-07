import * as auditRepo from '../repositories/auditRepo';

export const listAuditLogs = async (filters?: {
  entity_type?: string;
  action?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  return await auditRepo.getAuditLogs(filters);
};

export const getAuditSummary = async () => {
  return await auditRepo.getAuditSummary();
};

export const recordManualAudit = async (data: {
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id: string;
  reason?: string;
  before_state?: any;
  after_state?: any;
}) => {
  return await auditRepo.createAuditEntry(data);
};
