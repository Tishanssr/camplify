import { useEffect, useState } from 'react'
import { FaPlus, FaTrash } from 'react-icons/fa'
import ScreenLayout from '../components/layout/ScreenLayout'
import { EmptyState } from '../components/common/PageState'
import { checklistService } from '../services/checklistService'

export default function PersonalChecklist() {
  const [items, setItems] = useState([])
  const [newItemName, setNewItemName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChecklist() {
      try {
        const data = await checklistService.getPersonalChecklist()
        if (data.success && Array.isArray(data.items)) {
          setItems(data.items)
        } else {
          setItems([])
        }
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    loadChecklist()
  }, [])

  const handleAddItem = async (e) => {
    e?.preventDefault()
    if (!newItemName.trim()) return

    const newItem = { name: newItemName.trim(), done: false }
    setItems(prev => [...prev, newItem])
    setNewItemName('')

    try {
      await checklistService.addPersonalItem(newItem)
    } catch (err) {
      console.error('Failed to sync item to backend:', err)
    }
  }

  const handleToggleItem = async (index) => {
    const targetItem = items[index]
    const updatedDone = !targetItem.done

    setItems(prev => prev.map((item, i) => i === index ? { ...item, done: updatedDone } : item))

    if (targetItem._id || targetItem.id) {
      try {
        await checklistService.togglePersonalItem(targetItem._id || targetItem.id, updatedDone)
      } catch (err) {
        console.error('Failed to toggle item:', err)
      }
    }
  }

  const handleDeleteItem = async (index) => {
    const targetItem = items[index]
    setItems(prev => prev.filter((_, i) => i !== index))

    if (targetItem._id || targetItem.id) {
      try {
        await checklistService.deletePersonalItem(targetItem._id || targetItem.id)
      } catch (err) {
        console.error('Failed to delete item:', err)
      }
    }
  }

  if (loading) {
    return (
      <ScreenLayout title="My Checklist">
        <div className="screen-page p-8 text-center text-gray-400">Loading checklist...</div>
      </ScreenLayout>
    )
  }

  if (items.length === 0) {
    return (
      <ScreenLayout title="My Checklist">
        <div className="screen-page">
          <EmptyState
            title="Your checklist is clear"
            description="Add your personal gear for your next adventure."
            action={
              <form onSubmit={handleAddItem} className="flex gap-2">
                <input
                  className="px-3 py-2 bg-emerald-950/60 border border-emerald-800/40 rounded-lg text-white text-sm"
                  placeholder="Enter item name..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <button type="submit" className="new-trip-button flex items-center gap-1">
                  <FaPlus /> Add item
                </button>
              </form>
            }
          />
        </div>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout title="My Checklist">
      <div className="personal-checklist screen-page">
        <div className="checklist-page-heading">
          <div>
            <h1>Personal checklist</h1>
            <p>Items only you need to pack for your trip.</p>
          </div>
          <form onSubmit={handleAddItem} className="flex gap-2 items-center">
            <input
              className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/40 rounded-lg text-white text-sm"
              placeholder="Add personal item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <button type="submit" className="flex items-center gap-1">
              <FaPlus /> Add
            </button>
          </form>
        </div>

        <section className="personal-list">
          {items.map((item, index) => (
            <label key={`${item.name}-${index}`}>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => handleToggleItem(index)}
              />
              <span>{item.done && '✓'}</span>
              <b>{item.name}</b>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleDeleteItem(index)
                }}
                aria-label="Delete item"
              >
                <FaTrash className="w-3 h-3 text-gray-400 hover:text-red-400" />
              </button>
            </label>
          ))}
        </section>
      </div>
    </ScreenLayout>
  )
}
