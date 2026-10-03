export default function AuthMessage({ message, type }) {
  if (!message) return null

  let isSuccess = false

  if (type === 'success') {
    isSuccess = true
  } else if (type === 'error') {
    isSuccess = false
  } else {
    const isExplicitError = /invalid|failed|error|could not|expired|incorrect|don't match|doesn't match|already|unable|required|cannot|wrong/i.test(message)
    const isExplicitSuccess = /sent|success|created|verified|updated/i.test(message)
    isSuccess = !isExplicitError && isExplicitSuccess
  }

  const variantClass = isSuccess ? 'form-message-success' : 'form-message-error'

  return <p className={`form-message ${variantClass}`} role="alert">{message}</p>
}
