import { useEffect, useState } from 'react'
import { FaEdit, FaTimes, FaTrash } from 'react-icons/fa'
import { tripService } from '../../services/tripService'
import { getTodayString } from '../../utils/dateUtils'

export default function EditTripModal({ trip, isOpen, onClose, onSuccess, onDelete }) {
  const todayStr = getTodayString()
  const [form, setForm] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    meetingPoint: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (trip) {
      const formatDateForInput = (d) => {
        if (!d) return ''
        try {
          return new Date(d).toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      setForm({
        name: trip.name || '',
        location: trip.location || '',
        startDate: formatDateForInput(trip.startDate),
        endDate: formatDateForInput(trip.endDate),
        meetingPoint: trip.meetingPoint || '',
        description: trip.description || '',
      })
      setError('')
    }
  }, [trip, isOpen])

  if (!isOpen || !trip) return null

  const tripId = trip._id || trip.id

  const handleChange = (field, val) => {
    setError('')
    setForm(prev => ({ ...prev, [field]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.location.trim()) {
      setError('Trip name and location are required.')
      return
    }

    if (form.startDate && form.startDate < todayStr) {
      setError('Start date cannot be in the past.')
      return
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('End date cannot be before start date.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const updatePayload = {
        name: form.name.trim(),
        location: form.location.trim(),
        meetingPoint: form.meetingPoint.trim(),
        description: form.description.trim(),
      }
      if (form.startDate) updatePayload.startDate = new Date(form.startDate)
      if (form.endDate) updatePayload.endDate = new Date(form.endDate)

      const res = await tripService.updateTrip(tripId, updatePayload)

      if (res.success) {
        if (onSuccess) onSuccess(res.trip || { ...trip, ...updatePayload })
        onClose()
      } else {
        setError(res.message || 'Failed to update trip')
      }
    } catch (err) {
      console.error('Update trip error:', err)
      setError(err.response?.data?.message || 'Error updating trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${trip.name}"? This action will permanently delete the trip and remove all participants.`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await tripService.deleteTrip(tripId)
      if (res.success) {
        if (onDelete) onDelete(tripId)
        onClose()
      } else {
        setError(res.message || 'Failed to delete trip')
      }
    } catch (err) {
      console.error('Delete trip error:', err)
      setError(err.response?.data?.message || 'Error deleting trip. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 border-0 bg-transparent cursor-pointer p-1"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FaEdit className="text-emerald-700" /> Edit Trip Details
        </h2>
        <p className="text-xs text-gray-500">Update information for <b>{trip.name}</b>.</p>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Trip Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Campsite *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
              value={form.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                min={todayStr}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                min={form.startDate || todayStr}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Point</label>
            <input
              type="text"
              placeholder="e.g. Trailhead main gate at 7:30 AM"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
              value={form.meetingPoint}
              onChange={(e) => handleChange('meetingPoint', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Add details about your trip..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 resize-none"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:text-red-800 font-semibold border border-red-200 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <FaTrash /> Delete Trip
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
