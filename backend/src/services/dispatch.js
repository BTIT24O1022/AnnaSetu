const prisma = require('../lib/prisma')
const whatsapp = require('./whatsapp')

// ─── CALCULATE DISTANCE between 2 coordinates ─────
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── FIND NEAREST NGO ─────────────────────────────
async function findNearestNGO(donation) {
  const allNGOs = await prisma.user.findMany({
    where: {
      role: 'NGO',
      isActive: true,
      latitude: { not: null },
      longitude: { not: null }
    }
  })

  return allNGOs
    .map(u => ({
      ...u,
      distance_meters: getDistanceMeters(
        donation.latitude, donation.longitude,
        u.latitude, u.longitude
      )
    }))
    .sort((a, b) => a.distance_meters - b.distance_meters)
    .slice(0, 5)
}

// ─── FIND NEAREST VOLUNTEER ───────────────────────
async function findNearestVolunteer(donation) {
  const allVolunteers = await prisma.user.findMany({
    where: {
      role: 'VOLUNTEER',
      isActive: true,
      latitude: { not: null },
      longitude: { not: null }
    }
  })

  return allVolunteers
    .map(u => ({
      ...u,
      distance_meters: getDistanceMeters(
        donation.latitude, donation.longitude,
        u.latitude, u.longitude
      )
    }))
    .sort((a, b) => a.distance_meters - b.distance_meters)
    .slice(0, 3)
}

// ─── RUN AUTO DISPATCH ────────────────────────────
async function runAutoDispatch(donationId, io) {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { donor: true }
    })

    if (!donation) {
      return { success: false, message: 'Donation not found' }
    }

    if (donation.status !== 'LISTED') {
      return { success: false, message: 'Donation already matched' }
    }
    await Dispatch.create({
  donation: donation._id,
  status: "PENDING"
});

    const nearbyNGOs = await findNearestNGO(donation)
    const nearbyVolunteers = await findNearestVolunteer(donation)

    const nearestNGO = nearbyNGOs[0] || null
    const nearestVolunteer = nearbyVolunteers[0] || null

    // Create dispatch record
    const dispatch = await prisma.dispatch.create({
      data: {
        donationId,
        ngoId: nearestNGO ? nearestNGO.id : null,
        volunteerId: nearestVolunteer ? nearestVolunteer.id : null,
        status: 'PENDING'
      }
    })

    // Update donation status
    await prisma.donation.update({
      where: { id: donationId },
      data: { status: 'MATCHED' }
    })

    // Socket.io real-time alerts
    if (io) {
      if (nearestNGO) {
        io.to(nearestNGO.id).emit('new-donation', {
          message: '🍱 New food donation available near you!',
          donation,
          dispatch
        })
      }
      if (nearestVolunteer) {
        io.to(nearestVolunteer.id).emit('new-assignment', {
          message: '🚴 New pickup assignment!',
          donation,
          dispatch
        })
      }
    }

    // WhatsApp alerts
    const whatsappResults = []

    if (nearestNGO) {
      console.log(`📱 Alerting NGO: ${nearestNGO.name}`)
      const result = await whatsapp.alertNGO(nearestNGO, donation)
      whatsappResults.push({ type: 'NGO', ...result })
    }

    if (nearestVolunteer) {
      console.log(`📱 Alerting Volunteer: ${nearestVolunteer.name}`)
      const result = await whatsapp.alertVolunteer(nearestVolunteer, donation, nearestNGO)
      whatsappResults.push({ type: 'Volunteer', ...result })
    }

    return {
      success: true,
      dispatch,
      whatsappResults,
      assignedNGO: nearestNGO ? {
        name: nearestNGO.name,
        distance: `${(nearestNGO.distance_meters / 1000).toFixed(2)} km`
      } : null,
      assignedVolunteer: nearestVolunteer ? {
        name: nearestVolunteer.name,
        distance: `${(nearestVolunteer.distance_meters / 1000).toFixed(2)} km`
      } : null
    }

  } catch (error) {
    console.error('Auto dispatch error:', error)
    return { success: false, message: error.message }
  }
}

module.exports = {
  runAutoDispatch,
  findNearestNGO,
  findNearestVolunteer,
  getDistanceMeters
}