import { Request, Response } from 'express';
import * as alertService from '../services/alertService';
import { AuthRequest } from '../middleware/auth';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { status, severity, type } = req.query;
    const data = await alertService.listAlerts({
      status: status as string,
      severity: severity as string,
      type: type as string
    });
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const acknowledgeAlert = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid alert ID' });

    const userId = req.user?.userId;
    const alert = await alertService.acknowledgeAlert(id, userId);
    res.json({ data: alert, message: 'Alert acknowledged' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const resolveAlert = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid alert ID' });

    const userId = req.user?.userId;
    const alert = await alertService.resolveAlert(id, userId);
    res.json({ data: alert, message: 'Alert resolved' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const dismissAlert = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid alert ID' });

    const userId = req.user?.userId;
    const alert = await alertService.dismissAlert(id, userId);
    res.json({ data: alert, message: 'Alert dismissed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const runChecks = async (req: Request, res: Response) => {
  try {
    const result = await alertService.runAlertChecks();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
