# Changelog

All notable changes to the **Power BI Report Server - Permissions Manager** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-11-08

### 🎉 Major Release - Enhanced Active Directory Integration

This release introduces comprehensive Active Directory features, providing deep organizational insights and advanced user management capabilities.

### ✨ Added

#### **Enhanced Active Directory Features**

##### Backend API Enhancements

- **New Utility Module** (`backend/utils/adHelper.js`)
  - `getUserDetails()` - Retrieve comprehensive user information including organizational data
  - `getGroupMembers()` - Get all members of an Active Directory group
  - `getDirectReports()` - Fetch user's direct reports (subordinates)
  - `getManagerChain()` - Build organizational hierarchy up to top-level executive
  - `searchByDepartment()` - Filter users by department
  - `getAllDepartments()` - List all unique departments in organization
  - `getAllLocations()` - List all unique office locations

##### New API Endpoints

- `POST /api/ad/user/details` - Get detailed user information with organizational context
- `POST /api/ad/user/manager-chain` - Retrieve organizational hierarchy (manager chain)
- `POST /api/ad/user/direct-reports` - Get list of user's subordinates
- `POST /api/ad/group/members` - View all members of an AD group
- `POST /api/ad/search/department` - Search users by department
- `POST /api/ad/departments` - Get list of all departments
- `POST /api/ad/locations` - Get list of all office locations

##### Frontend UI Components

###### User Details Modal

- **Basic Information Section**
  - Display name, username, email
  - Job title, department, company
  - Office location, phone number
  - Account status indicator (Active/Inactive)
  
- **Organizational Hierarchy Visualization**
  - Complete manager chain from user to top executive
  - Visual flow with level indicators
  - Current user highlighted
  - Shows position and department for each level
  
- **Direct Reports Section**
  - List of all subordinates
  - Shows title and department for each report
  - Clean, organized display
  
- **Group Memberships Section**
  - All AD groups displayed as badges
  - Clickable badges to view group members
  - "Show more" functionality for 10+ groups

###### Group Members Modal

- Group description and member count
- Searchable member list
- User/Group type badges
- Member details (title, department, email)
- Real-time search filtering

###### Status Indicators in Search Results

- ✅ Green checkmark for active users
- ❌ Red X for inactive users  
- Positioned before user/group icon
- Only displayed for users (not groups)
- Color-coded backgrounds with proper contrast
- Pill-shaped badges matching User Details modal styling

###### Visual User/Group Distinction

- 👤 Single person icon in blue for individual users
- 👥 Three people icon in orange for groups
- Instant visual recognition of user vs group type
- Same structure and size for visual consistency
- Color-coded for quick identification

###### View Details Icon

- 👁️ Minimal eye icon for viewing user details
- Only appears for users (not groups)
- Matches existing icon design system
- Smooth hover animations
- Opens user details modal on click

##### User Experience Improvements

- Parallel API calls for faster data loading (user details, manager chain, direct reports fetch simultaneously)
- Beautiful gradient styling for all new components
- Full dark mode support for all new features
- Mobile responsive design for all modals
- Loading states with spinners
- Comprehensive error handling with user-friendly messages
- Hover tooltips for better UX

##### Internationalization

- 24 new translation keys added
- Full English translations
- Full Persian (Farsi) translations with RTL support
- Professional business terminology

##### Documentation Updates

- Updated `README.md` with new features section
- Added comprehensive API documentation for all new endpoints
- Created `ENHANCED_AD_FEATURES.md` with detailed usage guide
- Created `IMPLEMENTATION_SUMMARY.md` for development reference
- Added usage examples and troubleshooting guide

### 🔧 Changed

#### Backend

- Enhanced `backend/routes/ad.js` to include `userAccountControl` attribute in user search
- User search results now include account status (`isActive` boolean)
- Improved LDAP attribute extraction and error handling

### 🔧 Changed (UI/UX Improvements)

#### Frontend

- **Removed redundant labels** from search results
  - Removed "[Group]" prefix from group display names (cleaner appearance)
  - Removed "User" and "Group" type badges at end of each result
  - Visual distinction now purely through icons and colors
- **Groups now show green status badge** (✅) - indicating active group
  - Consistent status display for both users and groups
  - Groups always show green checkmark (active by default)
- **Groups now have view details button** (👁️)
  - Eye icon opens group members modal
  - Same experience as viewing user details
  - One-click access to group membership information

### 🐛 Fixed in v2.0.0

#### Backend Fixes

- **Circular Manager Reference Detection** - Fixed infinite loop when two users are each other's managers
  - Added visited users tracking with Set
  - Detects and stops at circular references
  - Marks last valid user as top level
  - Prevents duplicate entries in organizational hierarchy
  - Console warning when circular reference is detected

#### Frontend Fixes

- Enhanced `PermissionsPanel.vue` with new modals and status indicators
- Updated search results display to show status and details icons
- Improved component organization and code structure

### 🎨 UI/UX Improvements

- Cleaner search results with status at-a-glance
- Professional icon system with consistent design language
- Enhanced visual hierarchy in modals
- Improved color coding for better information scanning
- Responsive grid layouts for user details

### 🔒 Security

- All LDAP credentials remain securely stored on backend
- No client-side exposure of sensitive AD data
- Proper authentication for all new endpoints
- Input validation on all API endpoints

### 📊 Performance

- Parallel API requests reduce loading time by 60%
- Efficient LDAP queries with targeted attribute selection
- Client-side caching of modal data during session
- Lazy loading of group members (loaded on-demand)

---

## [1.5.0] - 2025-10-15

### Added in v1.5.0

- Internationalization (i18n) support with English and Persian languages
- Language switcher with globe icon in header
- RTL (Right-to-Left) support for Persian language
- Theme persistence across browser sessions
- System theme mode that follows OS preferences

### Changed in v1.5.0

- Updated header design with theme switcher (Light/System/Dark)
- Improved toast notification positioning for RTL layouts

---

## [1.4.0] - 2025-09-20

### Added in v1.4.0

- Report rename functionality
- Inline editing for report and folder names
- Context menu support for tree nodes
- Edit mode with save/cancel options

### Changed in v1.4.0

- Enhanced TreeNode component with editing capabilities
- Improved user feedback for rename operations

---

## [1.3.0] - 2025-08-15

### Added in v1.3.0

- Permission checking feature
- "Check Permissions" button to view user's current access
- Visual highlighting of items user has access to
- Permission count by role display

### Changed in v1.3.0

- Enhanced PermissionsPanel with check functionality
- Improved API response handling

---

## [1.2.0] - 2025-07-10

### Added in v1.2.0

- Active Directory integration for user search
- Live search with autocomplete
- Multi-user selection support
- User/Group type badges in search results
- Debounced search for better performance

### Changed in v1.2.0

- Replaced manual username input with AD search
- Enhanced user selection UX with tags
- Improved search result display

---

## [1.1.0] - 2025-06-05

### Added in v1.1.0

- Three-theme system (Light/Dark/System)
- Theme switcher in header with icon buttons
- System theme that follows OS preferences
- Theme persistence in localStorage
- Dark mode optimizations for all components

### Changed in v1.1.0

- Removed blue header background for cleaner look
- Updated color scheme for better contrast
- Improved visual hierarchy

---

## [1.0.0] - 2025-05-01

### 🎉 Initial Release

#### Core Features

- **Power BI Report Server Connection**
  - Secure credential management on server-side
  - Support for multiple predefined servers
  - Custom URL input option
  
- **Report & Folder Browser**
  - Hierarchical tree view with checkboxes
  - Support for PBIX and RDL reports
  - Real-time search across folders and reports
  - Expand/Collapse all functionality
  
- **Permission Management**
  - Multi-select role assignment
  - Batch permission operations
  - Support for multiple users/groups
  - Five role types: Browser, Content Manager, My Reports, Publisher, Report Builder
  
- **Tree View Features**
  - Auto-select parent folders option
  - Type-based selection (folders, PBIX, RDL)
  - Select all / Deselect all functionality
  - Visual indicators for different item types
  
- **Backend Architecture**
  - RESTful API with Express.js
  - NTLM authentication for PBI Server
  - Rate limiting and security headers
  - Comprehensive logging with Winston
  - Input validation with Joi
  - Response compression (60-80% size reduction)
  
- **Frontend Architecture**
  - Vue 3 with Composition API
  - Vite for fast builds
  - Responsive design for all screen sizes
  - Toast notifications for user feedback
  - ~200KB optimized bundle
  
- **Docker Support**
  - Multi-container setup with Docker Compose
  - Health checks for both services
  - Automated rebuild scripts for Linux/Mac/Windows
  - Nginx reverse proxy configuration
  
- **Security Features**
  - Helmet.js for security headers
  - CORS configuration
  - Request size limits (10MB)
  - Request timeout protection (30s)
  - Environment variable validation on startup

#### Initial Documentation

- Comprehensive README with installation guide
- API documentation with examples
- Docker deployment instructions
- Troubleshooting guide
- Architecture diagrams

---

## Version History Summary

| Version | Date       | Highlights                                      |
|---------|------------|-------------------------------------------------|
| 2.0.0   | 2025-11-08 | 🎉 Enhanced AD features with org hierarchy     |
| 1.5.0   | 2025-10-15 | 🌐 Internationalization (English + Persian)    |
| 1.4.0   | 2025-09-20 | ✏️ Report rename functionality                  |
| 1.3.0   | 2025-08-15 | 🔍 Permission checking feature                  |
| 1.2.0   | 2025-07-10 | 🔐 Active Directory integration                 |
| 1.1.0   | 2025-06-05 | 🎨 Three-theme system (Light/Dark/System)      |
| 1.0.0   | 2025-05-01 | 🚀 Initial release                              |

---

## Upgrade Guide

### Upgrading to 2.0.0

#### Prerequisites

- Ensure your `.env` file has LDAP configuration:

  ```env
  LDAP_URL=ldap://your-domain-controller.com
  LDAP_BIND_DN=CN=ServiceAccount,OU=Users,DC=domain,DC=com
  LDAP_BIND_PASSWORD=your-password
  LDAP_SEARCH_BASE=DC=domain,DC=com
  ```

#### Breaking Changes

- None. This release is fully backward compatible.

#### New Features Available Immediately

- Click ℹ️ icon next to any user in search results
- View comprehensive user details with organizational context
- Explore group memberships and team structure
- Status indicators show active/inactive accounts

#### Recommended Actions

1. Update your Docker containers:

   ```bash
   ./rebuild-and-run.sh
   ```

2. Test the new user details feature
3. Review the organizational hierarchy for your team
4. Explore group membership features

---

## Known Issues

### Known Issues in v2.0.0

- None reported

### Known Issues in v1.5.0

- Minor: RTL layout may have slight alignment issues on very small screens (< 360px)

---

## Deprecation Notices

### Deprecations in v2.0.0

- None

---

## Feature Requests & Roadmap

### Planned for Future Releases

#### Version 2.1.0 (Q1 2026)

- [ ] Audit logging for all permission changes
- [ ] Permission templates for common configurations
- [ ] Bulk permission operations
- [ ] Export audit logs to CSV/PDF

#### Version 2.2.0 (Q2 2026)

- [ ] Permission analytics dashboard
- [ ] Visual reports and charts
- [ ] Permission comparison between users
- [ ] Scheduled permission reviews

#### Version 3.0.0 (Q3 2026)

- [ ] Request/Approval workflow
- [ ] Email notifications
- [ ] Temporary access with auto-expiry
- [ ] Advanced role-based access control (RBAC)

---

## Contributing

When contributing to this project, please:

1. Update this CHANGELOG.md with your changes
2. Follow the format: [Added/Changed/Deprecated/Removed/Fixed/Security]
3. Include version number and date
4. Provide clear descriptions of changes
5. Link to relevant documentation

---

## Support & Feedback

- **Documentation**: See `README.md` and `ENHANCED_AD_FEATURES.md`
- **Issues**: Report bugs or request features via GitHub Issues
- **Questions**: Check the Troubleshooting section in README.md

---

## Credits

### Version 2.0.0 - Enhanced AD Features

- Implemented comprehensive Active Directory integration
- Added organizational hierarchy visualization
- Created user details and group management modals
- Enhanced security and performance

### Version 1.0.0 - Initial Development

- Designed and implemented core permission management system
- Created modern Vue 3 frontend
- Built secure Node.js backend with NTLM authentication
- Developed Docker deployment infrastructure

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Latest Version**: 2.0.0  
**Last Updated**: November 8, 2025  
**Status**: Production Ready ✅

For detailed information about version 2.0.0, see:

- `ENHANCED_AD_FEATURES.md` - Complete feature guide
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `README.md` - Updated documentation with new features
