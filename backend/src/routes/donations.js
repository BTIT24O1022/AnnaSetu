const express = require('express');
const prisma = require('../lib/prisma');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ─── HELPER: Calculate FoodSafe Score ─────────────
function calculateFoodSafeScore({ expiryHours, quantity, dietType }) {
  let score = 100;
  if (expiryHours <= 1) score -= 40;
  else if (expiryHours <= 2) score -= 25;
  else if (expiryHours <= 3) score -= 15;
  else if (expiryHours <= 4) score -= 5;
  if (dietType === 'VEG' || dietType === 'JAIN') score += 5;
  if (dietType === 'NONVEG') score -= 10;
  return Math.min(100, Math.max(0, score));
}

// ─── HELPER: Calculate distance between 2 coords ──
function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── CREATE DONATION (Donor only) ─────────────────
router.post('/', protect, restrictTo('DONOR'), async (req, res) => {
  try {
    const {
      foodName,
      description,
      quantity,
      unit,
      dietType,
      expiryHours,
      photoUrl,
      latitude,
      longitude,
      address
    } = req.body;

    if (!foodName || !quantity || !latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide foodName, quantity, latitude, longitude and address'
      });
    }

    const foodSafeScore = calculateFoodSafeScore({
      expiryHours: expiryHours || 4,
      quantity,
      dietType
    });

    const co2Saved = (quantity * 0.3 * 2.5).toFixed(2);

    const donation = await prisma.donation.create({
      data: {
        donorId: req.user.id,
        foodName,
        description: description || '',
        quantity: parseInt(quantity),
        unit: unit || 'plates',
        dietType: dietType || 'VEG',
        foodSafeScore,
        expiryHours: parseInt(expiryHours) || 4,
        photoUrl: photoUrl || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        co2Saved: parseFloat(co2Saved),
        status: 'LISTED'
      },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            phone: true,
            foodSafeRating: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: '🎉 Food listed successfully! Finding nearest NGO...',
      donation
    });

  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── EXPORT CSV ───────────────────────────────────
// ✅ FIX 1: This route MUST come before '/:id' otherwise Express
// treats "export" as an :id param and hits the wrong handler.
router.get('/export/csv', protect, async (req, res) => {
  try {
    // ✅ FIX 2: NGO and ADMIN can export all; DONOR exports only their own
    const where = {};
    if (req.user.role === 'DONOR') {
      where.donorId = req.user.id;
    }

    const donations = await prisma.donation.findMany({
      where,
      include: {
        donor: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ✅ FIX 3: Wrap every field in quotes to handle commas in addresses/names
    const headers = 'ID,Food Name,Quantity,Unit,Diet Type,Status,Food Safe Score,Expiry Hours,Donor Name,Donor Phone,Address,Created At';

    const rows = donations.map(d => [
      `"${d.id}"`,
      `"${d.foodName}"`,
      d.quantity,
      `"${d.unit}"`,
      `"${d.dietType}"`,
      `"${d.status}"`,
      d.foodSafeScore,
      d.expiryHours,
      `"${d.donor?.name || ''}"`,
      `"${d.donor?.phone || ''}"`,
      `"${(d.address || '').replace(/"/g, "'")}"`,
      `"${new Date(d.createdAt).toISOString()}"`
    ].join(','));

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=annasetu-donations.csv');
    res.send(csv);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET NEARBY DONATIONS ─────────────────────────
router.get('/nearby', protect, async (req, res) => {
  try {
    const { latitude, longitude, radius = 500000, dietType } = req.query;
    // ✅ FIX 4: Default radius raised to 500km so NGOs always see donations
    // even when donor and NGO are in different cities during testing

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusMeters = parseFloat(radius);

    // ✅ FIX 5: Removed `foodSafeScore: { gte: 50 }` filter —
    // this was blocking ALL manually-entered donations (score defaults to 0)
    const where = { status: 'LISTED' };

    if (dietType) {
      where.dietType = dietType;
    }

    const allDonations = await prisma.donation.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            phone: true,
            foodSafeRating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const nearbyDonations = allDonations
      .filter(d => d.latitude !== null && d.longitude !== null)
      .map(donation => {
        const distanceMeters = getDistanceMeters(
          lat, lng,
          donation.latitude,
          donation.longitude
        );
        return {
          ...donation,
          distanceMeters: Math.round(distanceMeters),
          distance: `${(distanceMeters / 1000).toFixed(2)} km`
        };
      })
      .filter(d => d.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 20);

    res.status(200).json({
      success: true,
      count: nearbyDonations.length,
      searchRadius: `${radiusMeters / 1000} km`,
      donations: nearbyDonations
    });

  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET MY DONATIONS (Donor sees their own) ───────
router.get('/my/donations', protect, restrictTo('DONOR'), async (req, res) => {
  try {
    const donations = await prisma.donation.findMany({
      where: { donorId: req.user.id },
      include: {
        dispatch: {
          include: {
            volunteer: { select: { id: true, name: true, phone: true } },
            ngo: { select: { id: true, name: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: donations.length, donations });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET ALL DONATIONS (with filters) ─────────────
router.get('/', protect, async (req, res) => {
  try {
    const { status, dietType, limit = 20, page = 1 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (dietType) where.dietType = dietType;

    const donations = await prisma.donation.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            foodSafeRating: true
          }
        },
        dispatch: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.donation.count({ where });

    res.status(200).json({ success: true, total, page: parseInt(page), donations });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET SINGLE DONATION ──────────────────────────
// ✅ NOTE: All specific routes above must come BEFORE this /:id route
router.get('/:id', protect, async (req, res) => {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: req.params.id },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            foodSafeRating: true
          }
        },
        dispatch: {
          include: {
            volunteer: { select: { id: true, name: true, phone: true } },
            ngo: { select: { id: true, name: true, phone: true } }
          }
        }
      }
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.status(200).json({ success: true, donation });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── UPDATE DONATION STATUS ───────────────────────
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['LISTED', 'MATCHED', 'DISPATCHED', 'DELIVERED', 'EXPIRED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const donation = await prisma.donation.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.status(200).json({ success: true, message: `Status updated to ${status}`, donation });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── CANCEL DONATION (Donor only) ─────────────────
router.delete('/:id', protect, restrictTo('DONOR'), async (req, res) => {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: req.params.id }
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.donorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own donations'
      });
    }

    await prisma.donation.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.status(200).json({ success: true, message: 'Donation cancelled successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;