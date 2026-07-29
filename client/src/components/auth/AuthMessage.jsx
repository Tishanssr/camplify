export default function AuthMessage({ message }) {
  if (!message) return null
  return <p className="form-message" role="alert">{message}</p>
}
