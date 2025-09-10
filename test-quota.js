const testQuota = async () => {
  try {
    const response = await fetch('http://localhost:10000/api/users/1/limit');
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
};

testQuota();
