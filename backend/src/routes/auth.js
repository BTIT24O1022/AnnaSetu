const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── REGISTER ─────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, address, latitude, longitude } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, password and role'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role.toUpperCase(),
        address: address || '',
        latitude: latitude || null,
        longitude: longitude || null,
      }
    });

    // Create impact record for this user
    await prisma.impact.create({
      data: { userId: user.id }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to AnnaSetu.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        greenCoins: user.greenCoins
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
});

// ─── LOGIN ────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Wrong password. Please try again.'
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        greenCoins: user.greenCoins,
        foodSafeRating: user.foodSafeRating
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
});

// ─── GET MY PROFILE ───────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { impactRecord: true }
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        greenCoins: user.greenCoins,
        foodSafeRating: user.foodSafeRating,
        impact: user.impactRecord
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;