import { Request, Response } from 'express';
import * as requestService from '../services/requestService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createRequestSchema = z.object({
  request_id: z.string().optional(),
  patient_id: z.number().int().positive('Patient ID is required'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  component_type: z.enum(['Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma']),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  urgency: z.enum(['Routine', 'Urgent', 'Emergency']).optional().default('Routine')
});

const crossmatchSchema = z.object({
  unit_id: z.string().min(1, 'Unit ID is required'),
  result: z.enum(['Compatible', 'Incompatible', 'Pending'])
});

const reserveSchema = z.object({
  unit_id: z.string().min(1, 'Unit ID is required')
});

const issueSchema = z.object({
  unit_id: z.string().min(1, 'Unit ID is required'),
  reason_code: z.string().optional().default('Standard Clinical Issuance')
});

export const getRequests = async (req: Request, res: Response) => {
  try {
    const { status, urgency, blood_group, search } = req.query;
    const data = await requestService.listRequests({
      status: status as string,
      urgency: urgency as string,
      blood_group: blood_group as string,
      search: search as string
    });
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await requestService.getRequestDetails(id);
    res.json({ data });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createRequestSchema.parse(req.body);
    const userId = req.user?.userId;
    const newRequest = await requestService.createBloodRequest(validated, userId);
    res.status(201).json({ data: newRequest, message: 'Blood request created successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const userId = req.user?.userId;
    const updated = await requestService.updateStatus(id, status, userId, reason);
    res.json({ data: updated, message: 'Request status updated' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const matchRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const matchData = await requestService.getMatchingUnits(id);
    res.json({ data: matchData });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const recordCrossmatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = crossmatchSchema.parse(req.body);
    const userId = req.user.userId;

    const record = await requestService.recordCrossmatchTest({
      request_id: id,
      unit_id: validated.unit_id,
      result: validated.result,
      tested_by: userId
    });
    res.status(201).json({ data: record, message: 'Crossmatch recorded successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const reserveUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { unit_id } = reserveSchema.parse(req.body);
    const userId = req.user.userId;

    const result = await requestService.reserveUnit(id, unit_id, userId);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const issueUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { unit_id, reason_code } = issueSchema.parse(req.body);
    const userId = req.user.userId;

    const result = await requestService.issueUnit(id, unit_id, userId, reason_code);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const cancelReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id, unitId } = req.params;
    const userId = req.user.userId;

    const result = await requestService.cancelUnitReservation(id, unitId, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllReservations = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const data = await requestService.listAllReservations(status as string);
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllIssuances = async (req: Request, res: Response) => {
  try {
    const data = await requestService.listAllIssuances();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

