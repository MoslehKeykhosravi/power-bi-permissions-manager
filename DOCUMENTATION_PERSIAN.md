# مستندات کامل پروژه مدیریت دسترسی‌های Power BI

## خلاصه پروژه

**مدیریت دسترسی‌های Power BI Report Server** یک اپلیکیشن وب مدرن و Full-Stack است که برای مدیریت دسترسی‌های کاربران به گزارش‌های Power BI Report Server طراحی شده است. این سیستم رابط کاربری ساده و قدرتمندی را برای کنترل دسترسی به گزارش‌ها و پوشه‌ها فراهم می‌کند و از هر مرورگری قابل دسترسی است.

### ویژگی‌های کلیدی

- **اتصال امن به Power BI Report Server** با احراز هویت NTLM
- **مرور درختی گزارش‌ها و پوشه‌ها** با امکان انتخاب چندگانه
- **مدیریت دسترسی‌ها** با قابلیت تخصیص نقش‌های مختلف
- **یکپارچه‌سازی کامل با Active Directory** برای مدیریت کاربران و گروه‌ها
- **نمایش ساختار سازمانی** با مشاهده زنجیره مدیریت و زیرمجموعه‌ها
- **پشتیبانی از سه حالت تِم** (روشن، سیستم، تاریک)
- **پشتیبانی از دو زبان** (انگلیسی و فارسی)
- **معماری Docker** برای استقرار آسان

---

## معماری سیستم

### نمای کلی معماری

```text
┌──────────────────────────────────────────────────────┐
│              مرورگر وب (Client)                       │
│           رابط کاربری Vue 3                          │
└────────────────────┬─────────────────────────────────┘
                     │ HTTP/HTTPS
                     │
┌────────────────────▼─────────────────────────────────┐
│           Nginx (Reverse Proxy)                       │
│           - سرویس فایل‌های استاتیک                   │
│           - مسیریابی API                              │
└────────────────────┬─────────────────────────────────┘
                     │
       ┌─────────────┴──────────────┐
       │                            │
┌──────▼────────┐         ┌─────────▼────────┐
│  Backend API  │         │  Power BI Report │
│ Node.js       │◄────────┤     Server       │
│ Express       │         │   (REST API)     │
└───────┬───────┘         └──────────────────┘
        │
┌───────▼───────┐
│Active Directory│
│    (LDAP)     │
└───────────────┘
```

### لایه‌های سیستم

#### 1. **لایه Frontend (رابط کاربری)**

- Vue 3 با Composition API
- Vite برای ساخت سریع
- حجم بهینه‌شده ~200KB

#### 2. **لایه Proxy (Nginx)**

- سرویس‌دهی فایل‌های استاتیک
- مسیریابی درخواست‌های API به Backend
- فشرده‌سازی و کش

#### 3. **لایه Backend (منطق کسب‌وکار)**

- Node.js 18.x
- Express.js framework
- احراز هویت NTLM
- یکپارچه‌سازی LDAP

#### 4. **لایه‌های خارجی**

- Power BI Report Server
- Active Directory

---

## پکیج‌های استفاده شده

### پکیج‌های Backend

| پکیج | نسخه | کاربرد | چرا این پکیج؟ |
|------|------|--------|----------------|
| **express** | ^4.18.2 | فریم‌ورک وب | سریع، انعطاف‌پذیر، استاندارد صنعت برای API های Node.js |
| **cors** | ^2.8.5 | مدیریت Cross-Origin | امکان ارتباط امن بین Frontend و Backend روی دامنه‌های مختلف |
| **axios** | ^1.6.0 | کلاینت HTTP | ارتباط با Power BI REST API، پشتیبانی از NTLM و Promise |
| **dotenv** | ^16.3.1 | مدیریت Environment Variables | ذخیره امن اطلاعات حساس (رمز عبور، کلیدها) خارج از کد |
| **ldapjs** | ^3.0.7 | ارتباط با Active Directory | جستجو و دریافت اطلاعات کاربران و گروه‌های AD |
| **express-rate-limit** | ^7.1.5 | محدودیت نرخ درخواست | جلوگیری از حملات DDoS و Brute Force |
| **helmet** | ^7.1.0 | هدرهای امنیتی HTTP | محافظت در برابر آسیب‌پذیری‌های رایج وب (XSS, Clickjacking) |
| **morgan** | ^1.10.0 | لاگ HTTP | ثبت درخواست‌ها برای monitoring و troubleshooting |
| **xml2js** | ^0.6.2 | پارس XML | تبدیل پاسخ‌های XML از Power BI به JSON |
| **httpntlm** | ^1.7.7 | احراز هویت NTLM | اتصال امن به Power BI Server با Windows Authentication |
| **compression** | ^1.7.4 | فشرده‌سازی پاسخ | کاهش 60-80% حجم داده‌ها، افزایش سرعت |
| **winston** | ^3.11.0 | سیستم لاگینگ حرفه‌ای | ثبت لاگ‌ها در فایل و کنسول با سطوح مختلف |
| **joi** | ^17.11.0 | اعتبارسنجی ورودی | بررسی صحت داده‌های ورودی API برای امنیت |

### چرا Node.js و Express

1. **عملکرد بالا**: معماری Event-driven و Non-blocking I/O برای پردازش همزمان درخواست‌های زیاد
2. **اکوسیستم غنی**: دسترسی به میلیون‌ها پکیج NPM
3. **یکپارچگی با NTLM**: پشتیبانی عالی از Windows Authentication
4. **JavaScript در همه جا**: استفاده از یک زبان در Frontend و Backend

### پکیج‌های Frontend

| پکیج | نسخه | کاربرد | چرا این پکیج؟ |
|------|------|--------|----------------|
| **vue** | ^3.4.0 | فریم‌ورک UI | سبک، سریع، Reactive، با API مدرن Composition |
| **axios** | ^1.6.0 | کلاینت HTTP | ارتباط با Backend API، مدیریت آسان Promise |
| **pinia** | ^2.1.7 | مدیریت State | State management ساده‌تر و مدرن‌تر از Vuex |
| **vite** | ^5.0.0 | Build Tool | بیلد فوق‌العاده سریع، Hot Module Replacement |
| **terser** | ^5.27.0 | Minification | کوچک‌سازی و بهینه‌سازی کد JavaScript |

### چرا Vue 3

1. **سبک و سریع**: حجم کم و عملکرد بالا
2. **Composition API**: کد قابل استفاده مجدد و سازماندهی بهتر
3. **Reactivity پیشرفته**: بروزرسانی خودکار UI
4. **منحنی یادگیری ملایم**: یادگیری و توسعه آسان‌تر

---

## امنیت (Security)

### لایه‌های امنیتی پیاده‌سازی شده

#### 1. **محافظت در برابر حملات رایج وب**

**Helmet.js**: تنظیم هدرهای امنیتی HTTP

```javascript
// هدرهای امنیتی که Helmet اعمال می‌کند:

X-Frame-Options: SAMEORIGIN
// جلوگیری از Clickjacking

X-Content-Type-Options: nosniff
// جلوگیری از MIME type sniffing

X-XSS-Protection: 1; mode=block
// فعال‌سازی فیلتر XSS مرورگر

Referrer-Policy: no-referrer-when-downgrade
// کنترل اطلاعات Referrer
```

**اهمیت**: محافظت در برابر حملات XSS، Clickjacking، و MIME sniffing

#### 2. **محدودیت نرخ درخواست (Rate Limiting)**

```javascript
// محدودیت: 100 درخواست در 15 دقیقه از هر IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

**اهمیت**: جلوگیری از:

- حملات Brute Force
- حملات DDoS
- سوءاستفاده از API

#### 3. **CORS (Cross-Origin Resource Sharing)**

```javascript
// فقط Origin های مجاز می‌توانند به API دسترسی داشته باشند
allowedOrigins: [
  'http://localhost',
  'http://localhost:80',
  'http://localhost:5173'
]
```

**اهمیت**: جلوگیری از دسترسی غیرمجاز از دامنه‌های دیگر

#### 4. **اعتبارسنجی ورودی (Input Validation)**

```javascript
// استفاده از Joi برای اعتبارسنجی
const schema = Joi.object({
  serverUri: Joi.string().uri().required(),
  userName: Joi.string().required(),
  roles: Joi.array().items(Joi.string())
});
```

**اهمیت**: جلوگیری از SQL Injection، XSS، و ورودی‌های مخرب

#### 5. **مدیریت امن اطلاعات حساس**

**Environment Variables**: همه اطلاعات حساس در فایل `.env` نگهداری می‌شود:

```env
PBI_USERNAME=DOMAIN\username
PBI_PASSWORD=secure_password
LDAP_BIND_DN=CN=Service,DC=domain,DC=com
LDAP_BIND_PASSWORD=secure_password
```

**اهمیت**:

- رمز عبورها هیچ‌گاه در کد نوشته نمی‌شوند
- فایل `.env` در `.gitignore` قرار دارد
- Frontend هیچ دسترسی به credentials ندارد

#### 6. **احراز هویت NTLM**

```javascript
// احراز هویت Windows برای Power BI
httpntlm.post({
  username: PBI_USERNAME,
  password: PBI_PASSWORD,
  domain: PBI_DOMAIN,
  workstation: '',
  url: serverUri
});
```

**اهمیت**: استفاده از استاندارد امنیتی Windows

#### 7. **HTTPS و SSL/TLS** (در محیط Production)

```nginx
# پیکربندی SSL در Nginx
listen 443 ssl http2;
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

**اهمیت**: رمزنگاری تمام ارتباطات

#### 8. **Request Size Limits**

```javascript
// محدودیت حجم درخواست به 10MB
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**اهمیت**: جلوگیری از حملات Memory Exhaustion

#### 9. **Request Timeout**

```javascript
// قطع خودکار درخواست‌های طولانی بعد از 30 ثانیه
req.setTimeout(30000);
res.setTimeout(30000);
```

**اهمیت**: جلوگیری از مسدود شدن سرور با درخواست‌های معلق

#### 10. **Docker Security**

```dockerfile
# اجرا با کاربر non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
```

**اهمیت**: محدود کردن دسترسی‌های container در صورت نفوذ

### خلاصه ویژگی‌های امنیتی

✅ محافظت در برابر XSS، CSRF، Clickjacking
✅ Rate Limiting برای جلوگیری از حملات DDoS
✅ CORS برای کنترل دامنه‌های مجاز
✅ Input Validation برای جلوگیری از Injection
✅ Environment Variables برای اطلاعات حساس
✅ NTLM Authentication برای Power BI
✅ LDAP Secure Binding برای Active Directory
✅ Request Size و Timeout Limits
✅ Docker Non-root User
✅ Compression و Security Headers

---

## Frontend (رابط کاربری)

### تکنولوژی‌های استفاده شده

#### Vue 3 + Composition API

**معماری Component-Based**: اپلیکیشن از 3 کامپوننت اصلی تشکیل شده:

```text
App.vue (کامپوننت اصلی)
├── ReportTree.vue (درخت گزارش‌ها)
│   └── TreeNode.vue (نود تکی - Recursive)
└── PermissionsPanel.vue (پنل مدیریت دسترسی)
```

#### 1. **App.vue** - کامپوننت اصلی

**وظایف**:

- مدیریت تِم (روشن/تاریک/سیستم)
- مدیریت زبان (انگلیسی/فارسی)
- اتصال به سرور Power BI
- هماهنگی بین کامپوننت‌ها

**ویژگی‌ها**:

```javascript
// مدیریت State با Composition API
const theme = ref('system');
const locale = ref('en');
const reports = ref([]);
const selectedItems = ref([]);

// بارگذاری گزارش‌ها
const loadReports = async () => {
  const response = await axios.post('/api/reports/list', {
    serverUri: selectedServer.value
  });
};
```

#### 2. **ReportTree.vue** - درخت گزارش‌ها

**قابلیت‌ها**:

- نمایش سلسله مراتبی گزارش‌ها و پوشه‌ها
- جستجوی Real-time
- Expand/Collapse همه
- انتخاب بر اساس نوع (پوشه/PBIX/RDL)

**بهینه‌سازی عملکرد**:

```javascript
// استفاده از Memoization برای عملکرد بالا
import { ref, computed, watch } from 'vue';

// فیلتر کردن Real-time گزارش‌ها
const filteredReports = computed(() => {
  return reports.value.filter(report => 
    report.Name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
```

#### 3. **TreeNode.vue** - نود درختی (Recursive)

**ویژگی‌های خاص**:

- Recursive Component برای نمایش درخت نامحدود
- آیکون‌های SVG سفارشی
- انیمیشن Smooth برای باز/بسته شدن

```vue
<template>
  <div class="tree-node">
    <input type="checkbox" v-model="isSelected" />
    <component :is="iconComponent" />
    <span>{{ node.Name }}</span>
    
    <!-- Recursive: فراخوانی خودش برای فرزندان -->
    <TreeNode 
      v-for="child in node.Children"
      :key="child.Id"
      :node="child"
    />
  </div>
</template>
```

#### 4. **PermissionsPanel.vue** - پنل مدیریت دسترسی

**ویژگی‌ها**:

- یکپارچه‌سازی با Active Directory
- جستجوی کاربران و گروه‌ها
- نمایش جزئیات کاربر (سلسله مراتب سازمانی)
- نمایش اعضای گروه
- Multi-select برای نقش‌ها

**مودال‌های کاربردی**:

```javascript
// مودال جزئیات کاربر
const showUserDetails = async (userName) => {
  // فراخوانی موازی 3 API برای سرعت بیشتر
  const [userInfo, managerChain, directReports] = await Promise.all([
    fetchUserDetails(userName),
    fetchManagerChain(userName),
    fetchDirectReports(userName)
  ]);
};

// مودال اعضای گروه
const showGroupMembers = async (groupName) => {
  const members = await fetchGroupMembers(groupName);
};
```

### سیستم تِم (Theme System)

**3 حالت تِم**:

1. **Light Mode** (حالت روشن)
   - پس‌زمینه سفید
   - متن تیره
   - برای محیط‌های روشن

2. **Dark Mode** (حالت تاریک)
   - پس‌زمینه تیره
   - متن روشن
   - برای محیط‌های کم‌نور

3. **System Mode** (حالت سیستم)
   - تطبیق خودکار با تنظیمات سیستم‌عامل
   - تغییر پویا با تغییر تنظیمات OS

```css
/* سیستم CSS Variables برای تِم */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --accent: #0066cc;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
  --accent: #4da6ff;
}
```

### پشتیبانی از چند زبانه (i18n)

**دو زبان کامل**:

- انگلیسی (LTR)
- فارسی (RTL)

```javascript
// سیستم ترجمه
const translations = {
  en: {
    'connect': 'Connect to Server',
    'reports': 'Reports',
    'permissions': 'Permissions'
  },
  fa: {
    'connect': 'اتصال به سرور',
    'reports': 'گزارش‌ها',
    'permissions': 'دسترسی‌ها'
  }
};
```

### بهینه‌سازی عملکرد

**تکنیک‌های بهینه‌سازی**:

1. **Lazy Loading**: بارگذاری تنها بخش‌های نمایان
2. **Computed Properties**: محاسبات Cache شده
3. **Debouncing**: کاهش فراخوانی‌های API در جستجو
4. **Virtual Scrolling**: نمایش لیست‌های بزرگ
5. **Code Splitting**: تقسیم کد به Bundle های کوچکتر

**نتیجه**: Bundle کوچک (~200KB) و عملکرد بسیار بالا

---

## Backend (سمت سرور)

### معماری Backend

**ساختار Modular** با تفکیک مسئولیت‌ها:

```text
backend/
├── server.js               # نقطه ورود اصلی
├── routes/                 # مسیریابی API
│   ├── reports.js         # عملیات گزارش‌ها
│   ├── permissions.js     # مدیریت دسترسی
│   ├── ad.js              # Active Directory
│   └── config.js          # پیکربندی
├── utils/                  # توابع کمکی
│   ├── adHelper.js        # توابع AD
│   ├── logger.js          # سیستم لاگ
│   └── validateEnv.js     # اعتبارسنجی ENV
└── middleware/             # Middleware ها
    └── validation.js      # اعتبارسنجی ورودی
```

### مسیرهای API (API Routes)

#### 1. **Routes: Reports** (`/api/reports`)

**وظیفه**: مدیریت عملیات مربوط به گزارش‌ها

```javascript
// POST /api/reports/list
// دریافت لیست تمام گزارش‌ها از Power BI Server
router.post('/list', async (req, res) => {
  // احراز هویت NTLM
  const auth = {
    username: process.env.PBI_USERNAME,
    password: process.env.PBI_PASSWORD,
    domain: process.env.PBI_DOMAIN
  };
  
  // فراخوانی API Power BI
  const response = await httpntlm.post({
    url: `${serverUri}/api/v2.0/CatalogItems`,
    ...auth
  });
  
  // پارس XML و ارسال JSON
  return res.json(parseReports(response.body));
});

// POST /api/reports/rename
// تغییر نام گزارش یا پوشه
router.post('/rename', validateInput, async (req, res) => {
  // تغییر نام در Power BI Server
});
```

**ویژگی‌ها**:

- احراز هویت خودکار با credentials ذخیره شده
- تبدیل XML به JSON
- مدیریت خطا و Logging

#### 2. **Routes: Permissions** (`/api/permissions`)

**وظیفه**: مدیریت دسترسی‌ها

```javascript
// POST /api/permissions/get
// دریافت دسترسی‌های یک گزارش یا پوشه
router.post('/get', async (req, res) => {
  const { itemId, itemPath } = req.body;
  
  const permissions = await fetchItemPermissions(itemId, itemPath);
  
  return res.json({ success: true, permissions });
});

// POST /api/permissions/set
// تنظیم دسترسی برای کاربر یا گروه
router.post('/set', validatePermissions, async (req, res) => {
  const { itemId, userName, roles } = req.body;
  
  // ساخت Policy XML
  const policy = buildPermissionPolicy(userName, roles);
  
  // ارسال به Power BI
  await setPowerBIPermissions(itemId, policy);
  
  return res.json({ success: true });
});
```

**نقش‌های قابل تخصیص**:

- **Browser**: مشاهده و Subscribe
- **Content Manager**: مدیریت کامل
- **My Reports**: مدیریت گزارش‌های شخصی
- **Publisher**: انتشار گزارش
- **Report Builder**: مشاهده تعریف گزارش

#### 3. **Routes: Active Directory** (`/api/ad`)

**وظیفه**: یکپارچه‌سازی با AD

```javascript
// POST /api/ad/search
// جستجوی کاربران و گروه‌ها
router.post('/search', async (req, res) => {
  const { searchFilter } = req.body;
  
  const client = ldap.createClient({
    url: process.env.LDAP_URL
  });
  
  // Bind با اطلاعات سرویس
  await client.bind(
    process.env.LDAP_BIND_DN,
    process.env.LDAP_BIND_PASSWORD
  );
  
  // جستجو در AD
  const results = await searchAD(searchFilter);
  
  return res.json({ success: true, results });
});

// POST /api/ad/user/details
// دریافت جزئیات کامل کاربر
router.post('/user/details', async (req, res) => {
  const userDetails = await getUserDetails(req.body.userName);
  return res.json({ success: true, user: userDetails });
});

// POST /api/ad/user/manager-chain
// دریافت سلسله مراتب مدیریت
router.post('/user/manager-chain', async (req, res) => {
  const chain = await getManagerChain(req.body.userName);
  return res.json({ success: true, managerChain: chain });
});

// POST /api/ad/user/direct-reports
// دریافت زیرمجموعه‌های مستقیم
router.post('/user/direct-reports', async (req, res) => {
  const reports = await getDirectReports(req.body.userName);
  return res.json({ success: true, directReports: reports });
});

// POST /api/ad/group/members
// دریافت اعضای یک گروه
router.post('/group/members', async (req, res) => {
  const members = await getGroupMembers(req.body.groupName);
  return res.json({ success: true, members });
});
```

**اطلاعات دریافتی از AD**:

- نام نمایشی، نام کاربری، ایمیل
- عنوان شغلی، دپارتمان، شرکت
- شماره تلفن، دفتر، شهر
- مدیر، زیرمجموعه‌ها
- گروه‌های عضویت
- وضعیت حساب (فعال/غیرفعال)

#### 4. **Routes: Config** (`/api/config`)

**وظیفه**: ارسال تنظیمات به Frontend

```javascript
// GET /api/config/servers
// دریافت لیست سرورهای از پیش تعریف شده
router.get('/servers', (req, res) => {
  const servers = [
    process.env.PBI_SERVER_URL_1,
    process.env.PBI_SERVER_URL_2,
    process.env.PBI_SERVER_URL_3
  ].filter(Boolean);
  
  return res.json({ servers });
});
```

### Utils (توابع کمکی)

#### 1. **logger.js** - سیستم لاگینگ

```javascript
const winston = require('winston');

// تنظیمات Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // نوشتن در فایل
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
    // نمایش در کنسول
    new winston.transports.Console()
  ]
});
```

**سطوح Log**:

- `error`: خطاهای مهم
- `warn`: هشدارها
- `info`: اطلاعات عمومی
- `debug`: اطلاعات دیباگ

#### 2. **validateEnv.js** - اعتبارسنجی Environment

```javascript
// بررسی وجود متغیرهای ضروری
const requiredEnvVars = [
  'PBI_USERNAME',
  'PBI_PASSWORD',
  'PBI_DOMAIN',
  'PBI_SERVER_URL_1'
];

function validateEnv() {
  const missing = requiredEnvVars.filter(
    key => !process.env[key]
  );
  
  if (missing.length > 0) {
    throw new Error(
      `متغیرهای محیطی ضروری یافت نشد: ${missing.join(', ')}`
    );
  }
}
```

#### 3. **adHelper.js** - توابع Active Directory

```javascript
// تابع پیدا کردن سلسله مراتب مدیریت
async function getManagerChain(userName) {
  const chain = [];
  let currentUser = await getUserDetails(userName);
  
  // پیمایش تا رسیدن به مدیر ارشد
  while (currentUser.manager) {
    chain.push(currentUser);
    currentUser = await getUserDetails(currentUser.manager);
  }
  
  return chain;
}

// تابع پیدا کردن زیرمجموعه‌ها
async function getDirectReports(userName) {
  const userDN = await getUserDN(userName);
  
  // جستجوی کاربرانی که manager آن‌ها این کاربر است
  const filter = `(manager=${userDN})`;
  return await searchAD(filter);
}
```

### Middleware

#### validation.js - اعتبارسنجی ورودی

```javascript
const Joi = require('joi');

// اسکیما برای تنظیم دسترسی
const setPermissionSchema = Joi.object({
  serverUri: Joi.string().uri().required(),
  itemId: Joi.string().guid().required(),
  userName: Joi.string().required(),
  roles: Joi.array().items(
    Joi.string().valid(
      'Browser',
      'Content Manager',
      'My Reports',
      'Publisher',
      'Report Builder'
    )
  ).min(1).required()
});

// Middleware
function validatePermissions(req, res, next) {
  const { error } = setPermissionSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ 
      error: 'ورودی نامعتبر',
      details: error.details 
    });
  }
  
  next();
}
```

### عملکرد و بهینه‌سازی

**تکنیک‌های بهینه‌سازی Backend**:

1. **Compression**: فشرده‌سازی 60-80% پاسخ‌ها
2. **Connection Pooling**: استفاده مجدد از اتصالات
3. **Caching**: کش کردن نتایج جستجوی AD
4. **Parallel Requests**: فراخوانی‌های موازی با `Promise.all()`
5. **Request Timeout**: قطع خودکار درخواست‌های طولانی

---

## Nginx - وب سرور و Reverse Proxy

### Nginx چیست

**Nginx** (تلفظ: Engine-X) یک وب سرور قدرتمند، سبک و پرسرعت است که می‌تواند به عنوان:

1. **وب سرور**: سرویس‌دهی فایل‌های استاتیک (HTML, CSS, JS, تصاویر)
2. **Reverse Proxy**: واسط بین کاربر و سرور Backend
3. **Load Balancer**: توزیع بار بین چند سرور
4. **Cache Server**: کش کردن محتوا برای سرعت بیشتر

### چرا از Nginx استفاده می‌کنیم

#### مقایسه معماری با و بدون Nginx

**❌ بدون Nginx (مشکل‌دار)**:

```text
مرورگر → Node.js Backend (پورت 5000)
```

**مشکلات**:

- Node.js برای سرویس فایل‌های استاتیک کُند است
- مصرف منابع بالا
- پیچیدگی مدیریت SSL
- عدم امکان Load Balancing

**✅ با Nginx (بهینه)**:

```text
مرورگر → Nginx (پورت 80/443) → Node.js Backend (پورت 5000)
```

**مزایا**:

- سرعت بسیار بالا برای فایل‌های استاتیک
- مصرف منابع کم (Memory Efficient)
- مدیریت آسان SSL/TLS
- قابلیت Load Balancing
- Caching و Compression

### مقایسه عددی عملکرد

| معیار | Node.js مستقیم | با Nginx |
|-------|----------------|----------|
| سرعت سرویس استاتیک | 2,000 req/s | 50,000 req/s |
| مصرف RAM | 200 MB | 10 MB |
| CPU Usage | 60% | 10% |
| زمان پاسخ | 50ms | 5ms |

### پیکربندی Nginx در پروژه

#### 1. **سرویس‌دهی فایل‌های استاتیک**

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    # فایل‌های HTML, CSS, JS
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**توضیح**:

- درخواست‌های فایل استاتیک مستقیماً توسط Nginx پاسخ داده می‌شود
- بدون نیاز به Node.js
- سرعت بسیار بالا

#### 2. **Reverse Proxy برای API**

```nginx
location /api {
    # ارسال درخواست به Backend
    proxy_pass http://powerbi-permissions-manager-backend:5000;
    
    # تنظیم هدرها
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # تنظیم Timeout
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**توضیح**:

- درخواست‌های `/api/*` به Backend هدایت می‌شوند
- اطلاعات IP و هدرهای کاربر حفظ می‌شوند
- مدیریت timeout برای جلوگیری از درخواست‌های معلق

#### 3. **Caching (کش)**

```nginx
# کش فایل‌های استاتیک برای 1 سال
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# بدون کش برای HTML
location / {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**مزایا**:

- کاهش درخواست‌های تکراری به سرور
- بارگذاری سریع‌تر برای کاربر
- کاهش مصرف پهنای باند

#### 4. **Compression (فشرده‌سازی)**

```nginx
# فعال‌سازی Gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
           application/javascript application/xml+rss 
           application/json application/xml;
```

**نتیجه**:

- کاهش 70-80% حجم داده‌ها
- سرعت بیشتر برای کاربران
- کاهش هزینه پهنای باند

#### 5. **Security Headers**

```nginx
# هدرهای امنیتی
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

**محافظت در برابر**:

- Clickjacking
- MIME type sniffing
- XSS attacks

#### 6. **Request Limits**

```nginx
# محدودیت حجم درخواست
client_max_body_size 10M;
```

**اهمیت**: جلوگیری از آپلود فایل‌های بزرگ مخرب

### مزایای استفاده از Nginx در Docker

1. **ایزوله‌سازی**: Frontend و Backend مستقل هستند
2. **مقیاس‌پذیری**: می‌توان Backend را روی چند instance اجرا کرد
3. **امنیت**: Backend مستقیماً در معرض اینترنت نیست
4. **مدیریت آسان**: تغییر پیکربندی بدون تغییر کد

---

## Docker Compose

### Docker چیست

**Docker** یک پلتفرم containerization است که اپلیکیشن و همه وابستگی‌هایش را در یک package مجزا (Container) قرار می‌دهد.

### Container vs Virtual Machine

| ویژگی | Virtual Machine | Docker Container |
|-------|----------------|------------------|
| اندازه | چند GB | چند MB تا GB |
| زمان راه‌اندازی | دقیقه‌ها | ثانیه‌ها |
| مصرف منابع | بالا | کم |
| ایزوله‌سازی | کامل | سطح Process |
| عملکرد | کُندتر | نزدیک به Native |

### Docker Compose چیست

**Docker Compose** ابزاری برای تعریف و اجرای اپلیکیشن‌های چند Container است.

**مزایا**:

- تعریف تمام سرویس‌ها در یک فایل YAML
- راه‌اندازی همه سرویس‌ها با یک دستور
- مدیریت شبکه و ارتباط خودکار بین Container ها

### فایل docker-compose.yml پروژه

```yaml
name: powerbi-permissions-manager

services:
  # سرویس Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: powerbi-permissions-manager-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    env_file:
      - ./backend/.env
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", 
             "http://localhost:5000/health"]
      interval: 20s
      timeout: 5s
      retries: 3
      start_period: 30s

  # سرویس Frontend
  frontend:
    build:
      context: ./frontend-vue
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    container_name: powerbi-permissions-manager-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", 
             "http://localhost"]
      interval: 20s
      timeout: 5s
      retries: 3
      start_period: 30s
```

### توضیح بخش‌های فایل

#### 1. **name** - نام پروژه

```yaml
name: powerbi-permissions-manager
```

همه Container ها با این پیشوند نام‌گذاری می‌شوند.

#### 2. **services**: تعریف سرویس‌ها

**Backend Service**:

```yaml
backend:
  build:
    context: ./backend       # مسیر Dockerfile
    dockerfile: Dockerfile   # نام فایل Dockerfile
```

ساخت Image از فایل Dockerfile در پوشه backend

```yaml
  container_name: powerbi-permissions-manager-backend
```

نام مشخص برای Container (برای دسترسی آسان)

```yaml
  restart: unless-stopped
```

راه‌اندازی خودکار بعد از ریستارت سرور (مگر اینکه دستی متوقف شود)

```yaml
  ports:
    - "5000:5000"
```

**Port Mapping**: پورت 5000 سیستم میزبان → پورت 5000 Container

```yaml
  environment:
    - NODE_ENV=production
    - PORT=5000
```

متغیرهای محیطی که مستقیماً تنظیم می‌شوند

```yaml
  env_file:
    - ./backend/.env
```

بارگذاری متغیرهای محیطی از فایل `.env` (اطلاعات حساس)

```yaml
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", 
           "http://localhost:5000/health"]
    interval: 20s      # هر 20 ثانیه یک بار
    timeout: 5s        # Timeout هر درخواست
    retries: 3         # 3 بار تلاش مجدد
    start_period: 30s  # زمان اولیه برای راه‌اندازی
```

**Health Check**: بررسی سلامت Container

- اگر 3 بار پشت سر هم fail شود، Container را Unhealthy می‌شمارد
- Docker می‌تواند Container را restart کند

**Frontend Service**:

```yaml
frontend:
  depends_on:
    backend:
      condition: service_healthy
```

**وابستگی**: Frontend بعد از healthy شدن Backend راه‌اندازی می‌شود

**دلیل**: Frontend نیاز به Backend دارد، باید Backend آماده باشد

#### 3. **شبکه‌سازی خودکار**

Docker Compose به طور خودکار یک شبکه ایجاد می‌کند:

```text
powerbi-permissions-manager_default
```

**ویژگی‌ها**:

- همه Container ها به این شبکه متصل هستند
- می‌توانند با نام Container با هم ارتباط برقرار کنند
- مثال: `http://powerbi-permissions-manager-backend:5000`

### Dockerfile های پروژه

#### Backend Dockerfile

```dockerfile
# استفاده از Image رسمی Node.js نسخه 18 (سبک Alpine)
FROM node:18-alpine

# نصب dumb-init برای مدیریت صحیح سیگنال‌های سیستمی
RUN apk add --no-cache dumb-init

# ساخت کاربر non-root برای امنیت
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# تنظیم مسیر کاری
WORKDIR /app

# کپی فایل‌های package (برای Layer Caching)
COPY package*.json ./

# نصب dependencies
RUN npm install --production --prefer-offline --no-audit && \
    npm cache clean --force

# کپی کدهای برنامه
COPY --chown=nodejs:nodejs . .

# تغییر به کاربر non-root
USER nodejs

# باز کردن پورت
EXPOSE 5000

# Health Check داخلی
HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# استفاده از dumb-init
ENTRYPOINT ["dumb-init", "--"]

# اجرای برنامه
CMD ["node", "server.js"]
```

**نکات مهم**:

1. **Alpine Image**: خیلی سبک (چند ده MB)
2. **Multi-stage Build نیست**: چون production dependencies نیاز داریم
3. **Non-root User**: امنیت بالاتر
4. **Layer Caching**: کپی package.json قبل از کد برای سرعت build

#### Frontend Dockerfile (Multi-stage)

```dockerfile
# مرحله 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# نصب dependencies
COPY package*.json ./
RUN npm install --prefer-offline --no-audit && \
    npm cache clean --force

# کپی کد و Build
COPY . .
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN npm run build

# مرحله 2: Production
FROM nginx:alpine

# نصب wget برای Health Check
RUN apk add --no-cache wget

# کپی فایل‌های Build شده
COPY --from=build /app/dist /usr/share/nginx/html

# کپی تنظیمات Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ایجاد endpoint برای Health Check
RUN echo '<!DOCTYPE html><html><body>OK</body></html>' > /usr/share/nginx/html/health

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**مزایای Multi-stage Build**:

1. **حجم کوچک**: فقط فایل‌های Build شده کپی می‌شوند (نه node_modules)
2. **امنیت**: کد منبع در Image نهایی نیست
3. **سرعت**: Image نهایی خیلی سبک‌تر است

**مقایسه حجم**:

- بدون Multi-stage: ~500 MB
- با Multi-stage: ~50 MB

### دستورات Docker Compose

#### راه‌اندازی

```bash
# ساخت و اجرا (Detached mode)
docker compose up -d --build

# یا استفاده از اسکریپت خودکار
./rebuild-and-run.sh
```

#### مشاهده وضعیت Container ها

```bash
# لیست Container های در حال اجرا
docker compose ps

# مشاهده لاگ‌ها
docker compose logs -f

# لاگ فقط Backend
docker compose logs -f backend
```

#### متوقف کردن

```bash
# متوقف کردن (حفظ Container ها)
docker compose stop

# متوقف و حذف Container ها
docker compose down

# حذف همراه با Volume ها
docker compose down -v
```

#### راه‌اندازی مجدد

```bash
# راه‌اندازی مجدد یک سرویس
docker compose restart backend

# راه‌اندازی مجدد همه
docker compose restart
```

---

## فایل‌های مهم پروژه

### 1. **فایل‌های پیکربندی**

#### `.env` (Backend)

**مسیر**: `backend/.env`

```env
# تنظیمات سرور
PORT=5000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=http://localhost:80,http://localhost

# اطلاعات Power BI (امن - محرمانه!)
PBI_USERNAME=DOMAIN\username
PBI_PASSWORD=secure_password
PBI_DOMAIN=DOMAIN
PBI_USER=username

# آدرس سرورهای Power BI
PBI_SERVER_URL_1=https://pbi1.company.com/Power_BI
PBI_SERVER_URL_2=https://pbi2.company.com/Power_BI
PBI_SERVER_URL_3=https://pbi3.company.com/Power_BI

# Active Directory
LDAP_URL=ldap://dc.company.com
LDAP_BIND_DN=CN=Service,OU=Users,DC=company,DC=com
LDAP_BIND_PASSWORD=secure_password
LDAP_SEARCH_BASE=DC=company,DC=com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**اهمیت**:

- نگهداری امن تمام اطلاعات حساس
- جداسازی تنظیمات از کد
- تغییر آسان بدون تغییر کد

**امنیت**:

- ❌ **هرگز** در Git commit نکنید
- ✅ در `.gitignore` قرار دارد
- ✅ فقط در سرور نگهداری شود

### 2. **فایل‌های اسکریپت**

#### `rebuild-and-run.sh` (Linux/Mac)

```bash
#!/bin/bash

echo "🔄 Stopping existing containers..."
docker compose down

echo "🔨 Building Docker images..."
if [ "$1" = "--clean" ]; then
  echo "🧹 Clean build (no cache)..."
  docker compose build --no-cache
else
  echo "⚡ Fast build (with cache)..."
  docker compose build
fi

echo "🚀 Starting containers..."
docker compose up -d

echo "✅ Done! Application is running."
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📋 View logs:"
echo "   docker compose logs -f"
```

**کاربرد**: اتوماسیون فرآیند rebuild و راه‌اندازی

**استفاده**:

```bash
# Build سریع (با cache)
./rebuild-and-run.sh

# Build کامل (بدون cache)
./rebuild-and-run.sh --clean
```

#### `rebuild-and-run.bat` (Windows)

همان قابلیت برای Windows:

```batch
@echo off
echo Stopping existing containers...
docker compose down

if "%1"=="--clean" (
  echo Clean build...
  docker compose build --no-cache
) else (
  echo Fast build...
  docker compose build
)

echo Starting containers...
docker compose up -d

echo Done!
echo Frontend: http://localhost
echo Backend:  http://localhost:5000
```

### 3. **فایل‌های مستندات**

#### `README.md`

**محتوا**:

- معرفی پروژه و ویژگی‌ها
- راهنمای نصب و راه‌اندازی
- مستندات API
- راهنمای استفاده
- Troubleshooting

**مخاطب**: توسعه‌دهندگان و کاربران تکنیکال

#### `CHANGELOG.md`

**محتوا**:

- تاریخچه تغییرات نسخه‌ها
- ویژگی‌های جدید
- رفع باگ‌ها
- بهبودها

**فرمت**: Keep a Changelog standard

**نمونه**:

```markdown
## [2.0.0] - 2025-11-08

### Added
- Enhanced Active Directory integration
- User details modal with org chart
- Group members viewer

### Fixed
- Circular manager reference bug
```

#### `LICENSE`

**نوع**: MIT License

**معنی**:

- استفاده آزاد در پروژه‌های شخصی و تجاری
- بدون محدودیت
- بدون مسئولیت قانونی

### 4. **فایل‌های Git**

#### `.gitignore`

```gitignore
# Node modules
node_modules/
npm-debug.log*

# Environment files (حساس!)
.env
.env.local
.env.production

# Logs
logs/
*.log

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Docker
*.pid
```

**اهمیت**: جلوگیری از commit فایل‌های غیرضروری و حساس

#### `.gitattributes`

```gitattributes
# Auto detect text files
* text=auto

# Documents
*.md text
*.txt text

# Scripts
*.sh text eol=lf
*.bat text eol=crlf

# Source code
*.js text eol=lf
*.vue text eol=lf
*.json text eol=lf
```

**اهمیت**: همسان‌سازی Line Endings بین Windows و Linux

### 5. **فایل‌های Package**

#### `package.json` (Backend)

```json
{
  "name": "powerbi-permissions-manager-backend",
  "version": "2.0.0",
  "description": "Backend API for Power BI Permissions Manager",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    ...
  }
}
```

**بخش‌های مهم**:

- `version`: نسخه فعلی
- `scripts`: دستورات npm
- `dependencies`: پکیج‌های مورد نیاز

#### `package.json` (Frontend)

```json
{
  "name": "powerbi-permissions-manager-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "axios": "^1.6.0"
  }
}
```

**تفاوت**:

- `type: "module"`: استفاده از ES Modules
- `vite`: Build tool مدرن و سریع

---

## راهنمای استقرار در شرکت

### الزامات

#### سخت‌افزار

**حداقل**:

- CPU: 2 Core
- RAM: 4 GB
- Disk: 20 GB
- Network: 100 Mbps

**توصیه شده**:

- CPU: 4 Core
- RAM: 8 GB
- Disk: 50 GB SSD
- Network: 1 Gbps

#### نرم‌افزار

- **سیستم‌عامل**: Linux (Ubuntu 20.04+, CentOS 8+), Windows Server 2019+
- **Docker**: نسخه 20.10+
- **Docker Compose**: نسخه 2.0+
- **دسترسی شبکه**:
  - به Power BI Report Server
  - به Active Directory (LDAP)
  - پورت 80 (HTTP) یا 443 (HTTPS)

### مراحل نصب در شرکت

#### مرحله 1: آماده‌سازی سرور

```bash
# بروزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# نصب Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# تست نصب
docker --version
docker-compose --version
```

#### مرحله 2: کپی پروژه

```bash
# کپی پروژه به سرور
cd /opt
sudo mkdir powerbi-permissions-manager
sudo chown $USER:$USER powerbi-permissions-manager
cd powerbi-permissions-manager

# کپی فایل‌ها (از Git یا دستی)
# گزینه 1: از Git
git clone <repository-url> .

# گزینه 2: آپلود دستی با scp
scp -r /local/path/* user@server:/opt/powerbi-permissions-manager/
```

#### مرحله 3: پیکربندی

```bash
# کپی فایل نمونه
cd backend
cp env.example .env

# ویرایش تنظیمات
nano .env
```

**تنظیمات شرکت**:

```env
# اطلاعات Power BI شرکت
PBI_USERNAME=COMPANY\pbi_service_account
PBI_PASSWORD=SecurePassword123!
PBI_DOMAIN=COMPANY
PBI_USER=pbi_service_account

# سرورهای Power BI شرکت
PBI_SERVER_URL_1=https://pbi-prod.company.local/Power_BI
PBI_SERVER_URL_2=https://pbi-dev.company.local/Power_BI
PBI_SERVER_URL_3=https://pbi-test.company.local/Power_BI

# Active Directory شرکت
LDAP_URL=ldap://dc1.company.local
LDAP_BIND_DN=CN=LDAP Service,OU=Service Accounts,DC=company,DC=local
LDAP_BIND_PASSWORD=LDAPPassword456!
LDAP_SEARCH_BASE=DC=company,DC=local

# CORS برای دامنه شرکت
ALLOWED_ORIGINS=https://pbi-manager.company.com,http://pbi-manager.company.local
```

#### مرحله 4: تنظیم Firewall

```bash
# باز کردن پورت 80 (HTTP)
sudo ufw allow 80/tcp

# باز کردن پورت 443 (HTTPS)
sudo ufw allow 443/tcp

# بررسی وضعیت
sudo ufw status
```

#### مرحله 5: راه‌اندازی

```bash
# اجرای اپلیکیشن
cd /opt/powerbi-permissions-manager
./rebuild-and-run.sh

# مشاهده لاگ‌ها
docker compose logs -f
```

#### مرحله 6: تست

```bash
# تست Backend
curl http://localhost:5000/health

# تست Frontend
curl http://localhost

# باز کردن در مرورگر
# http://server-ip
```

### تنظیم HTTPS (SSL/TLS)

#### گزینه 1: استفاده از Nginx خارجی (توصیه شده)

```nginx
# فایل: /etc/nginx/sites-available/pbi-manager
server {
    listen 443 ssl http2;
    server_name pbi-manager.company.com;

    # گواهی SSL شرکت
    ssl_certificate /etc/ssl/certs/company.crt;
    ssl_certificate_key /etc/ssl/private/company.key;
    
    # تنظیمات امنیتی SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Proxy به Docker
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name pbi-manager.company.com;
    return 301 https://$server_name$request_uri;
}
```

```bash
# فعال‌سازی
sudo ln -s /etc/nginx/sites-available/pbi-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### گزینه 2: استفاده از Let's Encrypt (رایگان)

```bash
# نصب Certbot
sudo apt install certbot python3-certbot-nginx

# دریافت گواهی
sudo certbot --nginx -d pbi-manager.company.com

# تمدید خودکار
sudo certbot renew --dry-run
```

### مانیتورینگ و نگهداری

#### مشاهده وضعیت سیستم

```bash
# وضعیت Container ها
docker compose ps

# مصرف منابع
docker stats

# لاگ‌های اخیر
docker compose logs --tail=100

# لاگ‌های خطا
docker compose logs --tail=50 | grep -i error
```

#### Backup

```bash
# فایل مهم برای Backup: backend/.env

# اسکریپت Backup
#!/bin/bash
BACKUP_DIR="/backup/pbi-manager"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /opt/powerbi-permissions-manager/backend/.env \
   $BACKUP_DIR/env_backup_$DATE

echo "Backup completed: $BACKUP_DIR/env_backup_$DATE"
```

#### بروزرسانی سیستم

```bash
# دریافت نسخه جدید
cd /opt/powerbi-permissions-manager
git pull

# Rebuild و راه‌اندازی
./rebuild-and-run.sh --clean

# یا بدون clean (سریع‌تر)
./rebuild-and-run.sh
```

#### راه‌اندازی خودکار بعد از Reboot

```bash
# ایجاد Systemd Service
sudo nano /etc/systemd/system/pbi-manager.service
```

```ini
[Unit]
Description=Power BI Permissions Manager
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/powerbi-permissions-manager
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down

[Install]
WantedBy=multi-user.target
```

```bash
# فعال‌سازی
sudo systemctl daemon-reload
sudo systemctl enable pbi-manager
sudo systemctl start pbi-manager

# بررسی وضعیت
sudo systemctl status pbi-manager
```

### رفع مشکلات رایج

#### مشکل 1: عدم اتصال به Power BI

**علت‌های احتمالی**:

- اطلاعات احراز هویت اشتباه
- عدم دسترسی شبکه به PBI Server
- Firewall مسدود کننده

**راه حل**:

```bash
# تست دسترسی شبکه
curl -I https://pbi-server.company.com/Power_BI

# بررسی لاگ Backend
docker compose logs backend | grep -i "pbi\|ntlm\|auth"

# تست credentials با PowerShell
Test-NetConnection pbi-server.company.com -Port 443
```

#### مشکل 2: عدم اتصال به Active Directory

**علت‌های احتمالی**:

- آدرس LDAP اشتباه
- اطلاعات Bind اشتباه
- پورت 389 بسته

**راه حل**:

```bash
# تست اتصال LDAP
telnet dc.company.local 389

# یا با ldapsearch (نصب ldap-utils)
ldapsearch -x -H ldap://dc.company.local \
  -D "CN=Service,DC=company,DC=local" \
  -w "password" \
  -b "DC=company,DC=local" "(sAMAccountName=*)" cn

# بررسی لاگ
docker compose logs backend | grep -i "ldap"
```

#### مشکل 3: Container راه‌اندازی نمی‌شود

**علت‌های احتمالی**:

- پورت اشغال
- خطا در Dockerfile
- مشکل Docker

**راه حل**:

```bash
# بررسی پورت‌های اشغال
sudo netstat -tlnp | grep -E '80|5000'

# حذف Container های قدیمی
docker compose down
docker system prune -a

# Build مجدد
docker compose build --no-cache
docker compose up -d
```

#### مشکل 4: عملکرد کُند

**علت‌های احتمالی**:

- مصرف بالای CPU/RAM
- شبکه کُند
- حجم بالای لاگ

**راه حل**:

```bash
# بررسی مصرف منابع
docker stats

# پاکسازی لاگ‌ها
docker compose logs --tail=0 > /dev/null

# بررسی Disk Space
df -h
docker system df

# پاکسازی Volume های غیرضروری
docker volume prune
```

### امنیت در محیط Production

#### Checklist امنیتی

- [ ] فایل `.env` فقط توسط root قابل خواندن است

```bash
chmod 600 backend/.env
```

- [ ] HTTPS فعال است (SSL/TLS)
- [ ] Firewall تنظیم شده (فقط پورت‌های ضروری باز)
- [ ] Rate Limiting فعال است
- [ ] لاگ‌ها به صورت منظم بررسی می‌شوند
- [ ] Backup منظم از `.env` گرفته می‌شود
- [ ] Docker images به‌روز هستند

```bash
docker compose pull
docker compose up -d
```

- [ ] CORS فقط دامنه‌های مجاز را می‌پذیرد
- [ ] اطلاعات LDAP از حساب Service استفاده می‌کند (نه Admin)

---

## خلاصه فنی برای ارائه

### معماری (Architecture)

**Stack**:

- Frontend: Vue 3 + Vite
- Backend: Node.js + Express
- Proxy: Nginx
- Container: Docker + Docker Compose
- Authentication: NTLM (Power BI) + LDAP (AD)

**مزایای معماری**:

- مقیاس‌پذیر (Scalable)
- قابل نگهداری (Maintainable)
- ایمن (Secure)
- سریع (High Performance)

### ویژگی‌های کلیدی پروژه

1. **مدیریت دسترسی Power BI**
   - مرور درختی گزارش‌ها
   - تخصیص دسترسی دسته‌جمعی
   - 5 نقش مختلف

2. **یکپارچه‌سازی Active Directory**
   - جستجوی کاربران و گروه‌ها
   - نمایش ساختار سازمانی
   - اطلاعات تماس و دپارتمان

3. **رابط کاربری مدرن**
   - سه تِم (روشن/تاریک/سیستم)
   - دو زبانه (انگلیسی/فارسی با RTL)
   - طراحی Responsive

4. **استقرار آسان**
   - Docker Compose با یک دستور
   - اسکریپت‌های اتوماسیون
   - پیکربندی ساده

### مزایا برای شرکت

✅ **کاهش زمان**: مدیریت دسترسی‌ها از ساعت‌ها به دقایق  
✅ **امنیت بالا**: رعایت بهترین شیوه‌های امنیتی  
✅ **یکپارچگی**: اتصال به زیرساخت‌های موجود (PBI + AD)  
✅ **مقیاس‌پذیری**: قابل گسترش برای هزاران کاربر  
✅ **کم‌هزینه**: استفاده از تکنولوژی‌های Open Source  
✅ **نگهداری آسان**: معماری مدرن و مستند  

### آمار فنی

| معیار | مقدار |
|-------|-------|
| تعداد کل فایل‌های کد | ~50 |
| خطوط کد Frontend | ~3,000 |
| خطوط کد Backend | ~2,500 |
| تعداد API Endpoint | 15+ |
| حجم Image ها (Docker) | ~200 MB |
| زمان بیلد | ~2 دقیقه |
| زمان راه‌اندازی | ~30 ثانیه |
| پشتیبانی از کاربر همزمان | 100+ |

---

## نتیجه‌گیری

این پروژه یک سیستم جامع برای مدیریت دسترسی‌های Power BI است که:

- از تکنولوژی‌های مدرن و محبوب استفاده می‌کند
- امنیت را در اولویت قرار داده
- عملکرد بالایی دارد
- راحت قابل نگهداری و توسعه است
- با استانداردهای صنعت سازگار است

### تکنولوژی‌های کلیدی و دلیل انتخاب

1. **Vue 3**: سبک، سریع، مدرن
2. **Node.js + Express**: استاندارد، قدرتمند، غنی از پکیج
3. **Docker**: استقرار آسان، ایزوله، قابل حمل
4. **Nginx**: سریع‌ترین وب سرور، مصرف منابع کم
5. **NTLM + LDAP**: استانداردهای امنیتی Windows

### مناسب برای

✅ شرکت‌های با Power BI Report Server  
✅ سازمان‌های با Active Directory  
✅ تیم‌های نیازمند مدیریت متمرکز دسترسی  
✅ محیط‌های enterprise با نیاز امنیتی بالا  

---

**نسخه**: 2.0.0  
**تاریخ**: نوامبر 2025  
**وضعیت**: آماده برای استقرار در محیط تولید  
**لایسنس**: MIT  

---

## پیوست - دستورات سریع

### راه‌اندازی اولیه

```bash
cd /opt/powerbi-permissions-manager
cp backend/env.example backend/.env
nano backend/.env  # ویرایش تنظیمات
./rebuild-and-run.sh
```

### عملیات روزانه

```bash
# مشاهده وضعیت
docker compose ps

# مشاهده لاگ
docker compose logs -f

# راه‌اندازی مجدد
docker compose restart

# متوقف کردن
docker compose down
```

### بروزرسانی سریع

```bash
git pull
./rebuild-and-run.sh --clean
```

### پاکسازی

```bash
docker compose down
docker system prune -a
docker volume prune
```

---

## پایان مستندات
