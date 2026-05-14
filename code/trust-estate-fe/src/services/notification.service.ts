import { apiClient } from '@/lib/api-client';

export type NotificationType =
  | 'AccountDecision'
  | 'ListingStatus'
  | 'OfferResponse'
  | 'InspectionUpdate'
  | 'DisputeUpdate'
  | 'MessageReceived'
  | 'TransactionClosed';

export interface ApiNotification {
  notificationId: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  createdAt: string;
  readAt: string | null;
}

export function formatNotificationDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export const notificationService = {
  getNotifications: () =>
    apiClient.get<ApiNotification[]>('/notifications'),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (notificationId: number) =>
    apiClient.put<void>(`/notifications/${notificationId}/read`, {}),

  markAllAsRead: () =>
    apiClient.put<void>('/notifications/read-all', {}),
};
