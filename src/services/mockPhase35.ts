import type { InventoryItem, ServiceUsageRule } from '../types/inventory'
import type { NotificationQueueItem, NotificationTemplate } from '../types/notifications'

export const inventoryItems: InventoryItem[] = [
  { id: 'INV-101', name: 'Lavender Essential Oil', category: 'Essential Oil', currentStock: 18, unit: 'bottles', reorderLevel: 8, costPerUnit: 42, supplier: 'Siam Botanics', expiryDate: '2026-11-18', status: 'In Stock', retailProduct: false, linkedServices: ['Aromatherapy Massage'] },
  { id: 'INV-102', name: 'Lemongrass Massage Oil', category: 'Aromatherapy', currentStock: 7, unit: 'bottles', reorderLevel: 10, costPerUnit: 36, supplier: 'Siam Botanics', expiryDate: '2026-08-20', status: 'Low Stock', retailProduct: false, linkedServices: ['Thai Wellness Ritual', 'Aromatherapy Massage'] },
  { id: 'INV-103', name: 'Herbal Compress Ball', category: 'Massage Cream', currentStock: 24, unit: 'pcs', reorderLevel: 12, costPerUnit: 18, supplier: 'Lanna Wellness Supply', expiryDate: '2026-07-04', status: 'Expiring Soon', retailProduct: false, linkedServices: ['Thai Wellness Ritual'] },
  { id: 'INV-104', name: 'Disposable Bed Sheet', category: 'Disposable', currentStock: 42, unit: 'pcs', reorderLevel: 50, costPerUnit: 2.4, supplier: 'CarePro Supplies', expiryDate: '2028-01-01', status: 'Low Stock', retailProduct: false, linkedServices: ['Aromatherapy Massage', 'Deep Tissue Massage'] },
  { id: 'INV-105', name: 'Ginger Wellness Tea', category: 'Tea & Beverage', currentStock: 63, unit: 'packs', reorderLevel: 25, costPerUnit: 3.2, supplier: 'Sabai Pantry', expiryDate: '2026-09-15', status: 'In Stock', retailProduct: false, linkedServices: ['Signature Head Spa'] },
  { id: 'INV-106', name: 'Shoulder Relief Balm', category: 'Retail Product', currentStock: 16, unit: 'jars', reorderLevel: 8, costPerUnit: 28, supplier: 'Siam Botanics', expiryDate: '2027-02-12', status: 'In Stock', retailProduct: true, linkedServices: ['Deep Tissue Massage'] },
  { id: 'INV-107', name: 'Clean Towel Set', category: 'Towel & Linen', currentStock: 0, unit: 'sets', reorderLevel: 20, costPerUnit: 14, supplier: 'Lotus Linen Co.', expiryDate: '—', status: 'Out of Stock', retailProduct: false, linkedServices: ['Thai Massage', 'Signature Head Spa'] },
]

export const serviceUsageRules: ServiceUsageRule[] = [
  { id: 'SUR-01', service: 'Aromatherapy Massage', items: ['Lavender Essential Oil · 15ml', 'Disposable Bed Sheet · 1pc'] },
  { id: 'SUR-02', service: 'Thai Massage', items: ['Massage Cream · 20g', 'Clean Towel Set · 1pc'] },
  { id: 'SUR-03', service: 'Signature Head Spa', items: ['Ginger Wellness Tea · 1 pack', 'Clean Towel Set · 1pc'] },
]

export const notificationTemplates: NotificationTemplate[] = [
  { id: 'NT-01', name: 'Appointment Confirmation', channel: 'WhatsApp', trigger: 'Booking created', status: 'Active', lastSent: 'Today, 10:42 AM', successRate: 98, preview: 'Hi {{customer_name}}, your {{service_name}} appointment is confirmed for {{appointment_date}} at {{appointment_time}}.' },
  { id: 'NT-02', name: 'Appointment Reminder', channel: 'SMS', trigger: '24 hours before appointment', status: 'Active', lastSent: 'Today, 9:15 AM', successRate: 96, preview: 'A gentle reminder from {{branch_name}}: your wellness appointment is tomorrow at {{appointment_time}}.' },
  { id: 'NT-03', name: 'After-Treatment Care', channel: 'Email', trigger: 'Appointment completed', status: 'Active', lastSent: 'Yesterday, 8:30 PM', successRate: 94, preview: 'Thank you for visiting Sabai Haus. Here are your therapist’s after-care suggestions.' },
  { id: 'NT-04', name: 'Birthday Greeting', channel: 'WhatsApp', trigger: 'Birthday', status: 'Active', lastSent: 'Today, 8:00 AM', successRate: 99, preview: 'Happy birthday, {{customer_name}}. Your Sabai Haus wellness gift is ready.' },
  { id: 'NT-05', name: 'Package Expiring Soon', channel: 'WhatsApp', trigger: 'Package has 2 sessions remaining', status: 'Active', lastSent: 'Yesterday, 4:12 PM', successRate: 97, preview: 'Your package has {{package_balance}} sessions remaining. Let’s plan your next visit.' },
  { id: 'NT-06', name: 'Membership Renewal', channel: 'Email', trigger: 'Membership renews in 7 days', status: 'Active', lastSent: 'Today, 7:30 AM', successRate: 95, preview: 'Your {{membership_tier}} membership renews soon. Review your benefits and renewal details.' },
  { id: 'NT-07', name: 'No-Show Follow-up', channel: 'SMS', trigger: 'No-show marked', status: 'Paused', lastSent: '3 days ago', successRate: 89, preview: 'We missed you today. Reply to arrange a new appointment time.' },
  { id: 'NT-08', name: 'Customer Win-Back', channel: 'MeTIME Wellness', trigger: 'Customer inactive for 45 days', status: 'Active', lastSent: 'Today, 11:00 AM', successRate: 92, preview: 'It may be time for your next wellness reset. Explore your recommended treatment in MeTIME.' },
  { id: 'NT-09', name: 'Review Request', channel: 'WhatsApp', trigger: 'Appointment completed', status: 'Active', lastSent: 'Yesterday, 6:20 PM', successRate: 93, preview: 'How was your treatment with {{therapist_name}}? We would value your feedback.' },
]

export const notificationQueue: NotificationQueueItem[] = [
  { id: 'NQ-01', customer: 'Daniel Wong', channel: 'WhatsApp', messageType: 'Appointment Reminder', scheduledTime: 'Today, 12:00 PM', status: 'Scheduled' },
  { id: 'NQ-02', customer: 'Amelia Tan', channel: 'Email', messageType: 'After-Treatment Care', scheduledTime: 'Today, 1:30 PM', status: 'Scheduled' },
  { id: 'NQ-03', customer: 'Sarah Lim', channel: 'WhatsApp', messageType: 'Package Expiring Soon', scheduledTime: 'Today, 3:00 PM', status: 'Scheduled' },
  { id: 'NQ-04', customer: 'Michelle Goh', channel: 'SMS', messageType: 'No-Show Follow-up', scheduledTime: 'Today, 4:15 PM', status: 'Paused' },
  { id: 'NQ-05', customer: 'Nur Aisyah', channel: 'MeTIME Wellness', messageType: 'Membership Renewal', scheduledTime: 'Tomorrow, 9:00 AM', status: 'Scheduled' },
]
