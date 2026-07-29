import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function AuthInput({ label, type = 'text', id, ...props }) {
  const [visible, setVisible] = useState(false)
  const password = type === 'password'

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="input-wrap">
        <input id={id} type={password && visible ? 'text' : type} {...props} />
        {password && (
          <button
            className="password-toggle"
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </span>
    </label>
  )
}
