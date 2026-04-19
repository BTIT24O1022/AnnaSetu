const axios = require('axios');
const APIUrl = 'https://annasetu-2.onrender.com/api';

async function checkAll() {
    try {
        const email = `testcheck3_${Date.now()}@test.com`;
        const regRes = await axios.post(`${APIUrl}/auth/register`, {
            name: "Test Checker",
            email: email,
            password: "Password123",
            phone: `999${Date.now().toString().slice(-7)}`,
            role: "DONOR"
        });
        const token = regRes.data.token;

        const res = await axios.get(`${APIUrl}/donations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("DONATIONS LAT LNG:");
        const active = res.data.donations.filter(d => ['LISTED', 'MATCHED'].includes(d.status));
        active.forEach(d => console.log(`- ${d.foodName}: Lat=${d.latitude}, Lng=${d.longitude}`));
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
checkAll();
