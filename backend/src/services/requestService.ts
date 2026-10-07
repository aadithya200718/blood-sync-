import * as requestRepo from '../repositories/requestRepo';
import * as inventoryRepo from '../repositories/inventoryRepo';
import { createAuditEntry } from '../repositories/auditRepo';

export const listRequests = async (filters?: {
  status?: string;
  urgency?: string;
  blood_group?: string;
  search?: string;
}) => {
  return await requestRepo.getAllRequests(filters);
};

export const getRequestDetails = async (requestId: string) => {
  const request = await requestRepo.getRequestById(requestId);
  if (!request) throw new Error('Request not found');

  const reservations = await requestRepo.getReservationsByRequest(requestId);
  const issuances = await requestRepo.getIssuancesByRequest(requestId);
  const crossmatches = await requestRepo.getCrossmatchesByRequest(requestId);

  return {
    ...request,
    reservations,
    issuances,
    crossmatches
  };
};

export const createBloodRequest = async (
  data: {
    request_id?: string;
    patient_id: number;
    blood_group: string;
    component_type: string;
    quantity: number;
    urgency?: string;
  },
  userId?: number
) => {
  const newRequest = await requestRepo.createRequest(data);
  await createAuditEntry({
    user_id: userId,
    action: 'REQUEST_CREATED',
    entity_type: 'blood_requests',
    entity_id: newRequest?.request_id || 'UNKNOWN',
    after_state: newRequest,
    reason: `Blood request created with ${data.urgency || 'Routine'} priority`
  });
  return newRequest;
};

export const updateStatus = async (requestId: string, status: string, userId?: number, reason?: string) => {
  const existing = await requestRepo.getRequestById(requestId);
  if (!existing) throw new Error('Request not found');

  const updated = await requestRepo.updateRequestStatus(requestId, status);
  await createAuditEntry({
    user_id: userId,
    action: 'REQUEST_STATUS_UPDATED',
    entity_type: 'blood_requests',
    entity_id: requestId,
    before_state: existing,
    after_state: updated,
    reason: reason || `Status changed from ${existing.status} to ${status}`
  });
  return updated;
};

export const getMatchingUnits = async (requestId: string) => {
  const request = await requestRepo.getRequestById(requestId);
  if (!request) throw new Error('Request not found');

  const matches = await inventoryRepo.callMatchRequest(requestId);
  return {
    request,
    recommendedUnits: matches || []
  };
};

export const recordCrossmatchTest = async (
  data: {
    request_id: string;
    unit_id: string;
    result: 'Compatible' | 'Incompatible' | 'Pending';
    tested_by: number;
  }
) => {
  const record = await requestRepo.recordCrossmatch(data);
  await createAuditEntry({
    user_id: data.tested_by,
    action: 'CROSSMATCH_TESTED',
    entity_type: 'cross_matches',
    entity_id: `${data.request_id}:${data.unit_id}`,
    after_state: data,
    reason: `Crossmatch result: ${data.result}`
  });
  return record;
};

export const reserveUnit = async (requestId: string, unitId: string, userId: number) => {
  const request = await requestRepo.getRequestById(requestId);
  if (!request) throw new Error('Request not found');

  await inventoryRepo.callReserveUnit(requestId, unitId, userId);

  await createAuditEntry({
    user_id: userId,
    action: 'UNIT_RESERVED',
    entity_type: 'reservations',
    entity_id: `${requestId}:${unitId}`,
    after_state: { requestId, unitId, status: 'Active' },
    reason: 'Reserved for blood request'
  });

  return { success: true, message: `Unit ${unitId} reserved for request ${requestId}` };
};

export const issueUnit = async (
  requestId: string,
  unitId: string,
  userId: number,
  reasonCode: string = 'Clinical Order Fulfilled'
) => {
  const request = await requestRepo.getRequestById(requestId);
  if (!request) throw new Error('Request not found');

  await inventoryRepo.callIssueUnit(requestId, unitId, userId, reasonCode);

  // Check if all requested units are issued
  const issuances = await requestRepo.getIssuancesByRequest(requestId);
  const issuedCount = issuances.length;
  if (issuedCount >= request.quantity) {
    await requestRepo.updateRequestStatus(requestId, 'Fulfilled');
  } else if (issuedCount > 0) {
    await requestRepo.updateRequestStatus(requestId, 'Partially Fulfilled');
  }

  await createAuditEntry({
    user_id: userId,
    action: 'UNIT_ISSUED',
    entity_type: 'issuances',
    entity_id: `${requestId}:${unitId}`,
    after_state: { requestId, unitId, reasonCode },
    reason: `Blood unit authorized and issued. Reason: ${reasonCode}`
  });

  return {
    success: true,
    message: `Unit ${unitId} successfully issued for request ${requestId}`,
    issuedCount,
    quantity: request.quantity
  };
};

export const cancelUnitReservation = async (requestId: string, unitId: string, userId: number) => {
  await requestRepo.cancelReservation(requestId, unitId);
  await createAuditEntry({
    user_id: userId,
    action: 'RESERVATION_CANCELLED',
    entity_type: 'reservations',
    entity_id: `${requestId}:${unitId}`,
    reason: 'Manual release of reserved blood unit'
  });
  return { success: true, message: `Reservation for unit ${unitId} cancelled` };
};

export const listAllReservations = async (status?: string) => {
  return await requestRepo.getAllReservations(status);
};

export const listAllIssuances = async () => {
  return await requestRepo.getAllIssuances();
};

