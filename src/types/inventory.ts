export type InventoryCategory =
  | 'Essential Oil'
  | 'Massage Cream'
  | 'Disposable'
  | 'Towel & Linen'
  | 'Tea & Beverage'
  | 'Aromatherapy'
  | 'Retail Product'
  | 'Cleaning Supply'

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon'

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  currentStock: number
  unit: string
  reorderLevel: number
  costPerUnit: number
  supplier: string
  expiryDate: string
  status: StockStatus
  retailProduct: boolean
  linkedServices: string[]
}

export interface ServiceUsageRule {
  id: string
  service: string
  items: string[]
}
