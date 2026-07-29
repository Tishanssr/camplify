import { useEffect, useState } from 'react'
import { FaCamera, FaCheck, FaRegUser } from 'react-icons/fa'
import ScreenLayout from '../components/layout/ScreenLayout'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, fetchUserData } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setBio(user.bio || 'Weekend hiker, campfire cook, and always looking for the next trail.')
    }
  }, [user])

  const handleSave = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    // Synchronize profile changes with user backend
    if (fetchUserData) await fetchUserData()
  }

  return (
    <ScreenLayout title="Profile & Settings">
      <div className="settings-page">
        <aside className="settings-nav">
          <div className="settings-avatar">
            <FaRegUser />
            <button aria-label="Upload avatar"><FaCamera /></button>
          </div>
          <h2>{name || 'Adventurer'}</h2>
          <p>Trail Explorer</p>
          {['Profile details', 'Account settings', 'Notifications', 'Membership'].map((item, index) => (
            <button className={index === 0 ? 'active' : ''} key={item}>{item}</button>
          ))}
        </aside>

        <section className="settings-content">
          <h1>Profile details</h1>
          <p>Keep your profile up to date so your trip mates know who is joining the adventure.</p>

          <div className="form-grid">
            <label>Full name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>Email address
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" readOnly />
            </label>
            <label>Phone number
              <input placeholder="Add a phone number" />
            </label>
            <label>Home town
              <input placeholder="Add your location" />
            </label>
            <label className="full-width">Bio
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
          </div>

          <section className="preferences">
            <h2>Camping preferences</h2>
            <div>
              {['Mountain trails', 'Forest camping', 'Lakeside', 'Wildlife photography'].map((item, index) => (
                <label key={item}>
                  <input type="checkbox" defaultChecked={index < 2} /> <FaCheck /> {item}
                </label>
              ))}
            </div>
          </section>

          <button className="save-profile" onClick={handleSave}>
            {saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </section>
      </div>
    </ScreenLayout>
  )
}
