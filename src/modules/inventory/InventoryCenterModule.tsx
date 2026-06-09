import {
  Boxes,
  CalendarClock,
  CircleDollarSign,
  Link2,
  PackagePlus,
  Search,
  ShoppingBag,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Drawer } from '../../components/Drawer'
import { FormField } from '../../components/FormField'
import { OperationalKpi } from '../../components/OperationalKpi'
import { inventoryItems as initialItems, serviceUsageRules } from '../../services/mockPhase35'
import type { InventoryCategory, InventoryItem, StockStatus } from '../../types/inventory'

const stockClass: Record<StockStatus, string> = {
  'In Stock': 'success',
  'Low Stock': 'gold',
  'Out of Stock': 'danger',
  'Expiring Soon': 'purple',
}

interface InventoryCenterModuleProps {
  drawerOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export function InventoryCenterModule({ drawerOpen, onOpen, onClose }: InventoryCenterModuleProps) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [supplier, setSupplier] = useState('All')
  const [expiry, setExpiry] = useState('All')

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const expiryMatch =
          expiry === 'All' ||
          (expiry === 'Expiring Soon' && item.status === 'Expiring Soon') ||
          (expiry === 'No Expiry' && item.expiryDate === '—') ||
          (expiry === 'Valid' && item.expiryDate !== '—' && item.status !== 'Expiring Soon')
        return (
          (!search || item.name.toLowerCase().includes(search.toLowerCase())) &&
          (category === 'All' || item.category === category) &&
          (status === 'All' || item.status === status) &&
          (supplier === 'All' || item.supplier === supplier) &&
          expiryMatch
        )
      }),
    [category, expiry, items, search, status, supplier],
  )

  const totalValue = items.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0)

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const currentStock = Number(data.get('currentStock'))
    const reorderLevel = Number(data.get('reorderLevel'))
    const item: InventoryItem = {
      id: `INV-${110 + items.length}`,
      name: String(data.get('name')),
      category: String(data.get('category')) as InventoryCategory,
      supplier: String(data.get('supplier')),
      currentStock,
      unit: String(data.get('unit')),
      reorderLevel,
      costPerUnit: Number(data.get('costPerUnit')),
      expiryDate: String(data.get('expiryDate')) || '—',
      retailProduct: data.get('retailProduct') === 'on',
      linkedServices: String(data.get('linkedServices')).split(',').map((value) => value.trim()).filter(Boolean),
      status: currentStock === 0 ? 'Out of Stock' : currentStock <= reorderLevel ? 'Low Stock' : 'In Stock',
    }
    setItems((current) => [item, ...current])
    onClose()
  }

  return (
    <>
      <section className="operational-kpi-grid five">
        <OperationalKpi label="Total Inventory Value" value={`RM ${totalValue.toLocaleString()}`} detail="Current stock at cost" icon={CircleDollarSign} />
        <OperationalKpi label="Low Stock Items" value={items.filter((item) => item.status === 'Low Stock').length} detail="Reorder recommended" icon={TriangleAlert} tone="gold" />
        <OperationalKpi label="Expiring Soon" value={items.filter((item) => item.status === 'Expiring Soon').length} detail="Within 30 days" icon={CalendarClock} tone="gold" />
        <OperationalKpi label="Monthly Usage Cost" value="RM 4,860" detail="Estimated consumables" icon={Boxes} />
        <OperationalKpi label="Retail Products" value={items.filter((item) => item.retailProduct).length} detail="Available for guest sale" icon={ShoppingBag} />
      </section>

      <section className="filter-panel">
        <div className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stock item" /></div>
        <label className="filter-control"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{[...new Set(items.map((item) => item.category))].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="filter-control"><span>Stock status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option>Expiring Soon</option></select></label>
        <label className="filter-control"><span>Supplier</span><select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option>All</option>{[...new Set(items.map((item) => item.supplier))].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="filter-control"><span>Expiry</span><select value={expiry} onChange={(event) => setExpiry(event.target.value)}><option>All</option><option>Valid</option><option>Expiring Soon</option><option>No Expiry</option></select></label>
      </section>

      <section className="records-panel">
        <div className="records-header">
          <div><span className="panel-kicker">Stock control</span><h2 className="panel-title">{filtered.length} inventory items</h2></div>
          <button className="secondary-button" type="button" onClick={onOpen}><PackagePlus size={15} /> Add Stock Item</button>
        </div>
        <div className="inventory-list">
          {filtered.map((item) => (
            <article className="inventory-record" key={item.id}>
              <div className="inventory-item-column">
                <span className="inventory-icon"><Boxes size={17} /></span>
                <div className="inventory-name"><strong>{item.name}</strong><span>{item.category} · {item.id}</span></div>
              </div>
              <div className="inventory-stock-column"><span className="record-label">Current stock</span><strong>{item.currentStock} {item.unit}</strong><small>Reorder at {item.reorderLevel}</small></div>
              <div className="inventory-cost-column"><span className="record-label">Unit cost</span><strong>RM {item.costPerUnit.toFixed(2)}</strong><small>{item.supplier}</small></div>
              <div className="inventory-expiry-column"><span className="record-label">Expiry</span><strong>{item.expiryDate}</strong></div>
              <div className="inventory-service"><span className="record-label">Linked usage</span><strong>{item.linkedServices.join(', ') || 'Not linked'}</strong></div>
              <div className="inventory-status-column"><span className={`domain-badge ${stockClass[item.status]}`}>{item.status}</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="usage-rules-panel">
        <div className="records-header">
          <div><span className="panel-kicker">Service usage rules</span><h2 className="panel-title">Planned stock consumption</h2></div>
          <span className="automation-ready-note"><Link2 size={14} /> Auto-deduct after completed appointments</span>
        </div>
        <div className="usage-rule-grid">
          {serviceUsageRules.map((rule) => (
            <article className="usage-rule-card" key={rule.id}>
              <span className="usage-rule-icon"><Link2 size={17} /></span>
              <h3>{rule.service}</h3>
              {rule.items.map((item) => <p key={item}>{item}</p>)}
            </article>
          ))}
        </div>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={onClose}
        title="Add Stock Item"
        eyebrow="Inventory catalog"
        footer={<><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit" form="inventory-form">Add item</button></>}
      >
        <form className="drawer-form" id="inventory-form" onSubmit={handleCreate}>
          <FormField label="Item name" full><input name="name" required placeholder="Stock item name" /></FormField>
          <FormField label="Category"><select name="category"><option>Essential Oil</option><option>Massage Cream</option><option>Disposable</option><option>Towel & Linen</option><option>Tea & Beverage</option><option>Aromatherapy</option><option>Retail Product</option><option>Cleaning Supply</option></select></FormField>
          <FormField label="Supplier"><input name="supplier" required placeholder="Supplier name" /></FormField>
          <FormField label="Current stock"><input name="currentStock" type="number" min="0" required /></FormField>
          <FormField label="Unit"><input name="unit" required placeholder="bottles, pcs, packs" /></FormField>
          <FormField label="Reorder level"><input name="reorderLevel" type="number" min="0" required /></FormField>
          <FormField label="Cost per unit"><input name="costPerUnit" type="number" min="0" step="0.01" required /></FormField>
          <FormField label="Expiry date"><input name="expiryDate" type="date" /></FormField>
          <label className="toggle-field"><input name="retailProduct" type="checkbox" /><span>Retail product available for customer sale</span></label>
          <FormField label="Linked services" full><input name="linkedServices" placeholder="Comma-separated service names" /></FormField>
          <FormField label="Notes" full><textarea name="notes" rows={4} placeholder="Storage, ordering, or usage notes" /></FormField>
        </form>
      </Drawer>
    </>
  )
}
