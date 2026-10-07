import { Request, Response } from 'express';
import * as patientService from '../services/patientService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const patientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  hospital: z.string().optional()
});

export const getPatients = async (req: Request, res: Response) => {
  try {
    const { blood_group, search } = req.query;
    const data = await patientService.listPatients({
      blood_group: blood_group as string,
      search: search as string
    });
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid patient ID' });

    const patient = await patientService.getPatient(id);
    res.json({ data: patient });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const createPatient = async (req: AuthRequest, res: Response) => {
  try {
    const validated = patientSchema.parse(req.body);
    const userId = req.user?.userId;
    const newPatient = await patientService.registerPatient(validated, userId);
    res.status(201).json({ data: newPatient, message: 'Patient registered successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid patient ID' });

    const partialSchema = patientSchema.partial();
    const validated = partialSchema.parse(req.body);
    const userId = req.user?.userId;

    const updated = await patientService.updatePatientDetails(id, validated, userId);
    res.json({ data: updated, message: 'Patient updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid patient ID' });

    const userId = req.user?.userId;
    const result = await patientService.removePatient(id, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
