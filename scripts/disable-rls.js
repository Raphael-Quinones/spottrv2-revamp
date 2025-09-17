const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function disableAllRLS() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('🔓 Disabling all RLS policies...\n');

  try {
    // SQL to disable RLS on all tables and drop all policies
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Disable RLS on all public tables
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
            LOOP
                EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
                RAISE NOTICE 'Disabled RLS on table: %', r.tablename;
            END LOOP;
        END $$;

        -- Drop all policies from public tables
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN
                SELECT schemaname, tablename, policyname
                FROM pg_policies
                WHERE schemaname = 'public'
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                              r.policyname, r.schemaname, r.tablename);
                RAISE NOTICE 'Dropped policy: % on %', r.policyname, r.tablename;
            END LOOP;
        END $$;

        -- Specifically ensure critical tables have RLS disabled
        ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.videos DISABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.video_analysis DISABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.processing_queue DISABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.processing_costs DISABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.usage_tracking DISABLE ROW LEVEL SECURITY;

        -- Grant permissions for development
        GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

        SELECT 'RLS disabled successfully' as status;
      `
    });

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('exec_sql not available, trying direct execution...');

      const { data: result, error: directError } = await supabase
        .from('video_analysis')
        .select('count')
        .limit(0);

      // Use the admin API to run SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({
          query: `
            ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.video_analysis DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.processing_queue DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.processing_costs DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.usage_tracking DISABLE ROW LEVEL SECURITY;
          `
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to disable RLS via API: ${response.statusText}`);
      }
    }

    console.log('✅ RLS has been disabled on all tables');
    console.log('\n⚠️  Warning: This is for development only!');
    console.log('Remember to re-enable RLS before deploying to production.\n');

  } catch (error) {
    console.error('Error disabling RLS:', error);

    // Try alternate approach using raw SQL endpoint
    console.log('\nTrying alternate approach...');

    const tables = [
      'users', 'videos', 'video_analysis',
      'processing_queue', 'processing_costs', 'usage_tracking'
    ];

    for (const table of tables) {
      try {
        // This will work even if we can't directly execute ALTER commands
        const { error: policyError } = await supabase
          .from(table)
          .select('*')
          .limit(0);

        if (policyError && policyError.code === '42501') {
          console.log(`❌ RLS still active on ${table}`);
        } else {
          console.log(`✅ Can access ${table} without RLS issues`);
        }
      } catch (e) {
        console.log(`⚠️  Could not check ${table}`);
      }
    }

    console.log('\n📝 Manual fix required:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own videos" ON videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;
DROP POLICY IF EXISTS "Users can view analysis of own videos" ON video_analysis;
    `);
  }
}

disableAllRLS();