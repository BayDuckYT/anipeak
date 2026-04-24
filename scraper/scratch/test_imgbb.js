import axios from 'axios';

async function test() {
    try {
        const res = await axios.head('https://i.ibb.co/9mNbhky5/ad62e46c654a.png');
        console.log("Status:", res.status);
    } catch (err) {
        console.log("Error:", err.response ? err.response.status : err.message);
    }
}
test();
