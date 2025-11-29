
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pulqvocnuvpwnsnyvlpt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bHF2b2NudXZwd25zbnl2bHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODEyMzcsImV4cCI6MjA3NTE1NzIzN30.yKf_FMnfGp3I1D5KbxaPzFKZHBNsFONWqNvK_LJjr1w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLS() {
  console.log('Testing Anonymous Insert...');
  const orderNumber = `TEST-${Date.now()}`;
  
  const { data: anonData, error: anonError } = await supabase
    .from('leads')
    .insert({
      lead_number: orderNumber,
      customer_name: 'Anon Tester',
      status: 'new',
      type: 'order',
      source: 'test_script'
    })
    .select();

  if (anonError) {
    console.error('Anonymous Insert Failed:', anonError.message);
  } else {
    console.log('Anonymous Insert Success:', anonData);
  }

  console.log('\nLogging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'testuser12345@example.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Login Failed:', authError.message);
    return;
  }

  console.log('Logged in as:', authData.user.id);

  console.log('Testing Authenticated Insert...');
  const orderNumberAuth = `TEST-AUTH-${Date.now()}`;
  
  const { data: authInsertData, error: authInsertError } = await supabase
    .from('leads')
    .insert({
      lead_number: orderNumberAuth,
      customer_name: 'Auth Tester',
      status: 'new',
      type: 'order',
      source: 'test_script',
      auth_user_id: authData.user.id
    })
    .select();

  if (authInsertError) {
    console.error('Authenticated Insert Failed:', authInsertError.message);
  } else {
    console.log('Authenticated Insert Success:', authInsertData);
  }
}

testRLS();
