export type NotificationChannel = 'WhatsApp' | 'SMS' | 'Email' | 'MeTIME Wellness'
export type NotificationStatus = 'Scheduled' | 'Sent' | 'Failed' | 'Paused'

export interface NotificationTemplate {
  id: string
  name: string
  channel: NotificationChannel
  trigger: string
  status: 'Active' | 'Paused'
  lastSent: string
  successRate: number
  preview: string
}

export interface NotificationQueueItem {
  id: string
  customer: string
  channel: NotificationChannel
  messageType: string
  scheduledTime: string
  status: NotificationStatus
}
