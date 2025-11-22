Village Data Management System (VDMS) Blueprint

This document outlines the architecture, technology stack, and core features of the Village Data Management System (VDMS)—a secure web application designed to store and manage household, member, business, and infrastructure data for a village.

🚀 1. Project Overview

The VDMS is a secure administrative tool accessible by two designated administrators. Its primary function is to centralize village data, allowing for efficient tracking of residents, infrastructure, and local businesses.

🎯 Key Goals

    High Security: Restrict access to administrators only, protecting sensitive data.

    Comprehensive Data Capture: Detailed logging of household, member, and infrastructure information.

    Intuitive Interface: Easy data entry using interdependent dropdowns and dynamic forms.

    Soft Deletion: Maintain an audit trail by marking records for deletion instead of permanent removal.

2. 🛠️ Technology Stack

Component	Technology	Rationale
Frontend	React	Component-based structure for building complex UIs efficiently.
Backend/Framework	Next.js	Provides Server-Side Rendering (SSR), API routes for secure data handling, and optimized routing.
Database/BaaS	Supabase	Offers a powerful PostgreSQL database, built-in Authentication, and Row Level Security (RLS) for robust data protection.
Styling	Tailwind CSS / CSS Modules (Recommended)	Utility-first framework for rapid and consistent styling.

3. 🛡️ Security Architecture

Security is paramount given the sensitive nature of the data.

3.1. Authentication

    Single Admin Credentials: A single username/password pair is managed for the two administrators.

    Environment Variables: The actual credentials (or username and a salted password hash) are stored securely in Next.js environment variables.

    Supabase Auth: Used to manage user sessions after the initial password verification is complete.

3.2. Data Protection (Row Level Security - RLS)

    Mandatory RLS: RLS is enabled on all data tables (homes, members, businesses, etc.).

    Policy Enforcement: Policies are configured to ensure that only an authenticated user with the designated admin role/ID can perform SELECT, INSERT, UPDATE, or DELETE operations. Public access is strictly forbidden.

3.3. API Routes Protection

    All frontend interactions with Supabase must pass through secure Next.js API Routes.

    These routes act as a proxy, verifying the admin's session/token before forwarding the request to Supabase.

4. 🗄️ Core Features and Data Structure

4.1. Navigation and User Flow

The sidebar includes the following routes:

    Dashboard (Overview/Statistics)

    Add Details (Household and Member Entry)

    View Details (Member List & Filters)

    Add Business (Business Entry)

    Road Lamps (Infrastructure Status)

    Road Details (Structure Setup - Roads, Sub-Roads, Addresses)

4.2. Add Details Logic (Nested Forms & Transactions)

Step	Functionality	Technology
1. Location Select	Interdependent Dropdowns: Road → Sub Road → Address. Selecting an item triggers a fetch for the next level of corresponding options.	React State Management, Supabase Queries
2. Member Entry	Dynamic Form: Fields like School Name/Grade or University Name are conditionally rendered based on the selected Occupation.	React State, Conditional Rendering
3. Age Calculation	Age is calculated automatically based on the NIC number entered.	Frontend JavaScript Logic
4. Local Storage	Members are added to a local state array and displayed in a table for review, edit, or deletion before final submission.	React useState Array
5. Submission	A single PostgreSQL Transaction is used via a Next.js API route to ensure the home record is created, and all associated member records are inserted successfully.	Supabase RPC/Transaction

4.3. Data Automation

    Annual Grade Update: A Supabase Scheduled Job (or Next.js cron job) is implemented to automatically increment the grade field for all members categorized as 'student' on January 1st of every year.

4.4. Soft Deletion

    When a user 'deletes' a record (Member, Business, etc.), the record's primary table column, is_deleted, is set to TRUE.

    The system records the action in a deletion_log table.

    The view tables query excludes records where is_deleted = TRUE, but these rows are visually represented (e.g., red color) in the admin interface before the final action (e.g., archival) is taken.