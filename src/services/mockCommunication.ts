import type {
  CommunicationTemplate,
  MessageQueueItem,
} from '../types/communication'

export const communicationTemplates: CommunicationTemplate[] = [
  { id: 'CT-01', name: 'Appointment Reminder', channel: 'WhatsApp', purpose: 'Appointment Reminder', trigger: '24 hours before appointment', active: true, content: 'Hi {{customer_name}}, a gentle reminder that your appointment is at {{appointment_time}} with {{therapist_name}}.' },
  { id: 'CT-02', name: 'Check-In Reminder', channel: 'WhatsApp', purpose: 'Check-In Reminder', trigger: '3 hours before appointment', active: true, content: 'Hi {{customer_name}}, please check in 10 minutes before your {{appointment_time}} treatment.' },
  { id: 'CT-03', name: 'Arrival Reminder', channel: 'SMS', purpose: 'Arrival Reminder', trigger: '30 minutes before appointment', active: true, content: 'Sabai Haus is ready to welcome you at {{appointment_time}}.' },
  { id: 'CT-04', name: 'Aftercare Message', channel: 'Email', purpose: 'Aftercare Message', trigger: '2 hours after completion', active: true, content: 'Thank you {{customer_name}}. Here is your aftercare guidance from {{therapist_name}}.' },
  { id: 'CT-05', name: 'Birthday Message', channel: 'WhatsApp', purpose: 'Birthday Message', trigger: 'Customer birthday at 9:00 AM', active: true, content: 'Happy birthday {{customer_name}}. Your Sabai Haus wellness gift is ready.' },
  { id: 'CT-06', name: 'Package Expiry', channel: 'WhatsApp', purpose: 'Package Expiry', trigger: 'Balance <= 2 or expiry within 30 days', active: true, content: 'Hi {{customer_name}}, your package balance is {{package_balance}}. Let us reserve your next visit.' },
  { id: 'CT-07', name: 'Membership Renewal', channel: 'Email', purpose: 'Membership Renewal', trigger: 'Membership expiry within 30 days', active: true, content: 'Your Sabai Haus membership renews soon. Review your benefits and renewal options.' },
  { id: 'CT-08', name: 'Win-Back Campaign', channel: 'SMS', purpose: 'Win-Back Campaign', trigger: 'No completed visit for 45 days', active: true, content: 'We miss you at Sabai Haus, {{customer_name}}. Reply to plan your next wellness reset.' },
]

export const messageQueue: MessageQueueItem[] = [
  { id: 'MQ-01', customer: 'Daniel Wong', channel: 'WhatsApp', messageType: 'Appointment Reminder', scheduledAt: 'Today, 12:00 PM', status: 'Scheduled', recipient: '+60 16-311 7820' },
  { id: 'MQ-02', customer: 'Amelia Tan', channel: 'Email', messageType: 'Aftercare Message', scheduledAt: 'Today, 1:30 PM', status: 'Pending', recipient: 'amelia.tan@example.com' },
  { id: 'MQ-03', customer: 'Sarah Lim', channel: 'WhatsApp', messageType: 'Package Expiry', scheduledAt: 'Today, 3:00 PM', status: 'Scheduled', recipient: '+60 17-620 4419' },
  { id: 'MQ-04', customer: 'Michelle Goh', channel: 'SMS', messageType: 'Win-Back Campaign', scheduledAt: 'Today, 4:15 PM', status: 'Failed', recipient: '+60 12-792 1033', errorMessage: 'Recipient temporarily unavailable' },
  { id: 'MQ-05', customer: 'Nur Aisyah', channel: 'Email', messageType: 'Membership Renewal', scheduledAt: 'Tomorrow, 9:00 AM', status: 'Cancelled', recipient: 'nur.aisyah@example.com' },
  { id: 'MQ-06', customer: 'Farah Rahman', channel: 'WhatsApp', messageType: 'Win-Back Campaign', scheduledAt: 'Yesterday, 11:00 AM', status: 'Sent', recipient: '+60 11-340 7721' },
]
