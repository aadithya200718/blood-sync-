import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getDashboardSummary();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInventoryBreakdown = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getInventoryBreakdown();
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
