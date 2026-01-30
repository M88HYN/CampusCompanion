const BASE_URL = 'http://localhost:5000';

async function testNoteCreation() {
  try {
    // First, register a test user
    console.log('Registering test user...');
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    const { token } = (await registerRes.json()) as { token: string };
    console.log('✅ User registered, token:', token.substring(0, 50) + '...');

    // Create a note
    console.log('\nCreating note...');
    const noteRes = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Test Note',
        subject: 'Testing',
        blocks: [
          {
            type: 'markdown',
            content: 'This is a test note',
            noteType: 'general',
            isExamContent: false,
          },
        ],
      }),
    });

    const noteData = await noteRes.json();
    console.log('Note response status:', noteRes.status);
    console.log('Note data:', JSON.stringify(noteData, null, 2));

    if (noteRes.ok) {
      console.log('\n✅ SUCCESS: Note created successfully!');
    } else {
      console.log('\n❌ FAILED: Note creation failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testNoteCreation();
