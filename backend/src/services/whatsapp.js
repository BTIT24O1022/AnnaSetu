const axios = require('axios')

// ─── CORE: Send SMS via Fast2SMS (Free) ───────────
async function sendSMS(toPhone, message) {
  try {
    const formattedPhone = formatPhone(toPhone)

    console.log(`📱 Sending SMS to ${formattedPhone}...`)

    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'v3',
        sender_id: 'FTSAPI',
        message: message,
        language: 'english',
        flash: 0,
        numbers: formattedPhone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.return === true) {
      console.log(`✅ SMS sent to ${formattedPhone}`)
      return {
        success: true,
        requestId: response.data.request_id,
        to: formattedPhone
      }
    } else {
      console.error(`❌ Fast2SMS error:`, response.data)
      return {
        success: false,
        error: response.data.message || 'SMS failed'
      }
    }

  } catch (error) {
    console.error(`❌ SMS failed to ${toPhone}:`, error.message)
    return { success: false, error: error.message }
  }
}

// Keep sendWhatsApp as alias
const sendWhatsApp = sendSMS

// ─── FORMAT phone number ──────────────────────────
function formatPhone(phone) {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
  // Remove country code if present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  }
  // Return 10 digit number for Fast2SMS
  return cleaned.slice(-10)
}

// ─── Alert NGO about new donation ─────────────────
async function alertNGO(ngo, donation) {
  const message =
    `AnnaSetu Alert! ` +
    `New food donation near you. ` +
    `Food: ${donation.foodName}, ` +
    `Qty: ${donation.quantity} ${donation.unit}, ` +
    `Diet: ${donation.dietType}, ` +
    `Safe for: ${donation.expiryHours} hrs. ` +
    `Login: localhost:3000/ngo`

  return sendSMS(ngo.phone, message)
}

// ─── Alert volunteer about pickup ─────────────────
async function alertVolunteer(volunteer, donation, ngo) {
  const message =
    `AnnaSetu Alert! ` +
    `New pickup assigned. ` +
    `Food: ${donation.foodName}, ` +
    `Qty: ${donation.quantity} ${donation.unit}. ` +
    `Pickup: ${donation.address}. ` +
    `Deliver to: ${ngo ? ngo.name : 'NGO'}. ` +
    `Login: localhost:3000/volunteer`

  return sendSMS(volunteer.phone, message)
}

// ─── Alert donor food was accepted ────────────────
async function alertDonorAccepted(donor, donation, ngo) {
  const message =
    `AnnaSetu: Your donation of ${donation.foodName} ` +
    `was accepted by ${ngo ? ngo.name : 'an NGO'}! ` +
    `A volunteer is on the way. ` +
    `View impact: localhost:3000/donor/impact`

  return sendSMS(donor.phone, message)
}

// ─── Alert donor delivery complete ────────────────
async function alertDonorDelivered(donor, donation, mealsCount, co2Saved) {
  const message =
    `AnnaSetu: Your ${donation.foodName} was delivered! ` +
    `Meals saved: ${mealsCount}. ` +
    `CO2 saved: ${co2Saved}kg. ` +
    `GreenCoins earned: ${mealsCount}. ` +
    `localhost:3000/donor/impact`

  return sendSMS(donor.phone, message)
}

// ─── Alert volunteer delivery confirmed ───────────
async function alertVolunteerDelivered(volunteer, donation, coinsEarned) {
  const message =
    `AnnaSetu: Great job! ` +
    `You delivered ${donation.quantity} ${donation.unit} of ${donation.foodName}. ` +
    `+${coinsEarned} GreenCoins earned! ` +
    `localhost:3000/volunteer`

  return sendSMS(volunteer.phone, message)
}

module.exports = {
  sendSMS,
  sendWhatsApp,
  alertNGO,
  alertVolunteer,
  alertDonorAccepted,
  alertDonorDelivered,
  alertVolunteerDelivered
}