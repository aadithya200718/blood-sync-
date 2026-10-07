import { Request, Response } from 'express';
import * as auditService from '../services/auditService';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { entity_type, action, search, limit, offset } = req.query;
    const data = await auditService.listAuditLogs({
      entity_type: entity_type as string,
      action: action as string,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    });
    res.json({ data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuditSummary = async (req: Request, res: Response) => {
  try {
    const summary = await auditService.getAuditSummary();
    res.json({ data: summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
