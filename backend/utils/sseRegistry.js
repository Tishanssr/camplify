// In-memory SSE client registry mapping userId to a Set of express response streams

class SSERegistry {
  constructor() {
    // Map<userId (string), Set<res (Express Response)>>
    this.clients = new Map()
  }

  registerClient(userId, res) {
    const idStr = String(userId)
    if (!this.clients.has(idStr)) {
      this.clients.set(idStr, new Set())
    }
    this.clients.get(idStr).add(res)
    console.log(`[SSE] Client connected for user ${idStr}. Total clients for user: ${this.clients.get(idStr).size}`)
  }

  removeClient(userId, res) {
    const idStr = String(userId)
    if (this.clients.has(idStr)) {
      const set = this.clients.get(idStr)
      set.delete(res)
      if (set.size === 0) {
        this.clients.delete(idStr)
      }
      console.log(`[SSE] Client disconnected for user ${idStr}`)
    }
  }

  sendToUser(userId, eventName, data) {
    const idStr = String(userId)
    const userClients = this.clients.get(idStr)
    if (!userClients || userClients.size === 0) return

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of userClients) {
      try {
        res.write(payload)
      } catch (err) {
        console.error(`[SSE] Error writing to stream for user ${idStr}:`, err)
      }
    }
  }
}

export const sseRegistry = new SSERegistry()
