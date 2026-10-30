> **English Edition Notice:** The complete, 1:1 matching English version of this Architecture & Developer Modification Map is available at **[`docs/en/ARCHITECTURE.md`](../en/ARCHITECTURE.md)**. | **[Main English README](../../README.en.md)**

# خريطة هيكلة المشروع ودليل المطوّر للتعديل والإضافة

يقدّم هذا المستند الخريطة الهندسية الكاملة لمستودع **مستقبلات (Mustaqbalat)**، ويوضح وظيفة كل مجلد وملف، وكيفية اتصال الوحدات ببعضها عبر التخزين والرسائل، والدليل العملي الدقيق لأي مطوّر يرغب في تعديل ميزة قائمة أو إضافة ميزة جديدة دون كسر أي جزء من النظام.

---

## 1. شجرة ملفات ومجلدات المشروع الكاملة

```text
Mustaqbalat/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug-report.md                  # قالب الإبلاغ عن الأخطاء التقنية في GitHub
│   │   └── incompatible-site.md           # قالب الإبلاغ عن المواقع غير المتوافقة مع التعتيم
│   ├── workflows/
│   │   └── pages.yml                      # مسار الفحص الآلي والنشر المباشر على GitHub Pages (مشروح سطراً بسطر)
│   └── PULL_REQUEST_TEMPLATE.md           # قالب طلبات السحب وفحص التوافق قبل الدمج
│
├── assets/
│   └── sponsors/
│       ├── murtakiz-logo.svg              # الشعار الرسمي للراعي المجتمعي (مجتمع مرتكز) قابل للتخصيص
│       └── qabilah-logo.svg               # شعار التواصل عبر منصة قبيلة قابل للاستبدال المباشر
│
├── converter/                             # محرك تحويل الأداة إلى إضافات ويب بدون مساحة تخزين
│   ├── web-addon-converter.js             # المحوّل البرمجي في الذاكرة (Bookmarklet + Userscript + PKZIP)
│   └── web-widget-runtime.js              # لوحة التحكم العائمة المعزولة (Shadow DOM) للإضافات الفورية
│
├── docs/                                  # التوثيق المعياري ثنائي اللغة (متطابق 1:1 بين العربية والإنجليزية)
│   ├── ar/
│   │   ├── ARCHITECTURE.md                # خريطة الهيكلة ودليل المطوّر للتعديل (هذا الملف)
│   │   ├── COMMUNITY_AND_CONTACT.md       # الرعاية المجتمعية على مرتكز والتواصل عبر قبيلة والبريد
│   │   ├── HOW_IT_WAS_BUILT.md            # المرجع الهندسي المكتوب لكيفية صناعة البرنامج
│   │   ├── JSON_CONFIGS_LINE_BY_LINE.md   # الشرح التفصيلي سطراً بسطر لكافة ملفات JSON
│   │   └── USER_GUIDE.md                  # دليل الاستخدام التفصيلي لكافة الأوضاع والأدوات
│   └── en/
│       ├── ARCHITECTURE.md                # النسخة الإنجليزية المطابقة لخريطة الهيكلة ودليل المطوّر
│       ├── COMMUNITY_AND_CONTACT.md       # النسخة الإنجليزية المطابقة للرعاية المجتمعية والتواصل
│       ├── HOW_IT_WAS_BUILT.md            # النسخة الإنجليزية المطابقة لكيفية صناعة البرنامج
│       ├── JSON_CONFIGS_LINE_BY_LINE.md   # النسخة الإنجليزية المطابقة لشرح ملفات JSON سطراً بسطر
│       └── USER_GUIDE.md                  # النسخة الإنجليزية المطابقة لدليل الاستخدام
│
├── extension/                             # حزمة إضافة المتصفح الرسمية (Manifest V3)
│   ├── _locales/
│   │   └── ar/
│   │       └── messages.json              # نصوص التعريب الرسمية لمتصفحات Chromium وFirefox
│   ├── background/
│   │   └── service-worker.js              # عامل الخدمة الخلفي: التهيئة، الشارة، السجل الزمني، وفحص الروابط
│   ├── core/
│   │   └── mustaqbalat-engine.js          # المحرك البصري الأساسي (السطوع، الطبقات، الداكن، PDF، HEX، HUD)
│   ├── icons/
│   │   ├── icon16.png                     # أيقونة شريط المتصفح (16×16)
│   │   ├── icon32.png                     # أيقونة الترويسة والشاشات عالية الكثافة (32×32)
│   │   ├── icon48.png                     # أيقونة صفحة إدارة الإضافات (48×48)
│   │   └── icon128.png                    # أيقونة متجر الإضافات والتثبيت (128×128)
│   ├── pages/
│   │   ├── dashboard.html                 # واجهة لوحة إحصائيات الاستهلاك للأيام والأسابيع
│   │   ├── dashboard.js                   # منطق تجميع ورسم المخططات البيانية وتصدير السجل
│   │   ├── pdf-viewer.html                # واجهة قارئ ومعتّم ملفات PDF المحلي في الذاكرة (RAM)
│   │   └── pdf-viewer.js                  # منطق قراءة ملفات PDF بالسحب والإفلات وتطبيق الطبقات
│   ├── popup/
│   │   ├── popup.css                      # تنسيقات نافذة الإضافة المنبثقة ذات التبويبات الأربعة
│   │   ├── popup.html                     # هيكل نافذة الإضافة المنبثقة (التحكم، الألوان، الاستهلاك، GitHub)
│   │   └── popup.js                       # متحكم النافذة المنبثقة وعجلة الألوان والرسوم وبلاغات GitHub
│   └── manifest.json                      # ملف تعريف الإضافة القياسي (Manifest V3)
│
├── scripts/
│   └── validate-and-convert.js            # أداة الفحص الآلي للقواعد النحوية وسلامة الحزمة والمحوّل (npm test)
│
├── index.html                             # المنصة التفاعلية الحية وواجهة محوّل إضافات الويب
├── studio.js                              # جسر التزامن بين محاكي الإضافة والصفحة وأزرار التحويل
├── server.js                              # خادم المعاينة المحلي الخالي من أي مكتبات خارجية (0.0.0.0:3000)
├── manifest.webmanifest                   # تعريف تطبيق الويب التقدمي (PWA) للتشغيل بدون مساحة تخزين
├── package.json                           # تعريف أوامر التشغيل والاختبار (0 اعتماديات خارجية)
├── README.md                              # الوثيقة الرئيسية للمشروع باللغة العربية
├── README.en.md                           # الوثيقة الرئيسية المطابقة باللغة الإنجليزية
├── CONTRIBUTING.md                        # دليل المساهمة التفصيلي باللغة العربية
├── CONTRIBUTING.en.md                     # دليل المساهمة المطابق باللغة الإنجليزية
├── SECURITY.md                            # سياسة الأمان والخصوصية باللغة العربية
├── SECURITY.en.md                         # سياسة الأمان والخصوصية المطابقة باللغة الإنجليزية
├── CODE_OF_CONDUCT.md                     # ميثاق السلوك المهني للمجتمع باللغة العربية
├── CODE_OF_CONDUCT.en.md                  # ميثاق السلوك المهني المطابق باللغة الإنجليزية
├── CHANGELOG.md                           # سجل الإصدارات والتغييرات التقنية باللغة العربية
├── CHANGELOG.en.md                        # سجل الإصدارات المطابق باللغة الإنجليزية
└── LICENSE                                # رخصة المصدر المفتوح (MIT License)
```

---

## 2. الأدوات والتقنيات المستخدمة (بدون مكتبات خارجية)

| المجال التقني | التقنية / الأداة المستخدمة | سبب الاختيار الهندسي |
| :--- | :--- | :--- |
| معمارية الإضافة | `WebExtensions Manifest V3` | التوافق مع أحدث معايير Chrome وEdge وBrave وFirefox واستبدال الصفحات الخلفية الدائمة بعامل خدمة خامل (`Service Worker`). |
| لغة البرمجة | `Vanilla JavaScript (ES2020+)` | تنفيذ مباشر في المتصفح بدون مترجمات أو حزم `node_modules`، مع دعم العزل عبر `IIFE`. |
| المعالجة البصرية | `GPU CSS Filters` + `Fixed Viewport Layers` + `mix-blend-mode` | تحقيق زمن تطبيق أقل من `0.3 ms` ومعدل `60 FPS` ثابت ودعم تقليل وزيادة السطوع معاً. |
| عزل إضافات الويب | `Shadow DOM (attachShadow)` | منع تعارض تنسيقات لوحة التحكم العائمة مع قواعد CSS للمواقع الخارجية في وضعي `Bookmarklet` و`Userscript`. |
| الرسوم وعجلة الألوان | `HTML5 2D Canvas API` | رسم عجلة الألوان القطبية والمخططات الزمنية للأيام والأسابيع بصفر كيلوبايت من المكتبات الخارجية. |
| تجميع الحزم بالذاكرة | `Uint8Array` + `DataView` + `CRC-32 (PKZIP)` | توليد ملفات `.zip` قياسية صالحة للتثبيت داخل `RAM` دون استيراد `JSZip`. |
| الخادم والفحص الآلي | `Node.js` (`http`, `fs`, `path`, `vm`) | تشغيل بيئة المعاينة (`npm start`) والتحقق النحوي الكامل (`npm test`) بدون تنزيل أي حزمة خارجية. |

---

## 3. خريطة الترابط وتدفق البيانات بين الملفات

تتواصل جميع ملفات المشروع عبر **3 مفاتيح تخزين موحدة** و**5 قنوات رسائل محددة**:

### أ. مفاتيح التخزين المشتركة (`chrome.storage.local` / `localStorage`)
1. `mustaqbalat_settings_v1`: يحمل الكائن الكامل لإعدادات السطوع، الطبقة، الآلية، الوضع الداكن، إعدادات PDF، ألوان `HEX`، زاوية المؤشر الحي، مستودع GitHub، ومصفوفة المواقع المستثناة `excludedSites`.
   - **يكتب فيه:** `popup.js`، `service-worker.js` (عند التثبيت الأول أو اختصار لوحة المفاتيح)، `mustaqbalat-engine.js` (عند طي المؤشر الحي)، و`web-widget-runtime.js`.
   - **يقرأ منه ويستمع لتغيره لحظياً:** `mustaqbalat-engine.js`، `service-worker.js`، `pdf-viewer.js`، و`popup.js`.
2. `mustaqbalat_usage_v1`: فهرس يومي بصيغة `{ "YYYY-MM-DD": { activeMinutes, darkMinutes, hexTintMinutes, pagesCount, pdfCount, avgFootprintKB, peakFootprintKB, totalApplyCpuMs } }`.
   - **يكتب فيه:** `service-worker.js` و`mustaqbalat-engine.js`.
   - **يقرأ منه:** `popup.js` (للمخطط المصغر) و`dashboard.js` (للمخططات التفصيلية وتصدير JSON).
3. `mustaqbalat_broken_sites_v1`: مصفوفة المواقع التي سجل المستخدم عدم توافقها محلياً (بحد أقصى 100 سجل).
   - **يكتب ويقرأ منه:** `popup.js`.

### ب. قنوات الرسائل الحية بين الوحدات
1. `MUSTAQBALAT_GET_TELEMETRY` (من `popup.js` إلى `mustaqbalat-engine.js` عبر `chrome.tabs.sendMessage`): يجلب القياسات اللحظية للتبويب المفتوح (`extensionFootprintKB`, `lastApplyMs`, `fps`, `domNodes`, `isPdf`).
2. `MUSTAQBALAT_UPDATE_SETTINGS` (من `popup.js` إلى `mustaqbalat-engine.js`): يطبق تعديلاً جزئياً فورياً ويعيد القياسات المحدثة في نفس الرد.
3. `MUSTAQBALAT_USAGE_DELTA` (من `mustaqbalat-engine.js` إلى `service-worker.js` عبر `chrome.runtime.sendMessage`): يرسل حصيلة النشاط كل 60 ثانية لحفظها مركزياً في السجل اليومي.
4. `MUSTAQBALAT_CHECK_URL_SUPPORT` (من `popup.js` إلى `service-worker.js`): يتحقق مما إذا كان رابط التبويب مقيداً أمنياً من المتصفح (`chrome://`, `edge://`, `about:`, إلخ).
5. `MUSTAQBALAT_STUDIO_SYNC` (من `popup.js` داخل `<iframe>` إلى `studio.js` في `index.html` عبر `window.postMessage`): يزامن محاكي الويب الحي مع الصفحة الأم لحظياً.

---

## 4. دليل المطوّر العملي: أين تعدّل أو تضيف أي ميزة؟

يوضح الجدول الإرشادي التالي الملفات والدوال الدقيقة التي يجب التعامل معها عند الرغبة في إجراء أي تطوير أو إضافة ميزة جديدة:

### الحالة 1: إضافة خاصية بصرية جديدة (مثلاً: فلتر حدة النص أو شريط تحكم جديد)
1. **في المحرك الأساسي (`extension/core/mustaqbalat-engine.js`):**
   - أضف المفتاح الافتراضي الجديد داخل الكائن `DEFAULT_SETTINGS`.
   - طبّق تأثيره داخل الدالة `applyVisualSettings(reason)` (إما بإضافته لمصفوفة `filters` أو بتعديل خصائص الطبقات في `buildDynamicCss()`).
2. **في النافذة المنبثقة (`extension/popup/`):**
   - أضف عنصر الإدخال (`<input>` أو `<select>`) في التبويب المناسب داخل `extension/popup/popup.html`.
   - أضف نفس المفتاح الافتراضي في `DEFAULT_SETTINGS` داخل `extension/popup/popup.js`، ثم اربط عرضه في `populateControlsFromSettings()`، واربط حدث تغييره (`input` أو `change`) باستدعاء `updateAndSave({ yourNewKey: value })` داخل `bindEvents()`.
3. **في النسخة العائمة للمحوّل السحابي (اختياري لتوحيد المزايا):**
   - إذا أردت ظهور الشريط الجديد أيضاً في نسخة الـ `Bookmarklet` والـ `Userscript`، أضفه إلى `DEFAULT_CFG` و`renderControls()` داخل `converter/web-widget-runtime.js`.

### الحالة 2: إضافة نمط وضع داكن جديد (Dark Mode Profile)
1. افتح `extension/core/mustaqbalat-engine.js` وانتقل إلى الدالة `buildDarkModeCss(mode, settings)`، ثم أضف فرع `else if (mode === "your-mode")` مع قواعد الانعكاس اللوني واستثناء الصور المناسبة.
2. أضف خيار `<option value="your-mode">` داخل القائمة `#darkModeSelect` في `extension/popup/popup.html`.

### الحالة 3: إضافة لوحة لونية طبية جاهزة جديدة (Color Swatch Preset)
1. افتح `extension/popup/popup.js` وعدّل مصفوفة `PRESET_PALETTES` بإضافة كائن جديد بالصيغة:
   `{ id: "custom", name: "الاسم بالعربية", hex: "#RRGGBB", opacity: 18, blend: "multiply" }`.
2. عدّل عدد أعمدة الشبكة `.swatches-grid` في `extension/popup/popup.css` إذا تجاوز العدد 8 أزرار في الصف الواحد (أو اتركها تلتف لصف ثانٍ تلقائياً).

### الحالة 4: إصلاح توافق موقع إلكتروني محدد يرفض التعتيم أو يتعارض مع الوضع الداكن
1. افتح `extension/core/mustaqbalat-engine.js` وافحص `getCurrentHostname()`.
2. يمكنك إما ضبط قيم مخصصة لهذا النطاق داخل `settings.siteOverrides[host]` في دالة `getEffectiveSettings()`، أو إضافة محدد استثناء خاص بعناصر الموقع المتعارضة داخل `buildDarkModeCss()`.

### الحالة 5: إضافة مقياس جديد في لوحة استهلاك الأيام والأسابيع
1. سجّل المقياس اليومي داخل دالة `flushUsageDelta()` في `extension/core/mustaqbalat-engine.js` ودالة `recordDailyUsageDelta()` في `extension/background/service-worker.js`.
2. حدّث دالة التجميع `buildSeries(history)` وجدول العرض في `extension/pages/dashboard.js` مع إضافة عمود أو بطاقة مقابلة في `extension/pages/dashboard.html`.

### الحالة 6: إضافة ملف جديد داخل حزمة الإضافة (`extension/`)
1. أنشئ الملف داخل المجلد الفرعي المناسب في `extension/`.
2. إذا كان الملف صفحة أو مورداً يحتاج المحوّل السحابي لتضمينه عند توليد ملف `.zip` في الذاكرة، أضف مساره إلى القائمة التي يقرؤها التابع `buildExtensionZipBlob()` داخل `converter/web-addon-converter.js`.
3. شغّل `npm test` للتأكد من اجتياز فحص `scripts/validate-and-convert.js` لكافة الملفات والمسارات.
