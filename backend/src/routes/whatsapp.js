const express = require('express')
const { sendWhatsApp } = require('../services/whatsapp')
const prisma = require('../lib/prisma')
const { protect } = require('../middleware/auth')

const router = express.Router()

// ─── TWILIO WEBHOOK (receives incoming WhatsApp) ──
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body } = req.body

    // Extract phone number
    const phone = From.replace('whatsapp:', '')
    const message = Body?.trim().toLowerCase()

    console.log(`📱 Incoming WhatsApp from ${phone}: ${message}`)

    // Find user by phone
    const user = await prisma.user.findFirst({
      where: { phone: { contains: phone.replace('+91', '') } }
    })

    if (!user) {
      await sendWhatsApp(phone,
        `👋 Welcome to *AnnaSetu*!\n\n` +
        `We couldn't find your account.\n` +
        `Please register at: http://localhost:3000/register\n\n` +
        `_Bridging Food. Reducing Waste._ 🌱`
      )
      return res.status(200).send('<Response></Response>')
    }

    // Handle commands
    if (message.includes('help') || message === 'hi' || message === 'hello') {
      await sendWhatsApp(phone,
        `🌱 *AnnaSetu Help Menu*\n\n` +
        `Hello ${user.name}! Here are your options:\n\n` +
        `📊 Type *status* — see your latest activity\n` +
        `🍱 Type *donate* — go to donation page\n` +
        `📍 Type *nearby* — see nearby donations\n\n` +
        `Or visit: http://localhost:3000\n\n` +
        `_Together we can end food waste!_ 🙏`
      )
    } else if (message === 'status') {
      const impact = await prisma.impact.findUnique({
        where: { userId: user.id }
      })
      await sendWhatsApp(phone,
        `📊 *Your AnnaSetu Stats*\n\n` +
        `👤 Name: ${user.name}\n` +
        `🎭 Role: ${user.role}\n` +
        `🍱 Meals saved: ${impact?.totalMeals || 0}\n` +
        `🌿 CO₂ saved: ${impact?.totalCo2 || 0} kg\n` +
        `🪙 GreenCoins: ${impact?.greenCoins || 0}\n\n` +
        `Keep up the great work! 💪`
      )
    } else {
      await sendWhatsApp(phone,
        `👋 Hi ${user.name}!\n\n` +
        `Type *help* to see available commands.\n` +
        `Or visit: http://localhost:3000`
      )
    }

    res.status(200).send('<Response></Response>')

  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── TEST WHATSAPP (send test message) ────────────
router.post('/test', protect, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing'
      })
    }

    const phone = req.body.phone
    const message = req.body.message

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and message'
      })
    }

    console.log(`📱 Sending test SMS to: ${phone}`)
    const { sendSMS } = require('../services/whatsapp')
    const result = await sendSMS(phone, message)

    res.status(200).json({
      success: result.success,
      message: result.success ? 'SMS sent successfully!' : 'SMS failed',
      result
    })

  } catch (error) {
    console.error('SMS test error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})
module.exports = router