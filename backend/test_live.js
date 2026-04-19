const axios = require('axios');
const APIUrl = 'https://annasetu-2.onrender.com/api';

async function testLiveAPI() {
    try {
        console.log("Registering temp donor...");
        const email = `testdonor_${Date.now()}@test.com`;
        const regRes = await axios.post(`${APIUrl}/auth/register`, {
            name: "Test Donor",
            email: email,
            password: "Password123",
            phone: `999${Date.now().toString().slice(-7)}`,
            role: "DONOR"
        });
        const token = regRes.data.token;
        console.log("Registered successfully. Creating donation...");

        const donRes = await axios.post(`${APIUrl}/donations`, {
            foodName: "Test Live Pizza",
            description: "Fresh pizza",
            quantity: 5,
            unit: "boxes",
            dietType: "NONVEG",
            expiryHours: "4",
            address: "123 Test Street",
            latitude: "20.5937",
            longitude: "78.9629"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Donation created successfully:", donRes.data);

        // Wait to allow auto-dispatch to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Now test getting nearby donations from an NGO perspective
        console.log("Registering temp NGO...");
        const ngoEmail = `testngo_${Date.now()}@test.com`;
        const ngoRegRes = await axios.post(`${APIUrl}/auth/register`, {
            name: "Test NGO",
            email: ngoEmail,
            password: "Password123",
            phone: `888${Date.now().toString().slice(-7)}`,
            role: "NGO"
        });
        const ngoToken = ngoRegRes.data.token;

        console.log("Fetching nearby donations for NGO...");
        const nearbyRes = await axios.get(`${APIUrl}/donations/nearby?latitude=20.5937&longitude=78.9629&radius=50000000`, {
            headers: { Authorization: `Bearer ${ngoToken}` }
        });

        console.log(`Found ${nearbyRes.data.count} nearby donations!`);
        console.log(nearbyRes.data.donations.map(d => `${d.foodName} (Status: ${d.status})`));

        // Let's also test dispatch getAll to see if the PENDING dispatch appears
        console.log("Fetching dispatches for NGO...");
        const dispRes = await axios.get(`${APIUrl}/dispatch`, {
            headers: { Authorization: `Bearer ${ngoToken}` }
        });
        console.log(`Found ${dispRes.data.count} dispatches!`);
        console.log(dispRes.data.dispatches.map(d => `Dispatch for: ${d.donation?.foodName} (Status: ${d.status})`));

    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}

testLiveAPI();
