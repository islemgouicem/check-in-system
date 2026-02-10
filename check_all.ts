
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zddztkcgobwaqpormoic.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZHp0a2Nnb2J3YXFwb3Jtb2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTE1NzMsImV4cCI6MjA4NjIyNzU3M30.Eh8O2SyFX6f6xTeJ06gF-8RZN6kJnWgeiL9l6mLF4dA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAllColumns() {
    const { data, error } = await supabase.from('persons').select('*').limit(10)
    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Persons columns:', Object.keys(data[0] || {}))
        data.forEach(p => console.log('Person:', p))
    }
}

checkAllColumns()
