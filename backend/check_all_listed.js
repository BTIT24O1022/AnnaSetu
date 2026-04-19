const axios = require('axios');
const APIUrl = 'https://annasetu-2.onrender.com/api';

async function checkAllListed() {
    try {
        const email = `testcheck4_${Date.now()}@test.com`;
        const regRes = await axios.post(`${APIUrl}/auth/register`, {
            name: "Test Checker",
            email: email,
            password: "Password123",
            phone: `999${Date.now().toString().slice(-7)}`,
            role: "DONOR"
        });
        const token = regRes.data.token;

        const res = await axios.get(`${APIUrl}/donations?status=LISTED`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("DONATIONS WITH STATUS LISTED:");
        console.log("Total:", res.data.total);
        console.log("Donations count:", res.data.donations.length);
        res.data.donations.forEach(d => console.log(`- ${d.foodName}: Status=${d.status}`));
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
checkAllListed();
