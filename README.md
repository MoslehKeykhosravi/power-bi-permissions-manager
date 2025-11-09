# 🔐 Power BI Permissions Manager

A modern, full-stack web application for managing user permissions on Power BI Report Server. This application provides an intuitive interface to control access to reports and folders, accessible from any browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)
![Node](https://img.shields.io/badge/node-18.x-green.svg)
![Vue](https://img.shields.io/badge/vue-3.x-green.svg)

---

## ✨ Features

### 🎯 Core Functionality

- **Connect to Power BI Report Server** - Securely authenticate with credentials stored server-side
- **Browse Reports & Folders** - Hierarchical tree view with checkboxes for all reports (PBIX & RDL) and folders
- **Manage Permissions** - Add/modify user and group permissions with multi-select dropdown roles
- **Batch Operations** - Apply permissions to multiple reports/folders at once
- **Search & Filter** - Real-time search across folders and reports
- **Type Selection** - Filter by folders, PBIX reports, or RDL reports with one click
- **Predefined Servers** - Quick access to 3 default server addresses
- **Auto-select Parents** - Automatically select parent folders when selecting reports
- **Enhanced Active Directory Integration** - Deep AD integration with user details, organizational hierarchy, and group management
  - View comprehensive user information (email, title, department, phone, office location)
  - Visualize organizational hierarchy (manager chain up to top level)
  - View direct reports for any user
  - Explore AD group memberships
  - View group members with details
  - Account status indicators (active/inactive)

### 🎨 Modern UI

- **Material-UI Design** - Beautiful, responsive interface with custom SVG icons
- **3-Mode Theme System** - Switch between Light Mode, Dark Mode, and System Mode (follows OS preference)
- **Full Window Layout** - Optimized to use the entire screen size
- **High Performance** - Memoized components and optimized rendering for smooth folder expand/collapse
- **Tree View** - Intuitive folder/report hierarchy with instant expand/collapse
- **Real-time Feedback** - Toast notifications for all operations
- **Mobile Responsive** - Works on desktop, tablet, and mobile devices
- **Beautiful Icons** - Custom-designed SVG icons including gradient shield icon for security and minimal server icon

### 🚀 Technical Features

- **Docker Support** - Easy deployment with Docker Compose
- **RESTful API** - Clean backend API architecture
- **Security** - Rate limiting, input validation, and secure credential handling
- **High Performance** - Optimized tree view with memoized components for instant folder operations
- **Cross-Platform** - Runs on Windows, Linux, and macOS

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#️-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#️-configuration)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────┐
│           Web Browser (Client)                        │
│           Vue 3 Frontend                              │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌────────────────────▼─────────────────────────────────┐
│           Nginx (Reverse Proxy)                       │
│           - Static file serving                       │
│           - API routing                               │
└────────────────────┬─────────────────────────────────┘
                     │
       ┌─────────────┴──────────────┐
       │                            │
┌──────▼────────┐         ┌─────────▼────────┐
│  Backend API  │         │  Power BI Report │
│ Node.js       │◄────────┤     Server       │
│ Express       │         │   (REST API)     │
└───────────────┘         └──────────────────┘
```

### Technology Stack

**Frontend:**

- Vue 3 with Composition API
- Vite for fast builds
- Modern, responsive design with theme support
- ~200KB optimized bundle

**Backend:**

- Node.js 18.x
- Express.js
- Axios for PBI API calls
- LDAP.js for Active Directory integration

**Infrastructure:**

- Docker & Docker Compose
- Nginx as reverse proxy

---

## 📦 Prerequisites

### Using Docker (Recommended)

- Docker 20.10+
- Docker Compose 2.0+

### Manual Installation

- Node.js 18.x or higher
- npm 9.x or higher

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone or navigate to the project:**

   ```bash
   cd /path/to/power-bi-permissions-manager
   ```

2. **Create environment file:**

   ```bash
   cp backend/env.example backend/.env
   ```

3. **Edit the `.env` file with your configuration:**

   ```bash
   nano backend/.env
   ```

4. **Start the application:**

   **Quick Method - Automated Rebuild:**

   For Linux/Mac:

   ```bash
   # Fast rebuild (uses Docker cache - recommended)
   ./rebuild-and-run.sh
   
   # Clean rebuild (no cache - slower but ensures fresh build)
   ./rebuild-and-run.sh --clean
   ```

   For Windows:

   ```cmd
   REM Fast rebuild (uses Docker cache - recommended)
   rebuild-and-run.bat
   
   REM Clean rebuild (no cache - slower but ensures fresh build)
   rebuild-and-run.bat --clean
   ```

   This will automatically:
   - Stop existing containers
   - Rebuild images with latest changes (using cache for speed)
   - Start containers in detached mode

   **OR Manual Method:**

   ```bash
   docker compose up -d
   ```

5. **Access the application:**
   - Open your browser to: `http://localhost`
   - API: `http://localhost:5000`
   - Use the 3-icon theme switcher in the top-left to select your preferred theme (Light/System/Dark)

6. **View logs:**

   ```bash
   docker compose logs -f
   ```

7. **Stop the application:**

   ```bash
   docker compose down
   ```

### Option 2: Manual Installation

#### Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm start
```

#### Frontend Setup

```bash
cd frontend-vue
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite dev server)
The backend API will be at `http://localhost:5000`

---

## ⚙️ Configuration

### Environment Variables (Backend)

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80,http://localhost

# Power BI Report Server Credentials (SECURE - Keep this file private!)
PBI_USERNAME=DOMAIN\username
PBI_PASSWORD=your-password
PBI_DOMAIN=DOMAIN
PBI_USER=username

# Default Power BI Server URLs (3 predefined servers)
PBI_SERVER_URL_1=https://server1.domain.com/power_bi
PBI_SERVER_URL_2=https://server2.domain.com/Power_BI
PBI_SERVER_URL_3=https://server3.domain.com/Power_BI

# Active Directory Configuration (Optional)
LDAP_URL=ldap://your-domain-controller.com
LDAP_BIND_DN=CN=ServiceAccount,OU=Users,DC=domain,DC=com
LDAP_BIND_PASSWORD=your-password
LDAP_SEARCH_BASE=DC=domain,DC=com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**🔐 Security Note:**

- Credentials are now stored securely in the backend `.env` file
- Frontend applications no longer handle or transmit credentials
- Only the server URI is required from the client side

### Frontend Environment Variables

Create a `.env` file in the `frontend-vue` directory (optional):

```env
VITE_API_URL=/api
```

---

## 📖 Usage Guide

### 1. Theme Selection

Choose your preferred theme from 3 modes in the top-left corner:

- **☀️ Light Mode** - Bright theme with light backgrounds
- **💻 System Mode** - Automatically matches your operating system's theme preference
- **🌙 Dark Mode** - Dark theme for low-light environments
- Your preference is automatically saved and persists across sessions
- System mode dynamically updates when you change your OS theme

### 2. Connect to Server

1. Select from **3 predefined server URLs** in the dropdown, or choose "Enter Custom URL..."
2. Click **Load Reports** - credentials are securely managed on the server
3. No username/password input required in the frontend (secure mode enabled)

### 3. Browse Reports

- **Tree View with Checkboxes**: Navigate and select reports and folders
- **Icons**:
  - 📁 Folder icon for directories
  - 📊 Chart icon for PBIX reports
  - 📄 Document icon for RDL reports
- **Search**: Real-time search box filters by folder or report name
  - Case-insensitive partial matching
  - Auto-expands matching folders
- **Quick Actions**:
  - Expand All / Collapse All folders
  - Select All / Deselect All items
- **Type Filters**: Quick select all folders, PBIX, or RDL reports
- **Auto-select Parents**: Enable to automatically select parent folders when selecting reports

### 4. Set Permissions

1. **Select Items**: Check one or more reports/folders in the tree view
2. **Enter Username**: Type a username or group name (supports comma-separated multiple users)
3. **Select Roles**: Use the multi-select dropdown with:
   - **"Select All"** option at the top of dropdown
   - Individual role selection with checkboxes
   - **Browser**: View reports and subscribe
   - **Content Manager**: Full management access
   - **My Reports**: Manage personal reports
   - **Publisher**: Publish reports
   - **Report Builder**: View report definitions
   - Quick buttons: "Select All" and "Clear All"
4. **Apply**: Click "Apply Permissions to Selected Items"

### 5. Quick Selection

- **📁 Folders**: Select all folders
- **📊 PBIX**: Select all Power BI reports
- **📄 RDL**: Select all paginated reports

### 6. Enhanced Active Directory Features

#### View User Details

1. **Search for a user** in the Active Directory search box
2. **Click the ℹ️ info icon** next to any user in the search results
3. **View comprehensive information**:
   - Basic info: Display name, username, email, title
   - Contact: Phone number, office location, city
   - Organization: Department, company
   - Status: Active/Inactive account indicator

#### Organizational Hierarchy

- **Manager Chain**: See the user's complete reporting structure from them up to the top-level executive
- **Visual Flow**: Each level is clearly marked with position and department
- **Current User Highlight**: The selected user is visually distinguished in the hierarchy

#### Direct Reports

- **View Subordinates**: See all employees who directly report to the selected user
- **Quick Access**: Each direct report shows their title and department
- **Hierarchical Navigation**: Click on any direct report to view their details

#### Group Membership Management

- **View Groups**: See all AD groups the user belongs to
- **Clickable Groups**: Click any group badge to view its members
- **Group Details**: See group description and total member count
- **Search Members**: Search within group members by name, username, or email
- **Member Types**: Distinguish between user and group members with badges

---

## 🔌 API Documentation

### Reports API

#### `POST /api/reports/list`

Fetch all reports from the server.

**Request:**

```json
{
  "serverUri": "http://server/reports",
  "username": "DOMAIN\\user",
  "password": "password"
}
```

**Response:**

```json
{
  "success": true,
  "reports": [...],
  "errors": null,
  "count": 42
}
```

#### `POST /api/reports/rename`

Rename a report or folder.

**Request:**

```json
{
  "serverUri": "http://server/reports",
  "username": "DOMAIN\\user",
  "password": "password",
  "itemId": "item-guid",
  "itemType": "Report",
  "newName": "New Name"
}
```

### Permissions API

#### `POST /api/permissions/get`

Get permissions for an item.

**Request:**

```json
{
  "serverUri": "http://server/reports",
  "username": "DOMAIN\\user",
  "password": "password",
  "itemId": "item-guid",
  "itemPath": "/path/to/item"
}
```

#### `POST /api/permissions/set`

Set permissions for an item.

**Request:**

```json
{
  "serverUri": "http://server/reports",
  "username": "DOMAIN\\user",
  "password": "password",
  "itemId": "item-guid",
  "itemPath": "/path/to/item",
  "userName": "DOMAIN\\targetuser",
  "roles": ["Browser", "Publisher"],
  "itemType": "Report"
}
```

### Active Directory API

#### `POST /api/ad/search`

Search Active Directory for users and groups.

**Request:**

```json
{
  "ldapUrl": "ldap://dc.domain.com",
  "bindDN": "CN=Service,DC=domain,DC=com",
  "bindPassword": "password",
  "searchBase": "DC=domain,DC=com",
  "searchFilter": "*"
}
```

#### `POST /api/ad/user/details`

Get detailed information about a specific user including all organizational data.

**Request:**

```json
{
  "ldapUrl": "ldap://dc.domain.com",
  "bindDN": "CN=Service,DC=domain,DC=com",
  "bindPassword": "password",
  "searchBase": "DC=domain,DC=com",
  "userName": "john.doe"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "sAMAccountName": "john.doe",
    "displayName": "John Doe",
    "email": "john.doe@domain.com",
    "title": "Senior Developer",
    "department": "Engineering",
    "company": "Acme Corp",
    "managerName": "Jane Smith",
    "office": "Building A",
    "city": "New York",
    "telephoneNumber": "+1-555-0123",
    "isActive": true,
    "groups": ["Developers", "Project-Team-A", "All-Staff"],
    ...
  }
}
```

#### `POST /api/ad/user/manager-chain`

Get the organizational hierarchy (manager chain) for a user.

**Request:**

```json
{
  "ldapUrl": "ldap://dc.domain.com",
  "bindDN": "CN=Service,DC=domain,DC=com",
  "bindPassword": "password",
  "searchBase": "DC=domain,DC=com",
  "userName": "john.doe"
}
```

**Response:**

```json
{
  "success": true,
  "managerChain": [
    {
      "sAMAccountName": "john.doe",
      "displayName": "John Doe",
      "title": "Senior Developer",
      "department": "Engineering",
      "level": 0,
      "isTopLevel": false
    },
    {
      "sAMAccountName": "jane.smith",
      "displayName": "Jane Smith",
      "title": "Engineering Manager",
      "department": "Engineering",
      "level": 1,
      "isTopLevel": false
    },
    ...
  ],
  "levels": 3
}
```

#### `POST /api/ad/user/direct-reports`

Get all direct reports (subordinates) for a user.

**Request:**

```json
{
  "ldapUrl": "ldap://dc.domain.com",
  "bindDN": "CN=Service,DC=domain,DC=com",
  "bindPassword": "password",
  "searchBase": "DC=domain,DC=com",
  "userName": "jane.smith"
}
```

**Response:**

```json
{
  "success": true,
  "directReports": [
    {
      "sAMAccountName": "john.doe",
      "displayName": "John Doe",
      "email": "john.doe@domain.com",
      "title": "Senior Developer",
      "department": "Engineering",
      ...
    },
    ...
  ],
  "count": 5
}
```

#### `POST /api/ad/group/members`

Get all members of an Active Directory group.

**Request:**

```json
{
  "ldapUrl": "ldap://dc.domain.com",
  "bindDN": "CN=Service,DC=domain,DC=com",
  "bindPassword": "password",
  "searchBase": "DC=domain,DC=com",
  "groupName": "Developers"
}
```

**Response:**

```json
{
  "success": true,
  "group": {
    "cn": "Developers",
    "description": "Development team members",
    "memberCount": 15
  },
  "members": [
    {
      "sAMAccountName": "john.doe",
      "displayName": "John Doe",
      "email": "john.doe@domain.com",
      "title": "Senior Developer",
      "department": "Engineering",
      "type": "user"
    },
    ...
  ],
  "count": 15
}
```

#### `POST /api/ad/departments`

Get list of all unique departments in Active Directory.

**Request:**

```json
{
  "ldapUrl": "ldap://dc.domain.com",
  "bindDN": "CN=Service,DC=domain,DC=com",
  "bindPassword": "password",
  "searchBase": "DC=domain,DC=com"
}
```

**Response:**

```json
{
  "success": true,
  "departments": [
    "Engineering",
    "Sales",
    "Marketing",
    "HR",
    ...
  ],
  "count": 12
}
```

#### `POST /api/ad/locations`

Get list of all unique office locations in Active Directory.

**Request:**

```json
{
  "ldapUrl": "ldap://dc.domain.com",
  "bindDN": "CN=Service,DC=domain,DC=com",
  "bindPassword": "password",
  "searchBase": "DC=domain,DC=com"
}
```

**Response:**

```json
{
  "success": true,
  "locations": [
    "New York",
    "San Francisco",
    "London",
    "Building A",
    ...
  ],
  "count": 8
}
```

---

## 💻 Development

### Project Structure

```text
power-bi-permissions-manager/
├── backend/
│   ├── routes/
│   │   ├── reports.js       # Report operations
│   │   ├── permissions.js   # Permission management
│   │   ├── ad.js           # Active Directory (Enhanced)
│   │   └── config.js        # Configuration
│   ├── utils/
│   │   ├── adHelper.js      # Enhanced AD utility functions (NEW)
│   │   ├── logger.js        # Logging utility
│   │   └── validateEnv.js   # Environment validation
│   ├── server.js            # Main server file
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend-vue/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PermissionsPanel.vue
│   │   │   ├── ReportTree.vue
│   │   │   └── TreeNode.vue
│   │   ├── assets/         # Icon components (SVG)
│   │   │   ├── PermissionsIcon.vue  # Beautiful gradient shield icon
│   │   │   ├── ServerIcon.vue       # Minimal server rack icon
│   │   │   ├── PowerBIIcon.vue      # Power BI chart icon
│   │   │   ├── FolderIcon.vue       # Folder icon
│   │   │   └── RDLIcon.vue          # RDL report icon
│   │   ├── composables/    # Vue composables (i18n)
│   │   ├── i18n/           # Translations
│   │   ├── styles/         # Design system
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

### Running in Development Mode

**Backend:**

```bash
cd backend
npm install
npm run dev  # Uses nodemon for auto-reload
```

**Frontend:**

```bash
cd frontend-vue
npm install
npm run dev  # Runs on port 5173 with hot reload
```

### Building for Production

**Backend:**

```bash
cd backend
npm install --production
```

**Frontend:**

```bash
cd frontend-vue
npm run build
```

---

## 🚢 Deployment

### Production Docker Deployment

1. **Build and start services:**

   ```bash
   docker-compose up -d --build
   ```

2. **Check status:**

   ```bash
   docker-compose ps
   ```

3. **View logs:**

   ```bash
   docker-compose logs -f
   ```

4. **Update application:**

   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Nginx Reverse Proxy

If deploying behind a reverse proxy, configure SSL/TLS:

```nginx
server {
    listen 443 ssl http2;
    server_name pbi-permissions.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Cannot connect to Report Server

- Verify server URI is correct
- Check credentials have proper permissions
- Ensure network connectivity to report server
- Check firewall rules

#### 2. Reports not loading

- Verify user has read access to reports
- Check Power BI Report Server version compatibility
- Review backend logs: `docker-compose logs backend`

#### 3. Permission changes not applying

- Ensure user has Content Manager role on target items
- Check that item path/ID is correct
- Review API response in browser console

#### 4. Docker container won't start

- Check port conflicts: `netstat -tlnp | grep -E '80|5000'`
- Verify Docker daemon is running
- Check logs: `docker-compose logs`

### Debug Mode

Enable debug logging in backend `.env`:

```env
NODE_ENV=development
DEBUG=*
```

View real-time logs:

```bash
docker-compose logs -f backend
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

---
