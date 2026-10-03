import { useEffect, useRef, useState } from 'react'
import { FaMapMarkerAlt, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa'
import { geoapifyService } from '../../services/geoapifyService'

export default function GeoapifyAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search location, city or landmark...',
  label = '',
  required = false,
  className = '',
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const results = await geoapifyService.autocomplete(query)
      setSuggestions(results)
      setLoading(false)
      if (results && results.length > 0) {
        setIsOpen(true)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)
    if (onChange) onChange(val)
  }

  const handleSelect = (item) => {
    setQuery(item.formatted)
    setIsOpen(false)
    if (onChange) onChange(item.formatted)
    if (onSelect) onSelect(item)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    if (onChange) onChange('')
    if (onSelect) onSelect(null)
  }

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-gray-400 text-sm pointer-events-none">
          {loading ? <FaSpinner className="animate-spin text-emerald-600" /> : <FaSearch />}
        </span>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all shadow-xs"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-600 border-0 bg-transparent p-1 cursor-pointer transition-colors"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-[9999] left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-2xl py-1 divide-y divide-gray-100 text-left">
          {suggestions.map((item, idx) => (
            <li key={idx}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                }}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 cursor-pointer border-0 bg-transparent transition-colors flex items-start gap-2.5 group"
              >
                <span className="mt-0.5 p-1 bg-emerald-100 text-emerald-700 rounded-md group-hover:bg-emerald-700 group-hover:text-white transition-colors shrink-0">
                  <FaMapMarkerAlt className="text-xs" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-900 truncate mb-0.5">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-500 group-hover:text-emerald-700 truncate">
                    {item.formatted}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
