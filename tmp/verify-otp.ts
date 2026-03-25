import axios from 'axios';

const BASE_URL = 'http://localhost:5000'; // Assuming default port

async function testOTPFlow() {
  const testUser = {
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    name: 'Test User'
  };

  console.log('1. Requesting OTP...');
  try {
    const res1 = await axios.post(`${BASE_URL}/api/auth/request-otp`, testUser);
    console.log('Request OTP Response:', res1.data);
  } catch (err: any) {
    console.error('Request OTP Failed:', err.response?.data || err.message);
    return;
  }

  // In a real scenario, we'd check the mailbox.
  // In dev mode, we check the console logs of the server.
  // Since I don't have the OTP yet, I'll stop here or try to guess/retrieve it if I could.
  // But wait, I can check the database!
  
  console.log('Verification script needs access to the DB or server logs to retrieve the OTP.');
}

// testOTPFlow();
console.log("Verification script prepared. Please run the server and then this script.");
