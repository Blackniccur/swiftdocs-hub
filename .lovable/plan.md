
# Document Processing & Verification Marketplace

## Phase 1: Client Flow (Starting Point)

### 1. Authentication (Supabase Auth)
- Email/password signup & login
- Protected routes for authenticated users
- Profiles table with name, phone, and role (client vs admin)
- Separate user_roles table for admin access

### 2. Client Dashboard
- Overview of submitted applications with status
- Notifications for status updates
- Quick links to upload documents or check payment status

### 3. Document Upload Flow
- Multi-step form wizard:
  - **Step 1**: Upload photo (profile picture)
  - **Step 2**: Upload identification document
  - **Step 3**: Upload W-2 form
  - **Step 4**: Upload payment proof (receipt/screenshot)
- File validation (size, type) with preview before submission
- Files stored in Supabase Storage buckets

### 4. Application Status Tracking
- Visual progress tracker showing stages:
  - Application Submitted → Documents Under Review → Processing → Ready (5 days estimate)
- Timeline view with dates for each stage update
- Color-coded status badges

### 5. Payment Section
- **Stripe checkout** for direct payments on the platform
- **Payment proof upload** option (screenshot/receipt + reference number)
- Payment verification status indicator
- Payment history list

### 6. Admin Dashboard
- View all client submissions in a table
- Review uploaded documents (view/download)
- Approve or reject documents with reason
- Update application status manually
- Mark payments as verified
- Filter/search by client name, status, or date

### Design & UX
- Clean, professional UI with trust-building design
- Mobile-responsive layout
- Toast notifications for actions
- Loading states and empty states throughout
- Blue/navy color scheme conveying professionalism and trust
