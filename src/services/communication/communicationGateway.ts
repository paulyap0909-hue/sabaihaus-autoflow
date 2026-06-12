import type {
  CommunicationChannel,
  CommunicationTemplatePurpose,
  MessageQueueItem,
} from '../../types/communication'
import { messageQueue } from '../mockCommunication'
import { getSupabaseClient } from '../supabase/client'

export interface EnqueueMessageCommand {
  customerId: string
  appointmentId?: string
  channel: CommunicationChannel
  purpose: CommunicationTemplatePurpose
  recipient: string
  scheduledAt: string
  variables: Record<string, string | number>
}

export interface CommunicationGateway {
  listQueue(): Promise<MessageQueueItem[]>
  enqueue(command: EnqueueMessageCommand): Promise<MessageQueueItem>
  cancel(messageId: string): Promise<void>
  retry(messageId: string): Promise<MessageQueueItem>
}

function dispatchConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_COMMUNICATION_DISPATCH_ENABLED === 'true',
  )
}

async function invoke<T>(
  operation: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke(
    'communication-dispatch',
    { body: { operation, ...payload } },
  )
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Communication gateway returned no data.')
  return data as T
}

export const communicationGateway: CommunicationGateway = {
  async listQueue() {
    if (!dispatchConfigured()) return messageQueue
    return invoke<MessageQueueItem[]>('list', {})
  },

  async enqueue(command) {
    if (!dispatchConfigured()) {
      return {
        id: `MQ-DEMO-${Date.now()}`,
        customer: command.variables.customer_name?.toString() ?? 'Customer',
        channel: command.channel,
        messageType: command.purpose,
        scheduledAt: command.scheduledAt,
        status: 'Scheduled',
        recipient: command.recipient,
      }
    }
    return invoke<MessageQueueItem>('enqueue', { command })
  },

  async cancel(messageId) {
    if (!dispatchConfigured()) return
    await invoke('cancel', { messageId })
  },

  async retry(messageId) {
    if (!dispatchConfigured()) {
      const existing = messageQueue.find((item) => item.id === messageId)
      if (!existing) throw new Error('Message queue item was not found.')
      return { ...existing, status: 'Pending' }
    }
    return invoke<MessageQueueItem>('retry', { messageId })
  },
}

export function communicationIntegrationMode() {
  return dispatchConfigured() ? 'Provider gateway active' : 'Safe mock queue'
}
