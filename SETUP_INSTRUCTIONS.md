# Village Data Management System Setup Instructions

## 🚀 Quick Setup

### 1. Environment Configuration

1. Copy the `.env.local` file and update it with your actual values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_hashed_password_here

# JWT Secret for session management
JWT_SECRET=your_jwt_secret_here
```

### 2. Generate Password Hash

To generate a secure password hash, run this in your terminal:

```bash
node -e "
const bcrypt = require('bcryptjs');
const password = 'your_secure_password_here';
const hash = bcrypt.hashSync(password, 10);
console.log('Password Hash:', hash);
"
```

Replace `ADMIN_PASSWORD_HASH` in your `.env.local` with the generated hash.

### 3. Generate JWT Secret

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Replace `JWT_SECRET` in your `.env.local` with the generated secret.

### 4. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Get your project URL and API keys from Settings > API
3. Run the SQL schema in `database_schema.sql` using Supabase SQL Editor
4. Update your `.env.local` with the Supabase credentials

### 5. Install Dependencies

```bash
cd v-track
npm install
```

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Security Features

- **Row Level Security (RLS)**: All database tables have RLS enabled
- **Admin-only Access**: Only authenticated admin users can access the system
- **JWT Authentication**: Secure session management
- **API Route Protection**: All database operations go through protected API routes
- **Password Hashing**: Admin passwords are securely hashed using bcrypt

## 📊 Database Schema

The system includes the following main tables:

- `roads`: Main roads in the village
- `sub_roads`: Sub-roads belonging to main roads  
- `sub_sub_roads`: Further subdivisions with development status
- `addresses`: Specific addresses within sub-roads
- `households`: Household information
- `members`: Individual family members
- `businesses`: Local businesses
- `road_lamps`: Infrastructure lighting status
- `deletion_log`: Audit trail for soft deletions

## 🎯 Key Features

### Add Details
- Two-step form for household and member registration
- Interdependent dropdowns (Road → Sub Road → Address)
- Automatic age calculation from NIC
- Dynamic form fields based on occupation
- Local storage for member review before submission
- PostgreSQL transactions for data integrity

### View Details
- Filterable member data table
- Search functionality across all fields
- Export capabilities (planned)

### Add Business
- Business registration with location linking
- Owner and type tracking

### Road Lamps
- Infrastructure status management
- Toggle working/broken status
- Location-based organization

### Road Details
- Hierarchical road structure management
- Development status tracking
- Address management

## 🔄 Automated Features

### Annual Grade Updates
The system includes a function to automatically increment student grades every January 1st:

```sql
SELECT increment_student_grades();
```

You can set this up as a scheduled job in Supabase or run it manually.

### Soft Deletion
- Records are marked as deleted rather than permanently removed
- Deleted records show in red in admin interfaces
- Full audit trail maintained in `deletion_log` table

## 🛡️ Admin Access

**Default Credentials for Development:**
- Username: `admin`
- Password: `admin` (change this immediately!)

**For Production:**
1. Generate a strong password
2. Hash it using bcrypt
3. Update the `ADMIN_PASSWORD_HASH` environment variable
4. Never use the default credentials in production

## 📝 Usage Notes

1. **First Time Setup**: The system will accept the default password "admin" if no hash is configured
2. **Data Validation**: All forms include client and server-side validation
3. **Mobile Responsive**: The interface works on all device sizes
4. **Performance**: Database queries are optimized with proper indexing

## 🚨 Important Security Notes

1. Always use HTTPS in production
2. Keep your environment variables secure
3. Regularly update dependencies
4. Monitor access logs
5. Use strong passwords and change default credentials
6. Configure Supabase RLS policies according to your needs

## 📞 Support

For technical support or questions about the Village Data Management System, please refer to the documentation or contact your system administrator.