
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zddztkcgobwaqpormoic.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZHp0a2Nnb2J3YXFwb3Jtb2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTE1NzMsImV4cCI6MjA4NjIyNzU3M30.Eh8O2SyFX6f6xTeJ06gF-8RZN6kJnWgeiL9l6mLF4dA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables')
    if (error) {
        console.log('RPC get_tables failed, trying select from categories (if exists)')
        // Fallback or just try to query known meta tables if possible, but RPC is better.
        // Actually, let's try to query information_schema if we have permissions.
        const { data: schemaData, error: schemaError } = await supabase.from('checkin_events').select('*').limit(1)
        console.log('checkin_events sample:', schemaData)
    } else {
        console.log('Tables:', data)
    }
}

listTables()
