const axios = require('axios');
const APIUrl = 'https://annasetu-2.onrender.com/api';

async function checkNearby() {
    try {
        const email = `testcheck2_${Date.now()}@test.com`;
        const regRes = await axios.post(`${APIUrl}/auth/register`, {
            name: "Test Checker",
            email: email,
            password: "Password123",
            phone: `999${Date.now().toString().slice(-7)}`,
            role: "DONOR"
        });
        const token = regRes.data.token;

        const res = await axios.get(`${APIUrl}/donations/nearby?latitude=20.5937&longitude=78.9629&radius=50000000`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("NEARBY DONATIONS:");
        console.log(res.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
checkNearby();
