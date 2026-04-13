const { GoogleGenerativeAI } = require('@google/generative-ai')
const fs = require('fs')
const path = require('path')

// ✅ FIXED: Uses GEMINI_API_KEY from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ─── ANALYSE FOOD PHOTO (from file path) ──────────
async function analyseFoodPhoto(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    const mimeType = getMimeType(imagePath)

    console.log('🤖 Sending food photo to Gemini Flash Vision...')

    const prompt = `You are a food safety expert. Analyse this food photo carefully.

Return ONLY a valid JSON object with these exact fields:
{
  "foodName": "name of the food you can see",
  "foodType": "VEG or NONVEG or JAIN or HALAL or UNKNOWN",
  "safetyScore": number between 0 and 100,
  "estimatedHoursSafe": number between 0 and 24,
  "condition": "FRESH or GOOD or FAIR or POOR or UNSAFE",
  "recommendation": "one sentence advice in simple English",
  "concerns": "any visible safety concerns, or NONE",
  "canDonate": true or false
}

Rules:
- safetyScore 90-100 = very fresh and safe
- safetyScore 70-89 = good, safe to donate
- safetyScore 50-69 = fair, donate immediately
- safetyScore below 50 = unsafe, do not donate
- Be conservative — food safety is critical
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ])

      const content = result.response.text()
      console.log('🤖 Gemini Response:', content)

      // Clean and parse JSON
      const cleaned = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      return {
        success: true,
        analysis: {
          foodName: parsed.foodName || 'Unknown Food',
          foodType: parsed.foodType || 'UNKNOWN',
          safetyScore: Math.min(100, Math.max(0, parsed.safetyScore || 0)),
          estimatedHoursSafe: Math.min(24, Math.max(0, parsed.estimatedHoursSafe || 0)),
          condition: parsed.condition || 'UNKNOWN',
          recommendation: parsed.recommendation || 'Please check food manually',
          concerns: parsed.concerns || 'NONE',
          canDonate: parsed.canDonate === true
        }
      }
    } catch (err) {
      if (err.status === 503 || String(err).includes('503')) {
        throw new Error('Google AI services are currently receiving heavy worldwide demand. The 2.5-flash model is temporarily too busy. Please try uploading your image again in roughly 60 seconds!');
      }
      throw err;
    }

  } catch (error) {
    console.error('FoodClock Gemini error:', error)

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'AI could not analyse this image. Please try a clearer photo.',
        analysis: null
      }
    }

    return {
      success: false,
      error: error.message,
      analysis: null
    }
  }
}

// ─── ANALYSE FROM URL ─────────────────────────────
async function analyseFoodFromURL(imageUrl) {
  try {
    console.log('🤖 Fetching image from URL for Gemini...')

    // Fetch image from URL and convert to base64
    const axios = require('axios')
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const base64Image = Buffer.from(response.data).toString('base64')
    const mimeType = response.headers['content-type'] || 'image/jpeg'

    const prompt = `You are a food safety expert. Analyse this food photo carefully.

Return ONLY a valid JSON object with these exact fields:
{
  "foodName": "name of the food you can see",
  "foodType": "VEG or NONVEG or JAIN or HALAL or UNKNOWN",
  "safetyScore": number between 0 and 100,
  "estimatedHoursSafe": number between 0 and 24,
  "condition": "FRESH or GOOD or FAIR or POOR or UNSAFE",
  "recommendation": "one sentence advice in simple English",
  "concerns": "any visible safety concerns, or NONE",
  "canDonate": true or false
}
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ])
      
      const content = result.response.text()
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)

      return {
        success: true,
        analysis: {
          foodName: parsed.foodName || 'Unknown Food',
          foodType: parsed.foodType || 'UNKNOWN',
          safetyScore: Math.min(100, Math.max(0, parsed.safetyScore || 0)),
          estimatedHoursSafe: Math.min(24, Math.max(0, parsed.estimatedHoursSafe || 0)),
          condition: parsed.condition || 'UNKNOWN',
          recommendation: parsed.recommendation || 'Please check food manually',
          concerns: parsed.concerns || 'NONE',
          canDonate: parsed.canDonate === true
        }
      }
    } catch (err) {
      if (err.status === 503 || String(err).includes('503')) {
        throw new Error('Google AI services are currently receiving heavy worldwide demand. The 2.5-flash model is temporarily too busy. Please try uploading your image again in roughly 60 seconds!');
      }
      throw err;
    }

  } catch (error) {
    console.error('FoodClock URL error:', error)
    return {
      success: false,
      error: error.message,
      analysis: null
    }
  }
}

// ─── HELPER ───────────────────────────────────────
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.jfif': 'D:\AnnaSetu\AnnaSetu\dal rice./jfif'
  }
  return types[ext] || 'image/jpeg'
}

module.exports = {
  analyseFoodPhoto,
  analyseFoodFromURL
}