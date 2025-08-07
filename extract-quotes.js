import fs from 'fs';
import path from 'path';

function extractQuotes() {
  const logPath = path.join('server', 'logs', 'moodybot_log.txt');
  
  if (!fs.existsSync(logPath)) {
    console.log('Log file not found:', logPath);
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const entries = content.split('\n\n').filter(entry => entry.trim());
  
  const quotes = [];
  
  entries.forEach(entry => {
    const lines = entry.split('\n');
    const replyIndex = lines.findIndex(line => line.startsWith('Reply:'));
    
    if (replyIndex !== -1) {
      const timestamp = lines[0].match(/\[(.*?)\]/)?.[1] || 'Unknown';
      const mode = lines[1]?.replace('Mode: ', '') || 'Unknown';
      const user = lines[2]?.replace('User: ', '') || 'Unknown';
      const message = lines[3]?.replace('Message: ', '') || '';
      
      // Extract the full reply (from Reply: to the end, but stop at the next timestamp if it exists)
      let replyLines = [];
      for (let i = replyIndex; i < lines.length; i++) {
        const line = lines[i];
        // Stop if we hit another timestamp (next entry)
        if (line.match(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)) {
          break;
        }
        replyLines.push(line);
      }
      const reply = replyLines.join('\n').replace('Reply: ', '');
      
      if (reply && !reply.includes('MoodyBot has gone quiet')) {
        quotes.push({
          timestamp,
          mode,
          user,
          message,
          reply: reply.trim()
        });
      }
    }
  });
  
  console.log(`Found ${quotes.length} quotes:\n`);
  
  quotes.forEach((quote, index) => {
    console.log(`--- Quote ${index + 1} ---`);
    console.log(`Time: ${quote.timestamp}`);
    console.log(`Mode: ${quote.mode}`);
    console.log(`User: ${quote.user}`);
    console.log(`Message: ${quote.message}`);
    console.log(`Reply: ${quote.reply}`);
    console.log('');
  });
  
  // Save to a text file
  const outputPath = path.join('server', 'logs', 'extracted_quotes.txt');
  let textOutput = `MoodyBot Quotes - Extracted on ${new Date().toISOString()}\n`;
  textOutput += `Total Quotes: ${quotes.length}\n\n`;
  
  quotes.forEach((quote, index) => {
    textOutput += `=== QUOTE ${index + 1} ===\n`;
    textOutput += `Time: ${quote.timestamp}\n`;
    textOutput += `Mode: ${quote.mode}\n`;
    textOutput += `User: ${quote.user}\n`;
    textOutput += `Message: ${quote.message}\n`;
    textOutput += `Reply: ${quote.reply}\n\n`;
  });
  
  fs.writeFileSync(outputPath, textOutput);
  console.log(`Quotes saved to: ${outputPath}`);
}

extractQuotes(); 