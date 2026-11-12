import * as notificationRepo from '../repositories/notificationRepo';

export const getStaffNotifications = async (role: string, userId?: number, unreadOnly?: boolean) => {
  return await notificationRepo.getNotificationsForRole(role, userId, unreadOnly);
};

export const markAsRead = async (notificationId: number) => {
  return await notificationRepo.markNotificationRead(notificationId);
};

export const acknowledgeAll = async (role: string, userId?: number) => {
  return await notificationRepo.acknowledgeAllForRole(role, userId);
};

export const createStaffNotification = async (data: {
  recipient_role?: string;
  recipient_user_id?: number | null;
  request_id?: string | null;
  unit_id?: string | null;
  event_type: string;
  severity?: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
}) => {
  return await notificationRepo.createNotification(data);
};
