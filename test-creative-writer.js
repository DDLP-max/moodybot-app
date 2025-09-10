const testCreativeWriter = async () => {
  try {
    const response = await fetch('http://localhost:10000/api/creative-writer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'article',
        topic_or_premise: 'Test article about AI',
        audience: 'tech enthusiasts',
        word_count_target: 500,
        max_words: 600,
        userId: 1
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testCreativeWriter();
