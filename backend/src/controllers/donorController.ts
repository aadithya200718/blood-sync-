import { Request, Response } from 'express';
import * as donorService from '../services/donorService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const donorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  phone: z.string().optional(),
  status: z.enum(['Eligible', 'Deferred', 'Inactive']).optional().default('Eligible'),
  last_donation_date: z.string().optional()
});

export const getDonors = async (req: Request, res: Response) => {
  try {
    const { blood_group, status, search } = req.query;
    const data = await donorService.listDonors({
      blood_group: blood_group as string,
      status: status as string,
      search: search as string
    });
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getDonorById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid donor ID' });

    const donor = await donorService.getDonor(id);
    res.json({ data: donor });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const createDonor = async (req: AuthRequest, res: Response) => {
  try {
    const validated = donorSchema.parse(req.body);
    const userId = req.user?.userId;
    const newDonor = await donorService.registerDonor(validated, userId);
    res.status(201).json({ data: newDonor, message: 'Donor registered successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updateDonor = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid donor ID' });

    const partialSchema = donorSchema.partial();
    const validated = partialSchema.parse(req.body);
    const userId = req.user?.userId;

    const updated = await donorService.updateDonorDetails(id, validated, userId);
    res.json({ data: updated, message: 'Donor updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const deleteDonor = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid donor ID' });

    const userId = req.user?.userId;
    const result = await donorService.removeDonor(id, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
