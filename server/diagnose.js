import dotenv from 'dotenv';
dotenv.config();

console.log('\n========================================');
console.log('🔍 WanderAI API Diagnostic Tool');
console.log('========================================\n');

async function testAll() {
  // 1. Test Groq
  console.log('1️⃣ Testing Groq...');
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) {
    console.log('   ❌ No GROQ_API_KEY found in .env\n');
  } else {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'respond with the word hello' }],
          max_tokens: 10
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('   ✅ Groq is WORKING! Response:', data.choices?.[0]?.message?.content);
      } else {
        console.log('   ❌ Groq Error (' + res.status + '):', data.error?.message || JSON.stringify(data));
      }
    } catch (e) {
      console.log('   ❌ Groq Network Failed:', e.message);
    }
    console.log('');
  }

  // 2. Test DeepSeek
  console.log('2️⃣ Testing DeepSeek...');
  const dsKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!dsKey) {
    console.log('   ❌ No DEEPSEEK_API_KEY found in .env\n');
  } else {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${dsKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hello' }],
          max_tokens: 10
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('   ✅ DeepSeek is WORKING! Response:', data.choices?.[0]?.message?.content);
      } else {
        console.log('   ❌ DeepSeek Error (' + res.status + '):', data.error?.message || JSON.stringify(data));
      }
    } catch (e) {
      console.log('   ❌ DeepSeek Network Failed:', e.message);
    }
    console.log('');
  }

  // 3. Test xKiro
  console.log('3️⃣ Testing xKiro...');
  const xKey = process.env.XKIRO_API_KEY?.trim();
  if (!xKey) {
    console.log('   ❌ No XKIRO_API_KEY found in .env\n');
  } else {
    try {
      const res = await fetch('https://api.xkiro.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${xKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hello' }],
          max_tokens: 10
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('   ✅ xKiro is WORKING! Response:', data.choices?.[0]?.message?.content);
      } else {
        console.log('   ❌ xKiro Error (' + res.status + '):', data.error?.message || data.message || JSON.stringify(data));
      }
    } catch (e) {
      console.log('   ❌ xKiro Network Failed:', e.message);
    }
    console.log('');
  }

  // 4. Test Gemini
  console.log('4️⃣ Testing Gemini...');
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiKey || geminiKey.includes('your_actual_key')) {
    console.log('   ❌ No valid GEMINI_API_KEY found in .env\n');
  } else {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
      });
      const data = await res.json();
      if (res.ok) {
        console.log('   ✅ Gemini is WORKING!');
      } else {
        console.log('   ❌ Gemini Error (' + res.status + '):', data.error?.message || JSON.stringify(data));
      }
    } catch (e) {
      console.log('   ❌ Gemini Network Failed:', e.message);
    }
    console.log('');
  }
}

testAll();
