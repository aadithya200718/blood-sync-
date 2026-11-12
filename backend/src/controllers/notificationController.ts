import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as notificationService from '../services/notificationService';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || 'Technician';
    const userId = req.user?.userId;
    const unreadOnly = req.query.unread === 'true';

    const result = await notificationService.getStaffNotifications(role, userId, unreadOnly);
    res.json({ data: result.notifications, unreadCount: result.unreadCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    const success = await notificationService.markAsRead(notificationId);
    res.json({ success, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const acknowledgeAll = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role || 'Technician';
    const userId = req.user?.userId;
    const count = await notificationService.acknowledgeAll(role, userId);
    res.json({ success: true, acknowledgedCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
