/**
 * Mustaqbalat — Automated Extension Validator & Zero-Space Converter Test Suite
 * Verifies Manifest V3 compliance, syntax of all JS modules, locale presence,
 * icon integrity, and Bookmarklet/Userscript conversion.
 */
// يستورد وحدة نظام الملفات القياسية في Node.js لفحص وجود ملفات الإضافة وقراءة محتوياتها أثناء الاختبار الآلي.
const fs = require("fs");
// يستورد وحدة المسارات لبناء المسارات المطلقة لجميع مكونات المشروع انطلاقاً من موقع هذا السكربت في scripts/.
const path = require("path");
// يستورد وحدة الآلة الافتراضية المدمجة في Node.js للتحقق من سلامة الصياغة البرمجية لكل ملف جافاسكربت وتشغيل المحوّل في بيئة معزولة.
const vm = require("vm");

// يحسب المسار المطلق لجذر المستودع بالرجوع مستوى واحداً للأعلى من مجلد scripts/ الحالي ليكون مرجع الفحص الشامل.
const ROOT = path.resolve(__dirname, "..");

// يعرّف دالة التحقق الصارمة التي تقبل شرطاً منطقياً ورسالة وصفية لطباعة نجاح الفحص أو إيقاف البناء عند أي خلل.
function assert(cond, msg) {
  // يفحص ما إذا كان الشرط الممرر للدالة غير متحقق لإعلان الفشل الفوري.
  if (!cond) {
    // يطبع رسالة الخطأ المفصلة في مخرج الأخطاء القياسي لتحديد الجزء المتعطل بدقة للمطور.
    console.error("✗ FAIL:", msg);
    // ينهي العملية برمز خروج غير صفري (1) لإبلاغ أنظمة التكامل المستمر (GitHub Actions / npm test) بوجود خطأ.
    process.exit(1);
    // يغلق كتلة معالجة فشل الشرط.
  }
  // يطبع علامة النجاح ورسالة الفحص عند تحقق الشرط في السطور السابقة لتوثيق سلامة المرحلة.
  console.log("✓ PASS:", msg);
  // يغلق دالة التحقق assert.
}

// 1. Validate Manifest V3
// يبني المسار الكامل لملف بيان الإضافة الأساسي extension/manifest.json انطلاقاً من الثابت ROOT.
const manifestPath = path.join(ROOT, "extension/manifest.json");
// يتحقق فعلياً من وجود ملف manifest.json على القرص قبل محاولة قراءته وتحليله في السطر التالي.
assert(fs.existsSync(manifestPath), "extension/manifest.json exists");
// يقرأ محتوى manifest.json كنص UTF-8 ويحوله إلى كائن برمجي لفحص حقوله الإلزامية.
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
// يتأكد من أن إصدار البيان هو الإصدار الثالث الحديث (Manifest V3) المعتمد في متصفحات كروميوم وفايرفوكس.
assert(manifest.manifest_version === 3, "Manifest version is 3");
// يبدأ فحص إعدادات حقن المحرك للتأكد من تشغيل الأداة افتراضياً على كل الصفحات والإطارات كما صُممت.
assert(
  // يتحقق أولاً من وجود مصفوفة content_scripts داخل كائن manifest المقروء أعلاه.
  manifest.content_scripts &&
    // يتحقق ثانياً من شمولية النمط "<all_urls>" لضمان العمل الافتراضي على كافة المواقع.
    manifest.content_scripts[0].matches.includes("<all_urls>") &&
    // يتحقق ثالثاً من تفعيل all_frames لتغطية الإطارات المدمجة وعناصر PDF داخل الصفحات.
    manifest.content_scripts[0].all_frames === true,
  // يسجل رسالة النجاح الدالة على استيفاء شروط التشغيل الافتراضي الشامل.
  "Content script runs by default across <all_urls> and all_frames"
  // يغلق استدعاء assert الخاص بفحص نطاق عمل سكربت المحتوى.
);

// 2. Validate _locales when default_locale is set
// يفحص وجود خاصية اللغة الافتراضية default_locale لأن المتصفح يرفض تحميل الإضافة إن غاب مجلدها في _locales.
if (manifest.default_locale) {
  // يركّب مسار ملف الترجمة المطلوب بناءً على قيمة default_locale المقروءة من manifest في السطر السابق.
  const localeFile = path.join(
    // يمرر جذر المشروع كنقطة بداية للمسار.
    ROOT,
    // يحدد مجلد اللغات القياسي داخل مجلد الإضافة.
    "extension/_locales",
    // يدرج رمز اللغة المحدد في البيان (وهو "ar" للغة العربية).
    manifest.default_locale,
    // يحدد اسم ملف الرسائل الإلزامي وفق مواصفات إضافات المتصفح.
    "messages.json"
    // يغلق تركيب مسار ملف الترجمة.
  );
  // يتحقق من وجود ملف messages.json في المسار المركّب أعلاه لضمان قبول الإضافة دون أخطاء تحميل.
  assert(fs.existsSync(localeFile), `_locales/${manifest.default_locale}/messages.json exists`);
  // يختبر سلامة صيغة JSON داخل ملف messages.json عبر تحليله فعلياً للتأكد من خلوه من أي خطأ تركيبي.
  JSON.parse(fs.readFileSync(localeFile, "utf8"));
  // يغلق كتلة فحص ملفات اللغة الافتراضية.
}

// 3. Validate all referenced files in manifest exist
// يجمع كافة مسارات الملفات التي يشير إليها manifest.json في مصفوفة واحدة للتحقق من عدم وجود أي رابط ملف مفقود.
const referencedFiles = [
  // يضيف مسار واجهة النافذة المنبثقة (popup/popup.html) المشار إليها في قسم action.
  manifest.action.default_popup,
  // يضيف مسار عامل الخدمة الخلفي (background/service-worker.js) المسؤول عن التهيئة والشارات.
  manifest.background.service_worker,
  // يضيف مسار لوحة الإحصائيات التفصيلية للأيام والأسابيع (pages/dashboard.html).
  manifest.options_page,
  // يفرد كافة ملفات الجافاسكربت المحقونة في الصفحات (core/mustaqbalat-engine.js).
  ...manifest.content_scripts[0].js,
  // يفرد مسارات جميع مقاسات الأيقونات الأربع (16، 32، 48، 128 بكسل).
  ...Object.values(manifest.icons),
  // يضيف مسار قارئ ومعتّم ملفات الـ PDF المدمج للتأكد من وجوده ضمن موارد الإضافة القابلة للوصول.
  "pages/pdf-viewer.html"
  // يغلق مصفوفة الملفات المرجعية المطلوب التحقق منها.
];

// ينشئ عداداً تراكمياً بالبايت لحساب الحجم الإجمالي الفعلي لملفات الإضافة والتثبت من خفتها القصوى.
let totalExtBytes = 0;
// يمر عبر كل مسار نسبي داخل مصفوفة referencedFiles لفحص وجوده وقياس حجمه.
for (const rel of referencedFiles) {
  // يحوّل المسار النسبي داخل extension/ إلى مسار مطلق كامل بالاعتماد على ROOT.
  const full = path.join(ROOT, "extension", rel);
  // يتحقق من وجود الملف فعلياً في المسار الكامل الناتج من السطر السابق.
  assert(fs.existsSync(full), `Extension asset exists: ${rel}`);
  // يقرأ حجم الملف بالبايت عبر fs.statSync ويضيفه إلى العداد التراكمي totalExtBytes.
  totalExtBytes += fs.statSync(full).size;
  // يغلق حلقة فحص ملفات الإضافة المرجعية.
}

// 4. Syntax-check every JS file in the repository
// يعرّف قائمة شاملة بجميع ملفات الجافاسكربت التنفيذية في المشروع لفحص سلامتها البرمجية آلياً.
const jsFiles = [
  // يدرج المحرك الأساسي المشترك للتعتيم والطبقات والـ PDF ومؤشر الاستهلاك الحي.
  "extension/core/mustaqbalat-engine.js",
  // يدرج عامل الخدمة الخلفي لإدارة الإعدادات الافتراضية وشارات التبويبات.
  "extension/background/service-worker.js",
  // يدرج متحكم النافذة المنبثقة وعجلة ألوان HEX والرسوم البيانية المصغرة وبلاغات GitHub.
  "extension/popup/popup.js",
  // يدرج متحكم لوحة إحصائيات الاستهلاك اليومي والأسبوعي.
  "extension/pages/dashboard.js",
  // يدرج متحكم قارئ ومعتّم ملفات الـ PDF العامل بالذاكرة المؤقتة.
  "extension/pages/pdf-viewer.js",
  // يدرج مشغّل أداة الويب العائمة المستقلة الخاصة بالـ Bookmarklet والـ Userscript.
  "converter/web-widget-runtime.js",
  // يدرج محرك تحويل وحزم الإضافة في الذاكرة دون استهلاك مساحة تخزين.
  "converter/web-addon-converter.js",
  // يدرج متحكم الصفحة التفاعلية الرئيسية للمنصة (index.html).
  "studio.js",
  // يدرج خادم الويب المحلي الساكن الخالي من الاعتماديات.
  "server.js"
  // يغلق مصفوفة ملفات الجافاسكربت الخاضعة للفحص.
];

// يكرر الفحص الصارم على كل ملف جافاسكربت مدرج في قائمة jsFiles السابقة.
for (const jsRel of jsFiles) {
  // يبني المسار المطلق للملف الحالي تمهيداً لقراءة شفرته المصدرية.
  const full = path.join(ROOT, jsRel);
  // يقرأ كامل الشفرة المصدرية للملف بترميز UTF-8 لتحليلها نحوياً.
  const code = fs.readFileSync(full, "utf8");
  // يجمّع الشفرة عبر مترجم V8 المدمج (vm.Script) لاكتشاف أي خطأ نحوي قبل تشغيلها في المتصفح.
  new vm.Script(code, { filename: jsRel });
  // يوثق نجاح الفحص النحوي للملف مع طباعة حجمه بالكيلوبايت لمراقبة خفة الشفرة.
  assert(true, `Valid JS syntax: ${jsRel} (${(Buffer.byteLength(code) / 1024).toFixed(1)} KB)`);
  // يغلق حلقة الفحص النحوي لملفات الجافاسكربت.
}

// 5. Test converter runtime in VM sandbox
// يقرأ شفرة محوّل إضافات الويب (web-addon-converter.js) لاختبار قدرته الفعلية على توليد Bookmarklet صالح.
const converterCode = fs.readFileSync(
  // يحدد المسار المطلق لملف المحوّل داخل مجلد converter/.
  path.join(ROOT, "converter/web-addon-converter.js"),
  // يحدد ترميز القراءة النصية UTF-8.
  "utf8"
  // يغلق استدعاء قراءة ملف المحوّل.
);
// يقرأ شفرة الأداة العائمة (web-widget-runtime.js) لتمريرها كمدخل فعلي لدالة التحويل والضغط في السطور التالية.
const widgetCode = fs.readFileSync(
  // يحدد المسار المطلق لملف المشغّل العائم داخل مجلد converter/.
  path.join(ROOT, "converter/web-widget-runtime.js"),
  // يحدد ترميز القراءة النصية UTF-8.
  "utf8"
  // يغلق استدعاء قراءة ملف المشغّل العائم.
);
// ينشئ بيئة محاكاة معزولة (Sandbox) تحاكي كائنات المتصفح الأساسية اللازمة لتشغيل المحوّل داخل Node.js.
const sandbox = { window: {}, globalThis: {}, TextEncoder, Uint32Array, Uint8Array, DataView, Blob };
// يربط المرجع globalThis داخل البيئة المعزولة بنفسه ليطابق سلوك المتصفحات الحديثة.
sandbox.globalThis = sandbox;
// ينفذ شفرة المحوّل داخل البيئة المعزولة لتسجيل واجهة window.MustaqbalatConverter.
vm.runInNewContext(converterCode, sandbox);
// يتحقق من نجاح تسجيل دالة ضغط وتوليد الـ Bookmarklet داخل كائن window في البيئة المعزولة.
assert(
  // يفحص نوع الدالة compactJsForBookmarklet للتأكد من جاهزيتها للاستدعاء في السطر التالي.
  typeof sandbox.window.MustaqbalatConverter.compactJsForBookmarklet === "function",
  // يطبع رسالة تأكيد تحميل محرك التحويل بنجاح.
  "Web Add-on Converter loaded cleanly"
  // يغلق فحص تحميل واجهة المحوّل.
);
// يستدعي دالة التحويل الفعلي لإنتاج رابط Bookmarklet مضغوط من شفرة الأداة العائمة مع إعدادات تجريبية.
const bookmarklet = sandbox.window.MustaqbalatConverter.compactJsForBookmarklet(widgetCode, {
  // يمرر سطوعاً افتراضياً تجريبياً بنسبة 82% لاختبار حقن الإعدادات المسبقة داخل الكود المحوّل.
  brightness: 82,
  // يمرر كثافة طبقة تعتيم بنسبة 18% استكمالاً لكائن الإعدادات المسبقة.
  overlay: 18
  // يغلق استدعاء توليد الـ Bookmarklet.
});
// يتحقق من أن المخرج الناتج يبدأ ببروتوكول التنفيذ الفوري في المتصفح "javascript:".
assert(
  // يفحص بادئة السلسلة الناتجة من السطر السابق.
  bookmarklet.startsWith("javascript:"),
  // يعرض طول رابط الـ Bookmarklet بالكيلوبايت مع تأكيد أن استهلاكه على القرص الصلب هو 0 بايت.
  `Bookmarklet compiled (${(bookmarklet.length / 1024).toFixed(1)} KB URL, 0 Bytes disk footprint)`
  // يغلق فحص بادئة الـ Bookmarklet.
);
// يفك ترميز رابط الـ Bookmarklet الناتج ويعيد تمريره لمترجم V8 للتثبت من أن إزالة التعليقات والضغط لم تسبب أي كسر نحوي.
new vm.Script(decodeURIComponent(bookmarklet.slice("javascript:".length)), {
  // يعطي اسماً افتراضياً للشفرة المفكوكة لتسهيل التتبع في حال ظهور أي خطأ.
  filename: "bookmarklet.decoded.js"
  // يغلق خيارات فحص الشفرة المفكوكة.
});
// يسجل نجاح الفحص النحوي للـ Bookmarklet بعد فك ترميزه بالكامل.
assert(true, "Compiled Bookmarklet decoded JS syntax is valid");

// يطبع الملخص النهائي لنجاح كافة الاختبارات مع إجمالي حجم أصول الإضافة بالكيلوبايت.
console.log(
  // ينسق رسالة الختام متضمنة القيمة المحسوبة سابقاً في totalExtBytes مقسومة على 1024.
  `\n🎉 All checks passed! Core extension assets size: ${(totalExtBytes / 1024).toFixed(1)} KB.`
  // يغلق استدعاء الطباعة الختامي.
);
