const axios = require('axios');
const APIUrl = 'https://annasetu-2.onrender.com/api';

async function checkAllMatched() {
    try {
        const email = `testcheck5_${Date.now()}@test.com`;
        const regRes = await axios.post(`${APIUrl}/auth/register`, {
            name: "Test Checker",
            email: email,
            password: "Password123",
            phone: `999${Date.now().toString().slice(-7)}`,
            role: "DONOR"
        });
        const token = regRes.data.token;

        const res = await axios.get(`${APIUrl}/donations?status=MATCHED`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("DONATIONS WITH STATUS MATCHED:");
        console.log("Total:", res.data.total);
        console.log("Donations count:", res.data.donations.length);
        if (res.data.count > 0 || res.data.donations.length > 0) {
           console.log("It works! We can bypass the broken backend by fetching MATCHED from the frontend!");
        }
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
checkAllMatched();
