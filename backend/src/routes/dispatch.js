const express = require('express')
const prisma = require('../lib/prisma')
const { protect, restrictTo } = require('../middleware/auth')
const whatsapp = require('../services/whatsapp')
const dispatchService = require('../services/dispatch')

const router = express.Router()

// ─── AUTO DISPATCH ────────────────────────────────
router.post('/auto/:donationId', protect, async (req, res) => {
  try {
    const { donationId } = req.params

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: true
      }
    })

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      })
    }

    if (donation.status !== 'LISTED') {
      return res.status(400).json({
        success: false,
        message: 'Donation already matched or dispatched'
      })
    }

    // Find nearest NGOs — pure Prisma
    const allNGOs = await prisma.user.findMany({
      where: {
        role: 'NGO',
        isActive: true,
        latitude: { not: null },
        longitude: { not: null }
      }
    })

    const nearbyNGOs = allNGOs
      .map(u => {
        const R = 6371000
        const dLat = (u.latitude - donation.latitude) * Math.PI / 180
        const dLng = (u.longitude - donation.longitude) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(donation.latitude * Math.PI / 180) *
          Math.cos(u.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return { ...u, distance_meters: distance }
      })
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 5)

    // Find nearest volunteers — pure Prisma
    const allVolunteers = await prisma.user.findMany({
      where: {
        role: 'VOLUNTEER',
        isActive: true,
        latitude: { not: null },
        longitude: { not: null }
      }
    })

    const nearbyVolunteers = allVolunteers
      .map(u => {
        const R = 6371000
        const dLat = (u.latitude - donation.latitude) * Math.PI / 180
        const dLng = (u.longitude - donation.longitude) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(donation.latitude * Math.PI / 180) *
          Math.cos(u.latitude * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return { ...u, distance_meters: distance }
      })
      .sort((a, b) => a.distance_meters - b.distance_meters)
      .slice(0, 3)

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

    // ─── Send Socket.io real-time alerts ──────────
    const io = req.app.get('io')
    if (nearestNGO && io) {
      io.to(nearestNGO.id).emit('new-donation', {
        message: '🍱 New food donation available near you!',
        donation,
        dispatch
      })
    }
    if (nearestVolunteer && io) {
      io.to(nearestVolunteer.id).emit('new-assignment', {
        message: '🚴 New pickup assignment!',
        donation,
        dispatch
      })
    }

    // ─── Send WhatsApp alerts ──────────────────────
    const whatsappResults = []

    // Alert NGO
    if (nearestNGO) {
      console.log(`📱 Sending WhatsApp to NGO: ${nearestNGO.name} (${nearestNGO.phone})`)
      const ngoResult = await whatsapp.alertNGO(nearestNGO, donation)
      whatsappResults.push({ type: 'NGO', ...ngoResult })
    }

    // Alert Volunteer
    if (nearestVolunteer) {
      console.log(`📱 Sending WhatsApp to Volunteer: ${nearestVolunteer.name} (${nearestVolunteer.phone})`)
      const volResult = await whatsapp.alertVolunteer(nearestVolunteer, donation, nearestNGO)
      whatsappResults.push({ type: 'Volunteer', ...volResult })
    }

    res.status(200).json({
      success: true,
      message: '✅ Dispatch created! NGO and volunteer have been notified via WhatsApp.',
      dispatch,
      whatsappAlerts: whatsappResults,
      assignedNGO: nearestNGO ? {
        name: nearestNGO.name,
        distance: `${(nearbyNGOs[0].distance_meters / 1000).toFixed(2)} km`
      } : null,
      assignedVolunteer: nearestVolunteer ? {
        name: nearestVolunteer.name,
        distance: `${(nearbyVolunteers[0].distance_meters / 1000).toFixed(2)} km`
      } : null
    })

  } catch (error) {
    console.error('Auto dispatch error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── NGO ACCEPTS DISPATCH ─────────────────────────
router.patch('/:id/accept', protect, restrictTo('NGO'), async (req, res) => {
  try {
    const dispatch = await prisma.dispatch.update({
      where: { id: req.params.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        ngoId: req.user.id
      },
      include: {
        donation: {
          include: { donor: true }
        },
        ngo: true,
        volunteer: true
      }
    })

    // Update donation status
    await prisma.donation.update({
      where: { id: dispatch.donationId },
      data: { status: 'DISPATCHED' }
    })

    // ─── WhatsApp: Alert donor their food was accepted
    if (dispatch.donation?.donor) {
      console.log(`📱 Alerting donor about acceptance`)
      await whatsapp.alertDonorAccepted(
        dispatch.donation.donor,
        dispatch.donation,
        dispatch.ngo
      )
    }

    res.status(200).json({
      success: true,
      message: '✅ Dispatch accepted! Donor has been notified via WhatsApp.',
      dispatch
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── VOLUNTEER PICKS UP ───────────────────────────
router.patch('/:id/pickup', protect, restrictTo('VOLUNTEER'), async (req, res) => {
  try {
    const dispatch = await prisma.dispatch.update({
      where: { id: req.params.id },
      data: {
        status: 'PICKED',
        pickedAt: new Date(),
        volunteerId: req.user.id
      },
      include: {
        donation: true,
        volunteer: true,
        ngo: true
      }
    })

    res.status(200).json({
      success: true,
      message: '🚴 Food picked up! Heading to delivery location.',
      dispatch
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── MARK DELIVERED ───────────────────────────────
router.patch('/:id/deliver', protect, async (req, res) => {
  try {
    const dispatch = await prisma.dispatch.update({
      where: { id: req.params.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      },
      include: {
        donation: {
          include: { donor: true }
        },
        volunteer: true,
        ngo: true
      }
    })

    const donation = dispatch.donation

    // Update donation status
    await prisma.donation.update({
      where: { id: dispatch.donationId },
      data: { status: 'DELIVERED' }
    })

    // Impact and GreenCoins are now awarded immediately during donation listing
    // to the DONOR, so we don't update donor impact again here.
    // However, we MUST update the Volunteer and NGO impact!
    const co2SavedFloat = parseFloat(donation.co2Saved || 0);
    const quantityInt = parseInt(donation.quantity || 0);

    if (dispatch.ngoId) {
      await prisma.impact.upsert({
        where: { userId: dispatch.ngoId },
        update: {
          totalMeals: { increment: quantityInt },
          totalCo2: { increment: co2SavedFloat },
          totalDonations: { increment: 1 },
          greenCoins: { increment: quantityInt },
          weeklyMeals: { increment: quantityInt },
          monthlyMeals: { increment: quantityInt }
        },
        create: {
          userId: dispatch.ngoId,
          totalMeals: quantityInt,
          totalCo2: co2SavedFloat,
          totalDonations: 1,
          greenCoins: quantityInt,
          weeklyMeals: quantityInt,
          monthlyMeals: quantityInt
        }
      });
      await prisma.user.update({
        where: { id: dispatch.ngoId },
        data: { greenCoins: { increment: quantityInt } }
      });
    }

    if (dispatch.volunteerId) {
      await prisma.impact.upsert({
        where: { userId: dispatch.volunteerId },
        update: {
          totalMeals: { increment: quantityInt },
          totalCo2: { increment: co2SavedFloat },
          totalDonations: { increment: 1 },
          greenCoins: { increment: quantityInt },
          weeklyMeals: { increment: quantityInt },
          monthlyMeals: { increment: quantityInt }
        },
        create: {
          userId: dispatch.volunteerId,
          totalMeals: quantityInt,
          totalCo2: co2SavedFloat,
          totalDonations: 1,
          greenCoins: quantityInt,
          weeklyMeals: quantityInt,
          monthlyMeals: quantityInt
        }
      });
      await prisma.user.update({
        where: { id: dispatch.volunteerId },
        data: { greenCoins: { increment: quantityInt } }
      });
    }

    // ─── WhatsApp: Alert donor delivery complete ───
    if (donation.donor) {
      console.log(`📱 Alerting donor about delivery`)
      await whatsapp.alertDonorDelivered(
        donation.donor,
        donation,
        donation.quantity,
        donation.co2Saved
      )
    }

    // ─── WhatsApp: Alert volunteer delivery confirmed
    if (dispatch.volunteer) {
      console.log(`📱 Alerting volunteer about delivery`)
      await whatsapp.alertVolunteerDelivered(
        dispatch.volunteer,
        donation,
        donation.quantity
      )
    }

    res.status(200).json({
      success: true,
      message: `🎉 Delivered! ${donation.quantity} meals saved. WhatsApp alerts sent!`,
      dispatch,
      mealsDelivered: donation.quantity,
      co2Saved: donation.co2Saved,
      greenCoinsEarned: donation.quantity
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── GET ALL DISPATCHES ───────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const where = {}
    if (req.user.role === 'NGO') {
      where.OR = [
        { ngoId: req.user.id },
        { ngoId: null },
        { status: 'PENDING' }
      ];
    }
    if (req.user.role === 'VOLUNTEER') {
      where.OR = [
        { volunteerId: req.user.id },
        { volunteerId: null },
        { status: 'PENDING' },
        { status: 'ACCEPTED' } // Because if an NGO accepts, ANY volunteer should be able to pick it up!
      ];
    }

    const dispatches = await prisma.dispatch.findMany({
      where,
      include: {
        donation: {
          include: {
            donor: {
              select: { id: true, name: true, phone: true, address: true }
            }
          }
        },
        volunteer: {
          select: { id: true, name: true, phone: true }
        },
        ngo: {
          select: { id: true, name: true, phone: true, address: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.status(200).json({
      success: true,
      count: dispatches.length,
      dispatches
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router