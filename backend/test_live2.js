const axios = require('axios');
const APIUrl = 'https://annasetu-2.onrender.com/api';

async function testDispatch() {
    try {
        const ngoEmail = `testngo_${Date.now()}@test.com`;
        const ngoRegRes = await axios.post(`${APIUrl}/auth/register`, {
            name: "Test NGO",
            email: ngoEmail,
            password: "Password123",
            phone: `888${Date.now().toString().slice(-7)}`,
            role: "NGO"
        });
        const ngoToken = ngoRegRes.data.token;

        const dispRes = await axios.get(`${APIUrl}/dispatch`, {
            headers: { Authorization: `Bearer ${ngoToken}` }
        });
        console.log(`Found ${dispRes.data.count} dispatches!`);
        console.log("Are any PENDING?", dispRes.data.dispatches.filter(d => d.status === 'PENDING').length);

    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testDispatch();
