import { apiClient } from '@/lib/api-client';

export interface MessageDto {
  messageId: number;
  senderId: number;
  senderFullName: string;
  receiverId: number;
  threadId: number;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface MessageThreadDto {
  threadId: number;
  listingId: number;
  listingTitle: string;
  participantOneId: number;
  participantOneFullName: string;
  participantTwoId: number;
  participantTwoFullName: string;
  createdAt: string;
  lastMessage: MessageDto | null;
  unreadCount: number;
}

export interface SendMessageRequest {
  recipientId: number;
  listingId: number;
  content: string;
}

export const messageService = {
  // GET /messages/threads — all threads for the current user
  getThreads: () =>
    apiClient.get<MessageThreadDto[]>('/messages/threads'),

  // GET /messages/threads/{threadId} — messages inside a thread (also marks them read)
  getThreadMessages: (threadId: number) =>
    apiClient.get<MessageDto[]>(`/messages/threads/${threadId}`),

  // POST /messages — send a message (creates thread automatically if needed)
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<MessageDto>('/messages', data),

  // POST /messages/threads/get-or-create?recipientId=X&listingId=Y
  getOrCreateThread: (recipientId: number, listingId: number) =>
    apiClient.post<MessageThreadDto>(
      `/messages/threads/get-or-create?recipientId=${recipientId}&listingId=${listingId}`,
      {},
    ),
};
