export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required.' }
  }
  const hasMinLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasMinLength || !hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long and contain at least one letter and one number.'
    }
  }

  return { isValid: true, message: '' }
}
