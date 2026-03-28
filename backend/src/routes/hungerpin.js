const express = require('express');
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── ADD HUNGER PIN (anonymous) ───────────────────
router.post('/', async (req, res) => {
  try {
    const { latitude, longitude, address, description, peopleCount } = req.body;

    if (!latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude, longitude and address'
      });
    }

    const pin = await prisma.hungerPin.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        description: description || '',
        peopleCount: parseInt(peopleCount) || 0
      }
    });

    res.status(201).json({
      success: true,
      message: '📍 HungerPin added! Thank you for helping.',
      pin
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET ALL HUNGER PINS (for map) ────────────────
router.get('/', protect, async (req, res) => {
  try {
    const pins = await prisma.hungerPin.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: pins.length,
      pins
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;