import { Request, Response } from 'express';
import * as inventoryService from '../services/inventoryService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

export const getInventory = async (req: Request, res: Response) => {
  try {
    const { blood_group, component_type, status, search } = req.query;
    const data = await inventoryService.getAllInventory({
      blood_group: blood_group as string,
      component_type: component_type as string,
      status: status as string,
      search: search as string
    });
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnitById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const unit = await inventoryService.getUnit(id);
    res.json({ data: unit });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

const addUnitSchema = z.object({
  unit_id: z.string().min(2, 'Unit ID is required'),
  donor_id: z.number().int().positive('Donor ID is required'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  component_type: z.enum(['Whole Blood', 'Red Blood Cells', 'Platelets', 'Plasma']),
  collection_date: z.string(),
  expiry_date: z.string(),
  storage_location: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED', 'DISCARDED', 'QUARANTINE']).optional()
});

export const addUnit = async (req: AuthRequest, res: Response) => {
  try {
    const validated = addUnitSchema.parse(req.body);
    const userId = req.user?.userId;
    const unit = await inventoryService.addUnit(validated, userId);
    res.status(201).json({ data: unit, message: 'Blood unit added to inventory' });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(400).json({ error: error.message });
  }
};

export const discardUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const unit = await inventoryService.discardUnit(id, reason, userId);
    res.json({ data: unit, message: 'Unit marked as discarded' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const quarantineUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;
    const unit = await inventoryService.quarantineUnit(id, reason, userId);
    res.json({ data: unit, message: 'Unit placed in quarantine' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getInventoryStats = async (req: Request, res: Response) => {
  try {
    const stats = await inventoryService.getInventoryStatistics();
    res.json({ data: stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const matchRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const recommendations = await inventoryService.getMatchRecommendations(requestId);
    res.json({ data: recommendations });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

const reserveSchema = z.object({
  unitId: z.string().optional(),
  unit_id: z.string().optional()
});

export const reserveUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const parsed = reserveSchema.parse(req.body);
    const unitId = parsed.unitId || parsed.unit_id;
    if (!unitId) return res.status(400).json({ error: 'unitId is required' });

    const userId = req.user.userId;
    const result = await inventoryService.reserveBloodUnit(requestId, unitId, userId);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(400).json({ error: error.message });
  }
};

const issueSchema = z.object({
  unitId: z.string().optional(),
  unit_id: z.string().optional(),
  reasonCode: z.string().optional().default('Standard Issuance'),
  reason_code: z.string().optional()
});

export const issueUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const parsed = issueSchema.parse(req.body);
    const unitId = parsed.unitId || parsed.unit_id;
    if (!unitId) return res.status(400).json({ error: 'unitId is required' });
    const reasonCode = parsed.reasonCode || parsed.reason_code || 'Standard Issuance';

    const userId = req.user.userId;
    const result = await inventoryService.issueBloodUnit(requestId, unitId, userId, reasonCode);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(400).json({ error: error.message });
  }
};
