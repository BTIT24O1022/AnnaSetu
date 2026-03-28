# 🌱 AnnaSetu — अन्न सेतु
### Bridging Food. Reducing Waste. Feeding Lives.

AnnaSetu is a full-stack food waste management platform that connects surplus food donors (restaurants, households, events) with NGOs and volunteers to rescue food before it goes to waste.

---

## 🚀 Live Features

| Feature | Description |
|---|---|
| 🍱 Food Donation | Donors list surplus food in under 60 seconds |
| 🤖 FoodClock AI | Photo scan estimates food safety score using Gemini Vision |
| 🚴 Auto-Dispatch | System auto-matches nearest NGO and volunteer instantly |
| 📱 SMS Alerts | NGO and volunteer get SMS when food is listed |
| 📊 Impact Wallet | Tracks meals saved, CO₂ saved, GreenCoins earned |
| 🏆 Leaderboard | Weekly donor ranking by meals rescued |
| 📍 HungerPin Map | Anyone can anonymously mark where hungry people gather |
| 📥 CSV Export | Download donations and impact reports as CSV |
| 🔐 Role-based Auth | Separate dashboards for Donor, NGO, Volunteer |

---

## 🏗️ Project Structure

```
annasetu/
├── backend/          ← Node.js + Express + PostgreSQL API
├── web/              ← Next.js web app (3 role dashboards)
└── mobile/           ← React Native + Expo mobile app
```

---

## ⚙️ Tech Stack

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT + bcryptjs
- **Real-time:** Socket.io
- **AI:** Google Gemini Vision (FoodClock)
- **SMS:** Fast2SMS (free tier)
- **File Upload:** Multer + Sharp

### Web Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v3
- **State:** React Context API
- **HTTP:** Axios
- **Charts:** Recharts
- **Icons:** Lucide React

### Mobile App
- **Framework:** React Native + Expo
- **Navigation:** React Navigation v6
- **Storage:** AsyncStorage
- **Icons:** @expo/vector-icons

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/annasetu.git
cd annasetu
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your credentials (see Environment Variables section)

# Setup database
npx prisma migrate dev --name init

# Seed test data
npm run seed

# Start development server
npm run dev
```

Server starts at `http://localhost:5000`

### 3. Web Frontend Setup
```bash
cd web

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start development server
npm run dev
```

Web app opens at `http://localhost:3000`

### 4. Mobile App Setup
```bash
cd mobile

# Install dependencies
npm install

# Update API URL in src/lib/api.js
# Change BASE_URL to your PC's IP address
# Example: http://192.168.1.5:5000/api

# Start Expo
npx expo start
```

Scan QR code with Expo Go app on your phone.

---

## 🔑 Environment Variables

Create `backend/.env` with these variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/annasetu"

# JWT
JWT_SECRET=your-super-secret-jwt-key

# AI — FoodClock (Free from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXX

# SMS Alerts (Free from https://www.fast2sms.com)
FAST2SMS_API_KEY=your_fast2sms_api_key

# Optional: Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Redis (for job queues)
REDIS_URL=redis://localhost:6379
```

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `User` | Donors, NGOs, Volunteers with role-based access |
| `Donation` | Food listings with safety score, diet type, location |
| `Dispatch` | Links donation → NGO → volunteer with status tracking |
| `HungerPin` | Anonymous map pins marking where hungry people gather |
| `Impact` | Per-user impact tracking — meals, CO₂, GreenCoins |

---

## 🌐 API Endpoints

### Auth
```
POST   /api/auth/register     Register new user
POST   /api/auth/login        Login and get JWT token
GET    /api/auth/me           Get current user profile
```

### Donations
```
POST   /api/donations                Create new donation
GET    /api/donations                List all donations
GET    /api/donations/nearby         Find nearby donations (geo-search)
GET    /api/donations/my/donations   Get my donations
GET    /api/donations/:id            Get single donation
PATCH  /api/donations/:id/status     Update donation status
DELETE /api/donations/:id            Cancel donation
```

### Dispatch
```
POST   /api/dispatch/auto/:donationId   Auto-dispatch to nearest NGO + volunteer
PATCH  /api/dispatch/:id/accept         NGO accepts dispatch
PATCH  /api/dispatch/:id/pickup         Volunteer confirms pickup
PATCH  /api/dispatch/:id/deliver        Mark as delivered
GET    /api/dispatch                    Get all dispatches
```

### FoodClock AI
```
POST   /api/foodclock/analyse           Analyse food photo → safety score
POST   /api/foodclock/analyse-url       Analyse food from URL
```

### Impact
```
GET    /api/impact/me           Get my impact stats
GET    /api/impact/leaderboard  Get top donors leaderboard
GET    /api/impact/stats        Get platform-wide stats
```

### HungerPins
```
POST   /api/hungerpins          Add anonymous hunger pin
GET    /api/hungerpins          Get all hunger pins for map
```

### SMS / WhatsApp
```
POST   /api/whatsapp/webhook    Receive incoming messages
POST   /api/whatsapp/test       Send test SMS
```

---

## 👥 User Roles

### 🍽️ Donor (Restaurants, Households, Events)
- List surplus food with photo, diet type, expiry
- Use FoodClock AI to scan food safety before listing
- View auto-dispatch status
- Track personal impact wallet and GreenCoins
- Export donation history as CSV

### 🏢 NGO (Organizations, Shelters)
- Receive real-time SMS alerts for nearby donations
- Accept donations with one click
- View incoming and completed donations
- Access impact reports

### ❤️ Volunteer (Individual Helpers)
- Receive SMS alerts for pickup assignments
- Confirm pickup and delivery with one tap
- Track completed deliveries
- Earn GreenCoins for every delivery

---

## 🤖 FoodClock AI

FoodClock uses **Google Gemini Vision** to analyse food photos and return:

```json
{
  "foodName": "Biryani",
  "foodType": "NONVEG",
  "safetyScore": 85,
  "estimatedHoursSafe": 6,
  "condition": "GOOD",
  "recommendation": "Fresh and safe to donate immediately.",
  "concerns": "NONE",
  "canDonate": true
}
```

| Score Range | Condition | Action |
|---|---|---|
| 90–100 | 🟢 Excellent | Very fresh — donate now |
| 70–89 | 🟢 Good | Safe to donate |
| 50–69 | 🟡 Fair | Donate immediately |
| 30–49 | 🟠 Poor | Not recommended |
| 0–29 | 🔴 Unsafe | Do not donate |

---

## 🏆 GreenCoin System

| Action | GreenCoins |
|---|---|
| 1 meal donated and delivered | +1 GreenCoin |
| 10 donations completed | Bonus 50 coins |
| Weekly top donor | Featured on leaderboard |

GreenCoins track your environmental impact and rank you on the weekly leaderboard. Future versions will allow redeeming coins for rewards.

---

## 🌿 Environmental Impact

Every donation automatically calculates:

- **CO₂ saved** = quantity × 0.3 kg × 2.5 (vs landfill decomposition)
- **Meals saved** = quantity of servings rescued
- These feed into the platform-wide impact counter

---

## 🧪 Test Accounts

After running `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Donor | donor@test.com | password123 |
| NGO | ngo@test.com | password123 |
| Volunteer | volunteer@test.com | password123 |

---

## 📱 Mobile App Screens

| Screen | Description |
|---|---|
| Splash | Green AnnaSetu logo screen |
| Login | Role selection + credentials |
| Register | Create account for any role |
| Donor Home | Stats, quick donate, my donations |
| Add Food | FoodClock scan + donation form |
| NGO Home | Incoming donations with accept button |
| NGO Requests | Tabs: Available, Accepted, Delivered |
| Volunteer Home | Assigned pickups with action buttons |
| Deliveries | Active and completed delivery history |
| Impact | Meals, CO₂, GreenCoins, leaderboard |

---

## 📂 Web App Pages

```
/                     → Splash (auto-redirect based on auth)
/login                → Login with role selection
/register             → Create new account
/donor                → Donor dashboard
/donor/add-food       → Food listing form + FoodClock AI
/donor/impact         → Impact wallet + leaderboard
/donor/map            → Live map with donations + HungerPins
/donor/export         → CSV export (donations + impact)
/ngo                  → NGO dashboard
/ngo/requests         → Incoming donations management
/volunteer            → Volunteer dashboard
/volunteer/deliveries → Delivery management
```

---

## 🚀 Deployment

### Backend (Railway)
1. Push code to GitHub
2. Create account at `railway.app`
3. New project → Deploy from GitHub
4. Add environment variables
5. Done — Railway auto-deploys

### Web Frontend (Vercel)
1. Push `web/` folder to GitHub
2. Create account at `vercel.com`
3. Import repository
4. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
5. Deploy

### Database (Supabase)
1. Create account at `supabase.com`
2. New project → copy connection string
3. Update `DATABASE_URL` in environment variables
4. Run `npx prisma migrate deploy`

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open Pull Request

---

## 📄 License

MIT License — free to use, modify and distribute.

---

## 👩‍💻 Built With ❤️ by

AnnaSetu was built as a social impact hackathon project to solve the real problem of food waste in India — where 40% of food is wasted while 200 million people go to sleep hungry every night.

> *"Every meal rescued is a life touched."*

---

## 📞 Support

If you face any issues:
1. Check the error in browser console (F12)
2. Check backend terminal for error logs
3. Make sure `.env` has all required variables
4. Make sure PostgreSQL is running

---

*AnnaSetu — अन्न सेतु — Bridging Food, Reducing Waste, Feeding Lives* 🌱