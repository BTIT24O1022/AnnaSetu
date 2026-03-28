const express = require('express');
const prisma = require('../lib/prisma');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET MY IMPACT ────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const impact = await prisma.impact.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            greenCoins: true
          }
        }
      }
    });

    if (!impact) {
      return res.status(404).json({
        success: false,
        message: 'Impact record not found'
      });
    }

    res.status(200).json({
      success: true,
      impact: {
        totalMeals: impact.totalMeals,
        totalCo2: impact.totalCo2.toFixed(2),
        totalDonations: impact.totalDonations,
        greenCoins: impact.greenCoins,
        weeklyMeals: impact.weeklyMeals,
        monthlyMeals: impact.monthlyMeals,
        user: impact.user
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET LEADERBOARD ──────────────────────────────
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const leaderboard = await prisma.impact.findMany({
      where: {
        totalMeals: { gt: 0 }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            greenCoins: true
          }
        }
      },
      orderBy: { totalMeals: 'desc' },
      take: 10
    });

    res.status(200).json({
      success: true,
      leaderboard: leaderboard.map((item, index) => ({
        rank: index + 1,
        name: item.user.name,
        role: item.user.role,
        totalMeals: item.totalMeals,
        greenCoins: item.greenCoins,
        co2Saved: item.totalCo2.toFixed(2)
      }))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET OVERALL PLATFORM STATS ───────────────────
router.get('/stats', async (req, res) => {
  try {
    const totalDonations = await prisma.donation.count();
    const deliveredDonations = await prisma.donation.count({
      where: { status: 'DELIVERED' }
    });
    const totalUsers = await prisma.user.count();
    const totalMealsResult = await prisma.impact.aggregate({
      _sum: { totalMeals: true, totalCo2: true }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalDonations,
        deliveredDonations,
        totalUsers,
        totalMealsSaved: totalMealsResult._sum.totalMeals || 0,
        totalCo2Saved: (totalMealsResult._sum.totalCo2 || 0).toFixed(2)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;