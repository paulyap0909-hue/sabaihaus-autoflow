import type {
  NotificationChannel,
  NotificationStatus,
} from '../../types/notifications'
import {
  repositoryNotImplemented,
  type PersistedRecord,
  type RepositoryContext,
  type RepositoryId,
} from './types'

export interface NotificationQueueRecord extends PersistedRecord {
  customerId: RepositoryId
  appointmentId: RepositoryId | null
  channel: NotificationChannel
  recipient: string
  messageContent: string
  scheduledAt: string
  status: NotificationStatus | 'Cancelled'
}

export interface NotificationQueueInput {
  customerId: RepositoryId
  appointmentId: RepositoryId
  channel: NotificationChannel
  scheduledAt: string
  templatePurpose: 'After-Treatment Care' | 'Review Request'
}

export async function enqueueNotification(
  _context: RepositoryContext,
  _input: NotificationQueueInput,
): Promise<NotificationQueueRecord> {
  return repositoryNotImplemented(
    'notificationsRepository.enqueueNotification',
    _context,
    _input,
  )
}

export async function listScheduledNotifications(
  _context: RepositoryContext,
): Promise<NotificationQueueRecord[]> {
  return repositoryNotImplemented(
    'notificationsRepository.listScheduledNotifications',
    _context,
  )
}
