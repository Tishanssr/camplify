import { sseRegistry } from '../utils/sseRegistry.js'

export const subscribeSSE = async (req, res) => {
  const userID = req.userID
  if (!userID) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable buffering for Nginx/proxies

  res.flushHeaders?.()

  // Send initial connection handshake event
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE Connection Established', userId: userID })}\n\n`)

  // Register connection
  sseRegistry.registerClient(userID, res)

  // Heartbeat every 25 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch {
      clearInterval(heartbeatInterval)
    }
  }, 25000)

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval)
    sseRegistry.removeClient(userID, res)
    res.end()
  })
}
