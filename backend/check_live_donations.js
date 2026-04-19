const axios = require('axios');
const APIUrl = 'https://annasetu-2.onrender.com/api';

async function checkLiveDonations() {
    try {
        const email = `testcheck_${Date.now()}@test.com`;
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
        
        console.log("ALL LISTED+MATCHED DONATIONS in Production DB:");
        const active = res.data.donations.filter(d => ['LISTED', 'MATCHED'].includes(d.status));
        console.log(`Found ${active.length} active donations.`);
        active.forEach(d => console.log(`- ${d.foodName} (Status: ${d.status}, ID: ${d.id})`));
        
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
checkLiveDonations();
