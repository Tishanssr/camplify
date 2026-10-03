import crypto from 'crypto'
import userModel from '../model/userModel.js'

// ─── Initiate PayHere Checkout Session ────────────────────────────────────────

export const initiatePayment = async (req, res) => {
  try {
    const userID = req.userID
    const user = await userModel.findById(userID)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID || '1221111'
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || ''
    const amountNum = Number(process.env.PREMIUM_YEARLY_PRICE || 2990)
    const amountFormatted = amountNum.toFixed(2)
    const currency = 'LKR'

    const orderId = `PREMIUM-${user._id}-${Date.now()}`

    // Hash calculation: md5(merchant_id + order_id + amount + currency + md5(merchant_secret).toUpperCase()).toUpperCase()
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase()

    const hash = crypto
      .createHash('md5')
      .update(merchantId + orderId + amountFormatted + currency + hashedSecret)
      .digest('hex')
      .toUpperCase()

    const serverUrl = process.env.SERVER_URL || 'http://localhost:4000'
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    const payhereConfig = {
      sandbox: true,
      merchant_id: merchantId,
      return_url: `${clientUrl}/pricing?status=success`,
      cancel_url: `${clientUrl}/pricing?status=cancel`,
      notify_url: `${serverUrl}/api/payments/payhere-notify`,
      order_id: orderId,
      items: 'Camplify Premium Membership (1 Year)',
      amount: amountFormatted,
      currency: currency,
      hash: hash,
      first_name: user.name.split(' ')[0] || user.name,
      last_name: user.name.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || '0770000000',
      address: user.homeTown || 'Colombo',
      city: user.homeTown || 'Colombo',
      country: 'Sri Lanka',
      custom_1: String(user._id),
    }

    res.json({ success: true, payhereConfig })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── PayHere Webhook Notification ─────────────────────────────────────────────

export const payhereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1,
    } = req.body

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || ''
    const hashedSecret = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase()

    const localMd5sig = crypto
      .createHash('md5')
      .update(
        merchant_id +
          order_id +
          payhere_amount +
          payhere_currency +
          status_code +
          hashedSecret
      )
      .digest('hex')
      .toUpperCase()

    if (!md5sig || md5sig.toUpperCase() !== localMd5sig) {
      console.warn(`[PayHere Webhook] Invalid signature for order ${order_id}`)
      return res.status(400).json({ success: false, message: 'Invalid signature' })
    }

    // Status code 2 = Success in PayHere
    if (String(status_code) === '2') {
      const userId = custom_1 || (order_id ? order_id.split('-')[1] : null)
      if (userId) {
        const user = await userModel.findById(userId)
        if (user) {
          if (user.payhereSubscriptionId === order_id) {
            console.log(`[PayHere Webhook] Duplicate notification for order ${order_id} - skipping duplicate processing.`)
            return res.status(200).send('OK')
          }
          user.isPremium = true
          user.premiumActivatedAt = new Date()
          const expiresAt = new Date()
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
          user.premiumExpiresAt = expiresAt
          user.payhereSubscriptionId = order_id
          await user.save()
          console.log(`[PayHere Webhook] Premium activated for user ${user._id} (${user.email}) until ${expiresAt.toISOString()}`)
        }
      }
    }

    res.status(200).send('OK')
  } catch (error) {
    console.error('[PayHere Webhook Error]:', error)
    res.status(500).send('Internal Server Error')
  }
}
