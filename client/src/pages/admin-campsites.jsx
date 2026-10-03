import { useEffect, useState } from 'react'
import {
  FaCampground,
  FaCloudUploadAlt,
  FaEdit,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
  FaTrashAlt,
  FaTimes,
} from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { toast } from 'react-toastify'
import ScreenLayout from '../components/layout/ScreenLayout'
import StatCard from '../components/dashboard/StatCard'
import { getImageUrl } from '../utils/imageUtils'
import { campsiteService } from '../services/campsiteService'
import { geoapifyService } from '../services/geoapifyService'
import GeoapifyAutocomplete from '../components/common/GeoapifyAutocomplete'
import GeoapifyMap from '../components/common/GeoapifyMap'

const PREDEFINED_TAGS = [
  'Mountain',
  'River',
  'Forest',
  'Lake',
  'Beach',
  'Hiking',
  'Wildlife',
  'Waterfall',
  'Glamping',
  'Campfire',
  'Pet Friendly',
  'Parking',
]


const formatTags = (rawTags) => {
  let list = []
  if (Array.isArray(rawTags)) {
    list = rawTags.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
  } else if (typeof rawTags === 'string' && rawTags.trim()) {
    try {
      const parsed = JSON.parse(rawTags)
      if (Array.isArray(parsed)) {
        list = parsed.flatMap((t) => (typeof t === 'string' ? t.split(',') : t)).map((t) => String(t).trim()).filter(Boolean)
      } else {
        list = rawTags.split(',').map((t) => t.trim()).filter(Boolean)
      }
    } catch {
      list = rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    }
  }
  return list.length > 0 ? list : ['Camping']
}

export default function AdminCampsites() {
  const [campsites, setCampsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [selectedCampsiteId, setSelectedCampsiteId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [campsiteToDelete, setCampsiteToDelete] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    tags: [],
    lat: '',
    lng: '',
  })
  const [existingImages, setExistingImages] = useState([])
  const [newPhotoFiles, setNewPhotoFiles] = useState([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([])
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfFileName, setPdfFileName] = useState('')
  const [hasExistingPdf, setHasExistingPdf] = useState(false)
  const [removePdf, setRemovePdf] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchCampsites = async (query = '') => {
    setLoading(true)
    try {
      const res = await campsiteService.getCampsites(query)
      if (res.success) {
        setCampsites(res.campsites || [])
      }
    } catch (err) {
      console.error('Failed to load campsites:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampsites(searchQuery)
  }, [searchQuery])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedCampsiteId(null)
    setFormData({
      name: '',
      location: '',
      description: '',
      tags: ['Mountain', 'Forest'],
      lat: '',
      lng: '',
    })
    setExistingImages([])
    setNewPhotoFiles([])
    setNewPhotoPreviews([])
    setPdfFile(null)
    setPdfFileName('')
    setHasExistingPdf(false)
    setRemovePdf(false)
    setErrorMsg('')
    setSuccessMsg('')
    setIsModalOpen(true)
  }

  const openEditModal = (campsite) => {
    setModalMode('edit')
    setSelectedCampsiteId(campsite._id)
    
    let existingTags = []
    if (Array.isArray(campsite.tags)) {
      existingTags = campsite.tags
    } else if (typeof campsite.tags === 'string' && campsite.tags.trim()) {
      existingTags = campsite.tags.split(',').map((t) => t.trim()).filter(Boolean)
    }

    const imgs = campsite.images && campsite.images.length > 0 ? campsite.images : (campsite.image ? [campsite.image] : [])

    setFormData({
      name: campsite.name || '',
      location: campsite.location || '',
      description: campsite.description || '',
      tags: existingTags,
      lat: campsite.coordinates?.lat !== undefined ? String(campsite.coordinates.lat) : '',
      lng: campsite.coordinates?.lng !== undefined ? String(campsite.coordinates.lng) : '',
    })
    setExistingImages(imgs)
    setNewPhotoFiles([])
    setNewPhotoPreviews([])
    setPdfFile(null)
    setPdfFileName('')
    setHasExistingPdf(Boolean(campsite.hasOfflineMap))
    setRemovePdf(false)
    setErrorMsg('')
    setSuccessMsg('')
    setIsModalOpen(true)
  }


  const handlePhotoFilesChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const validJpgFiles = []
    let invalidCount = 0

    files.forEach((file) => {
      const isJpg =
        file.type === 'image/jpeg' ||
        file.type === 'image/jpg' ||
        /\.(jpg|jpeg)$/i.test(file.name)

      if (isJpg) {
        validJpgFiles.push(file)
      } else {
        invalidCount++
      }
    })

    if (invalidCount > 0) {
      setErrorMsg(`Only JPG (.jpg, .jpeg) files are allowed. ${invalidCount} non-JPG file(s) were ignored.`)
    }

    if (validJpgFiles.length > 0) {
      setNewPhotoFiles((prev) => [...prev, ...validJpgFiles])
      validJpgFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setNewPhotoPreviews((prev) => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
      })
    }

    e.target.value = ''
  }

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeNewPhoto = (idx) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== idx))
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const toggleTag = (tagToToggle) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tagToToggle)
      const newTags = exists
        ? prev.tags.filter((t) => t !== tagToToggle)
        : [...prev.tags, tagToToggle]
      return { ...prev, tags: newTags }
    })
  }

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setErrorMsg('Please select a valid PDF document (.pdf).')
      return
    }
    setPdfFile(file)
    setPdfFileName(file.name)
    setRemovePdf(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.name.trim() || !formData.location.trim()) {
      setErrorMsg('Campsite Name and Location are required.')
      return
    }

    setSubmitting(true)
    try {
      const dataPayload = new FormData()
      dataPayload.append('name', formData.name.trim())
      dataPayload.append('location', formData.location.trim())
      dataPayload.append('description', formData.description.trim())
      dataPayload.append('tags', JSON.stringify(formData.tags))
      if (formData.lat !== '') dataPayload.append('lat', formData.lat)
      if (formData.lng !== '') dataPayload.append('lng', formData.lng)

      dataPayload.append('existingImages', JSON.stringify(existingImages))

      newPhotoFiles.forEach((file) => {
        dataPayload.append('photos', file)
      })

      if (pdfFile) {
        dataPayload.append('offlineMapPdf', pdfFile)
      }
      if (removePdf) {
        dataPayload.append('removePdf', 'true')
      }

      let res
      if (modalMode === 'add') {
        res = await campsiteService.createCampsite(dataPayload)
      } else {
        res = await campsiteService.updateCampsite(selectedCampsiteId, dataPayload)
      }


      if (res.success) {
        setSuccessMsg(res.message || 'Campsite saved successfully!')
        setTimeout(() => {
          setIsModalOpen(false)
          fetchCampsites(searchQuery)
        }, 1000)
      } else {
        setErrorMsg(res.message || 'Failed to save campsite')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!campsiteToDelete) return
    setIsDeleting(true)
    try {
      const res = await campsiteService.deleteCampsite(campsiteToDelete._id)
      if (res.success) {
        setCampsiteToDelete(null)
        fetchCampsites(searchQuery)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete campsite')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ScreenLayout title="Campsite Portal">
      <div className="dashboard-page">
        {/* Welcome Section */}
        <section className="dashboard-welcome">
          <div>
            <h2>Admin Campsite Portal </h2>
            <p>Manage campsite inventory, geolocation pins, attributes, and Cloud storage photos.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="next-trip hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              <br />
              <b>System Control Center</b>
            </p>
            <button
              onClick={openAddModal}
              className="new-trip-button cursor-pointer mt-1"
            >
              <FaPlus /> Add New Campsite
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-7">
          <StatCard
            icon={<FaCampground />}
            label="Total Campsites"
            value={String(campsites.length)}
            detail="Registered sites"
            tone="green"
          />
          <StatCard
            icon={<FaCloudUploadAlt />}
            label="Cloud Storage"
            value={String(campsites.filter((s) => s.image).length)}
            detail="Uploaded photos"
            tone="blue"
          />
        </section>

        {/* Search & Action Bar */}
        <div className="mb-6 space-y-3">
          <div className="explore-search">
            <label>
              <FaSearch />
              <input
                type="text"
                placeholder="Search campsites by name, region, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:bg-emerald-50 text-gray-500 hover:text-emerald-700"
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>
          <div className="flex justify-between items-center px-1 text-xs text-gray-500 font-medium">
            <span>Showing {campsites.length} campsite{campsites.length !== 1 ? 's' : ''}</span>
            {searchQuery && <span>Filter: "{searchQuery}"</span>}
          </div>
        </div>

        {/* Campsites Grid */}
        {loading ? (
          <div className="page-state">
            <div className="loading-state"><i /></div>
            <p className="mt-3">Loading campsites database...</p>
          </div>
        ) : campsites.length === 0 ? (
          <div className="page-state">
            <h2>No Campsites Found</h2>
            <p>Try adjusting your search filters or create a new campsite entry.</p>
            <button onClick={openAddModal} className="primary-button mt-3">
              + Add First Campsite
            </button>
          </div>
        ) : (
          <div className="campsite-grid">
            {campsites.map((site) => (
              <article key={site._id} className="campsite-card flex flex-col justify-between group">
                <div>
                  {/* Photo Header */}
                  <div className="campsite-image">
                    <img
                      src={getImageUrl(site.image)}
                      alt={site.name}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'
                      }}
                    />
                    {site.images && site.images.length > 1 && (
                      <span className="absolute top-3 right-3 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                        {site.images.length} photos
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="campsite-info">
                    <h2 className="text-base font-bold text-gray-900 line-clamp-1">{site.name}</h2>
                    <p className="flex items-center gap-1.5 mt-1 font-semibold text-emerald-700 text-xs">
                      <FaMapMarkerAlt className="shrink-0 text-emerald-600" />
                      <span>{site.location}</span>
                    </p>

                    {site.description && (
                      <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {site.description}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {formatTags(site.tags).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Coordinates Badge if available */}
                    {site.coordinates?.lat !== undefined && site.coordinates?.lng !== undefined && (
                      <div className="mt-2 text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        📍 <span>{site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 border-t border-[#edf1ed] bg-[#fbfdfb] flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(site)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => setCampsiteToDelete(site)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <FaTrashAlt /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-[#e6ede7] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#edf1ed] bg-[#f8faf8]">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FaCampground className="text-emerald-600" />
                  {modalMode === 'add' ? 'Add New Campsite' : 'Edit Campsite'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-gray-700">
                {errorMsg && (
                  <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-bold">
                    {successMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="field">
                    <label>Campsite Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Whispering Pines Camp"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Location Autocomplete */}
                  <div>
                    <GeoapifyAutocomplete
                      label="Location / Region *"
                      value={formData.location}
                      placeholder="Search city or location..."
                      onChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
                      onSelect={(place) => {
                        if (place) {
                          setFormData((prev) => ({
                            ...prev,
                            location: place.formatted,
                            lat: place.lat ? String(place.lat) : prev.lat,
                            lng: place.lng ? String(place.lng) : prev.lng,
                          }))
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Map Widget */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Exact Pin on Map (Click map to position)
                  </label>
                  <GeoapifyMap
                    height="180px"
                    center={
                      formData.lat && formData.lng
                        ? [parseFloat(formData.lat), parseFloat(formData.lng)]
                        : [7.8731, 80.7718]
                    }
                    zoom={formData.lat && formData.lng ? 12 : 8}
                    onMapClick={({ lat, lng }) => {
                      setFormData((prev) => ({ ...prev, lat: String(lat), lng: String(lng) }))
                      geoapifyService.reverseGeocode(lat, lng).then((result) => {
                        if (result?.formatted) {
                          setFormData((prev) => ({ ...prev, location: result.formatted }))
                        }
                      })
                    }}
                    markers={
                      formData.lat && formData.lng
                        ? [
                            {
                              id: 'admin-selected-pin',
                              title: formData.name || 'Campsite Location',
                              lat: parseFloat(formData.lat),
                              lng: parseFloat(formData.lng),
                              type: 'campsite',
                            },
                          ]
                        : []
                    }
                  />
                </div>

                {/* Feature Tags Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Feature Tags
                  </label>

                  {/* Selected & Available Tag Pills */}
                  <div className="flex flex-wrap gap-1.5 p-3 bg-[#f8faf8] border border-[#e6ede7] rounded-xl">
                    {PREDEFINED_TAGS.map((tag) => {
                      const isSelected = formData.tags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="field">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the campsite, features, and vibe..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-[#dfe5df] rounded-xl outline-none focus:border-[#4b9f4a] text-xs font-normal"
                  />
                </div>

                {/* Coordinates numeric display */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 6.9271"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 79.8612"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    />
                  </div>
                </div>

                {/* Cloud Storage Photo Upload (Multi-Photo Support) */}
                <div className="border-t border-[#edf1ed] pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-700">
                      Campsite Photos (Cloud Storage File Upload)
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {existingImages.length + newPhotoFiles.length} photo(s) selected
                    </span>
                  </div>

                  <div className="relative border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer bg-emerald-50/40 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,image/jpeg"
                      onChange={handlePhotoFilesChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FaCloudUploadAlt className="mx-auto text-3xl text-emerald-600 mb-1" />
                    <p className="text-xs font-bold text-emerald-800">
                      Upload Photo Files (JPG / JPEG only)
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Click or drop one or more .jpg or .jpeg photo files here
                    </p>
                  </div>

                  {/* Multi-Photo Preview Gallery */}
                  {(existingImages.length > 0 || newPhotoPreviews.length > 0) && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Photo Gallery Preview (Click X to remove photo)</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-[#edf1ed] rounded-xl bg-gray-50/50">
                        {/* Existing Images */}
                        {existingImages.map((url, idx) => (
                          <div key={`existing-${idx}`} className="relative group h-24 rounded-lg overflow-hidden border border-gray-200">
                            <img src={getImageUrl(url)} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                            <span className="absolute top-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                              {idx === 0 ? 'Cover' : `#${idx + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-[10px] transition-transform active:scale-90"
                              title="Remove photo"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}

                        {/* New Upload Previews */}
                        {newPhotoPreviews.map((previewUrl, idx) => (
                          <div key={`new-${idx}`} className="relative group h-24 rounded-lg overflow-hidden border border-emerald-300">
                            <img src={previewUrl} alt={`New ${idx}`} className="w-full h-full object-cover" />
                            <span className="absolute top-1 left-1 bg-emerald-700 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                              New
                            </span>
                            <button
                              type="button"
                              onClick={() => removeNewPhoto(idx)}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-[10px] transition-transform active:scale-90"
                              title="Remove photo"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Offline Map PDF Upload Section */}
                <div className="border-t border-[#edf1ed] pt-4 space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Offline Campsite Map (PDF Document)
                  </label>

                  {hasExistingPdf && !removePdf ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <span className="font-bold text-emerald-900 flex items-center gap-2">
                        📄 Offline PDF Map is currently attached to this campsite
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRemovePdf(true)
                          setPdfFile(null)
                          setPdfFileName('')
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-800"
                      >
                        Remove PDF
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfChange}
                        className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {pdfFileName && (
                        <span className="text-xs font-semibold text-emerald-800">
                          Selected: {pdfFileName}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#edf1ed]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="primary-button"
                  >
                    {submitting ? 'Saving...' : modalMode === 'add' ? 'Create Campsite' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {campsiteToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-[#e6ede7] max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-3 bg-red-50 rounded-xl">
                  <FaExclamationTriangle className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete Campsite</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{campsiteToDelete.name}"</span>?
              </p>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#edf1ed]">
                <button
                  onClick={() => setCampsiteToDelete(null)}
                  className="text-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScreenLayout>
  )
}


