// Temporary simple login test
// Replace your .env.local temporarily with these values for testing:

# Supabase Configuration - REPLACE WITH YOUR ACTUAL VALUES
NEXT_PUBLIC_SUPABASE_URL=https://oocmnyawbzqgdatiaazs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vY21ueWF3YnpxZ2RhdGlhYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzY4MTEsImV4cCI6MjA3OTMxMjgxMX0.xv1BhRBHO8unepN7iNSrZA56ehIrx-mBdkmuPZN9Bn8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vY21ueWF3YnpxZ2RhdGlhYXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzY4MTEsImV4cCI6MjA3OTMxMjgxMX0.xv1BhRBHO8unepN7iNSrZA56ehIrx-mBdkmuPZN9Bn8

# Admin Authentication - SIMPLE VERSION FOR TESTING
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_hashed_password_here

# JWT Secret for session management
JWT_SECRET=c4db229bd56b257aeded2ccbf613aacd292e8a1b86fa988e2287bcde65aeb3c6

// This will make the system use the fallback password check (password === 'admin')
// Login with: username='admin', password='admin'