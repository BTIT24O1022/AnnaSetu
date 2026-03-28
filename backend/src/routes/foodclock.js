const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { protect } = require('../middleware/auth')
const { analyseFoodPhoto, analyseFoodFromURL } = require('../services/foodclock')

const router = express.Router()

// ─── Setup upload folder ───────────────────────────
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// ─── Multer config ────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `food-${unique}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG and WebP images are allowed'))
    }
  }
})

// ─── ANALYSE FOOD PHOTO ───────────────────────────
router.post('/analyse', protect, upload.single('photo'), async (req, res) => {
  let processedPath = null

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a food photo'
      })
    }

    console.log(`📸 Photo received: ${req.file.filename}`)

    // Try to use sharp for processing, fallback if not available
    try {
      const sharp = require('sharp')
      processedPath = req.file.path.replace(
        path.extname(req.file.path),
        '-processed.jpg'
      )
      await sharp(req.file.path)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .withMetadata(false)
        .jpeg({ quality: 85 })
        .toFile(processedPath)
      console.log('✅ Image processed with Sharp')
    } catch (sharpError) {
      console.log('⚠️ Sharp not available, using original file')
      processedPath = req.file.path
    }

    // Send to AI
    const result = await analyseFoodPhoto(processedPath)

    // Clean up files
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    if (processedPath && processedPath !== req.file.path && fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath)
    }

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.error || 'AI analysis failed'
      })
    }

    const scoreMessage = getScoreMessage(result.analysis.safetyScore)

    res.status(200).json({
      success: true,
      message: '✅ Food analysed successfully!',
      analysis: result.analysis,
      scoreMessage,
      recommendation: {
        shouldDonate: result.analysis.canDonate,
        urgency: getUrgency(result.analysis.estimatedHoursSafe),
        action: result.analysis.canDonate
          ? `Safe to donate! List it now — safe for ${result.analysis.estimatedHoursSafe} hours.`
          : 'This food may not be safe to donate. Please check manually.'
      }
    })

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path) } catch {}
    }
    if (processedPath && fs.existsSync(processedPath)) {
      try { fs.unlinkSync(processedPath) } catch {}
    }
    console.error('FoodClock error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── ANALYSE FROM URL ─────────────────────────────
router.post('/analyse-url', protect, async (req, res) => {
  try {
    const { imageUrl } = req.body

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide imageUrl'
      })
    }

    const result = await analyseFoodFromURL(imageUrl)

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: result.error || 'AI analysis failed'
      })
    }

    const scoreMessage = getScoreMessage(result.analysis.safetyScore)

    res.status(200).json({
      success: true,
      message: '✅ Food analysed successfully!',
      analysis: result.analysis,
      scoreMessage,
      recommendation: {
        shouldDonate: result.analysis.canDonate,
        urgency: getUrgency(result.analysis.estimatedHoursSafe),
        action: result.analysis.canDonate
          ? `Safe to donate! List it now — safe for ${result.analysis.estimatedHoursSafe} hours.`
          : 'This food may not be safe to donate. Please check manually.'
      }
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── HELPERS ──────────────────────────────────────
function getScoreMessage(score) {
  if (score >= 90) return { emoji: '🟢', label: 'Excellent', message: 'Very fresh and safe!' }
  if (score >= 70) return { emoji: '🟢', label: 'Good', message: 'Good condition — safe to donate.' }
  if (score >= 50) return { emoji: '🟡', label: 'Fair', message: 'Acceptable — donate soon.' }
  if (score >= 30) return { emoji: '🟠', label: 'Poor', message: 'Not recommended.' }
  return { emoji: '🔴', label: 'Unsafe', message: 'Do not donate.' }
}

function getUrgency(hours) {
  if (hours >= 8) return 'LOW'
  if (hours >= 4) return 'MEDIUM'
  if (hours >= 2) return 'HIGH'
  return 'CRITICAL'
}

module.exports = router