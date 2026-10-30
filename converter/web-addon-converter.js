/**
 * Mustaqbalat — Zero-Disk-Space Web-to-Extension & Instant Web Add-on Converter
 * Converts the tool in-memory (0 server/SDK required) into:
 *  1) Zero-Storage Bookmarklet (0 Bytes on disk — drag & drop to browser bar)
 *  2) Auto-Run All-Sites Userscript (.user.js — runs by default on all URLs)
 *  3) Packed Browser Extension (.zip Manifest V3 for Chrome/Edge/Brave & Firefox)
 *  4) Installable Web App Manifest (PWA shortcut)
 */
// يفتح دالة فورية التنفيذ تستقبل النطاق العام (window أو globalThis) ليعمل المحوّل في المتصفح وفي اختبارات Node.js على حد سواء.
(function (globalScope) {
  // يفعّل الوضع الصارم لضمان انضباط العمليات الثنائية وحسابات الذاكرة داخل المحوّل.
  "use strict";

  // يعرّف القائمة الكاملة بجميع ملفات إضافة المتصفح (15 ملفاً) التي يقرؤها المحوّل عند بناء حزمة الـ ZIP في الذاكرة.
  const EXTENSION_FILES = [
    // ملف البيان الرئيسي للإضافة بصيغة Manifest V3.
    "manifest.json",
    // ملف رسائل اللغة العربية الإلزامي المرتبط بخاصية default_locale في البيان السابق.
    "_locales/ar/messages.json",
    // المحرك الأساسي المشترك المسؤول عن السطوع والطبقات والـ PDF والوضع الداكن ومؤشر الاستهلاك.
    "core/mustaqbalat-engine.js",
    // عامل الخدمة الخلفي المسؤول عن التفعيل التلقائي وشارات التبويبات.
    "background/service-worker.js",
    // هيكل واجهة النافذة المنبثقة ذات التبويبات الأربعة.
    "popup/popup.html",
    // ورقة الأنماط الداكنة المريحة للعين الخاصة بالنافذة المنبثقة.
    "popup/popup.css",
    // المنطق التفاعلي للنافذة المنبثقة وعجلة ألوان HEX وبلاغات GitHub.
    "popup/popup.js",
    // صفحة لوحة الإحصائيات التفصيلية للاستهلاك على مدى الأيام والأسابيع.
    "pages/dashboard.html",
    // السكربت المشغّل للرسوم البيانية والجداول الزمنية في لوحة الإحصائيات.
    "pages/dashboard.js",
    // صفحة قارئ ومعتّم ملفات الـ PDF المدمج العامل بالذاكرة المؤقتة.
    "pages/pdf-viewer.html",
    // السكربت المشغّل لطبقات تعتيم وتلوين ملفات الـ PDF داخل القارئ المدمج.
    "pages/pdf-viewer.js",
    // أيقونة شريط القوائم المصغرة بمقاس 16×16 بكسل.
    "icons/icon16.png",
    // أيقونة شريط المتصفح القياسية بمقاس 32×32 بكسل.
    "icons/icon32.png",
    // أيقونة صفحة إدارة الإضافات بمقاس 48×48 بكسل.
    "icons/icon48.png",
    // أيقونة المتجر والعرض عالي الدقة بمقاس 128×128 بكسل.
    "icons/icon128.png"
    // يغلق مصفوفة مسارات ملفات الإضافة EXTENSION_FILES.
  ];

  // Lightweight safe JS compressor for Bookmarklets (strips comments & excess whitespace)
  // يعرّف دالة ضغط وتحويل الشفرة المصدرية للأداة العائمة إلى رابط Bookmarklet فوري يعمل بدون أي مساحة تخزين.
  function compactJsForBookmarklet(source, presetObj) {
    // يبني سطر حقن الإعدادات المسبقة التي اختارها المستخدم في الواجهة إن وُجدت في المعامل presetObj.
    const presetLine = presetObj
      // يحول كائن الإعدادات إلى نص JSON ويسنده إلى window.__MUSTAQBALAT_PRESET__ ليقرأه المشغّل عند الإقلاع.
      ? `window.__MUSTAQBALAT_PRESET__=${JSON.stringify(presetObj)};`
      // يترك السطر فارغاً في حال عدم تمرير إعدادات مخصصة.
      : "";
    // يزيل كافة التعليقات متعددة الأسطر (/* ... */) من الشفرة المصدرية لتقليص طول رابط الـ Bookmarklet.
    const noBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
    // يبدأ معالجة الشفرة سطراً بسطر بعد إزالة التعليقات الكتلية في السطر السابق.
    const lines = noBlockComments
      // يقسم النص إلى مصفوفة أسطر مستقلة عند محرف السطر الجديد.
      .split("\n")
      // يمر على كل سطر لتنظيف الفراغات واستبعاد أسطر التعليقات المفردة.
      .map((line) => {
        // يزيل المسافات البادئة واللاحقة من السطر الحالي لفحصه بدقة.
        const trimmed = line.trim();
        // يستبعد السطر بالكامل إذا كان تعليقاً يبدأ بـ "//" حتى لا يتسبب في تعطيل الكود عند دمجه في رابط واحد.
        if (trimmed.startsWith("//")) return "";
        // يعيد السطر البرمجي الصافي بعد التنظيف.
        return trimmed;
        // يغلق دالة تنقية السطر الواحد.
      })
      // يحذف جميع الأسطر الفارغة الناتجة عن التصفية السابقة لتقليل الحجم النهائي.
      .filter(Boolean);
    // يجمع سطر الإعدادات المسبقة مع الأسطر البرمجية الصافية ويقلص المسافات المتكررة إلى مسافة واحدة.
    const body = presetLine + lines.join("\n").replace(/\s{2,}/g, " ");
    // يغلّف الكود الناتج بدالة فورية ويرمّزه ببروتوكول "javascript:" ليصبح صالحاً للسحب المباشر إلى شريط الإشارات.
    return "javascript:" + encodeURIComponent(`(function(){${body}})();`);
    // يغلق دالة ضغط وتوليد الـ Bookmarklet.
  }

  // يعرّف دالة بناء ملف Userscript قياسي (.user.js) يعمل تلقائياً على جميع المواقع في مديري السكربتات الخفيفة.
  function buildUserscriptSource(widgetSource, presetObj) {
    // يجهز سطر الإعدادات الافتراضية المخصصة من المستخدم لزرعه أعلى السكربت قبل تشغيل الأداة.
    const presetLine = presetObj
      // ينسق كائن الإعدادات داخل متغير window.__MUSTAQBALAT_PRESET__.
      ? `window.__MUSTAQBALAT_PRESET__ = ${JSON.stringify(presetObj)};`
      // أو يتركه فارغاً عند الاكتفاء بالإعدادات القياسية.
      : "";
    // يبني مصفوفة أسطر ترويسة UserScript القياسية متبوعة بشفرة الأداة الكاملة.
    return [
      // يفتح وسم البداية الإلزامي ليتعرف المتصفح ومدير السكربتات على الملف كإضافة ويب.
      "// ==UserScript==",
      // يحدد الاسم العربي والإنجليزي الظاهر للمستخدم عند تثبيت السكربت.
      "// @name         مستقبلات للراحة البصرية | Mustaqbalat Web Add-on",
      // يربط النطاق المرجعي للسكربت بمستودع المشروع الرسمي على GitHub.
      "// @namespace    https://github.com/Mohamed7AbdELhalim/Mustaqbalat",
      // يحدد رقم الإصدار الحالي لتمكين التحديثات المستقبلية المنتظمة.
      "// @version      1.0.0",
      // يشرح وظيفة السكربت للمستخدم قبل الموافقة على التثبيت.
      "// @description  يعمل افتراضياً على كل الصفحات لتقليل/زيادة السطوع، طبقات التعتيم، الوضع الداكن، ألوان HEX، ودعم PDF باستهلاك شبه صفري.",
      // يسجل اسم الجهة المطورة للمشروع.
      "// @author       Mustaqbalat",
      // يضبط نطاق التشغيل التلقائي ليشمل جميع مواقع الويب (http وhttps) افتراضياً.
      "// @match        *://*/*",
      // يضيف دعم التشغيل التلقائي على ملفات الـ PDF المفتوحة محلياً عبر المتصفح.
      "// @match        file:///*.pdf",
      // يحدد توقيت التشغيل فور استقرار شجرة الصفحة لضمان سرعة الاستجابة.
      "// @run-at       document-idle",
      // يؤكد عدم طلب أي صلاحيات خاصة خطرة للحفاظ على أمان المستخدم وخفة التنفيذ.
      "// @grant        none",
      // يغلق وسم ترويسة البيانات الوصفية للـ UserScript.
      "// ==/UserScript==",
      // يترك سطراً فاصلاً نظيفاً بين الترويسة والشفرة التنفيذية.
      "",
      // يدرج سطر الإعدادات المخصصة المجهز في بداية الدالة.
      presetLine,
      // يدرج الشفرة الكاملة لمشغّل الأداة العائمة (web-widget-runtime.js).
      widgetSource
      // يدمج جميع الأسطر السابقة بفاصل السطر الجديد لتكوين ملف .user.js متكامل.
    ].join("\n");
    // يغلق دالة بناء الـ Userscript.
  }

  // Pure-JS CRC32 + PKZIP encoder (0 dependencies, works in any modern browser)
  // يبني جدول البحث السريع لخوارزمية التدقيق الرقمي CRC32 لمرة واحدة بالذاكرة لاستخدامه عند تكوين أرشيف ZIP بدون مكتبات خارجية.
  const crcTable = (function () {
    // يحجز مصفوفة ثنائية عالية الكفاءة من 256 عدداً صحيحاً غير سالب بعرض 32 بت.
    const table = new Uint32Array(256);
    // يكرر الحساب الرياضي لكل قيمة بايت محتملة من 0 إلى 255.
    for (let n = 0; n < 256; n++) {
      // يبدأ بقيمة الفهرس الحالي n كقيمة أولية للمتغير التراكمي c.
      let c = n;
      // يعالج البتات الثمانية (8 bits) الخاصة بالبايت الحالي واحداً تلو الآخر.
      for (let k = 0; k < 8; k++) {
        // يطبق كثيرة الحدود القياسية لـ IEEE 802.3 CRC32 (0xEDB88320) عند كون البت الأقل أهمية يساوي 1.
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        // يغلق حلقة البتات الثمانية.
      }
      // يخزن القيمة الناتجة كعدد 32 بت غير موقّع في الخانة المقابلة داخل الجدول.
      table[n] = c >>> 0;
      // يغلق حلقة قيم البايت الـ 256.
    }
    // يعيد الجدول المكتمل ليُحفظ في الثابت crcTable طوال عمر الصفحة.
    return table;
    // يغلق وينفذ دالة توليد جدول CRC32.
  })();

  // يعرّف دالة حساب البصمة الرقمية CRC32 لأي مصفوفة بايتات (ملف داخل الإضافة) كما تشترط مواصفات PKZIP القياسية.
  function crc32(bytes) {
    // يبدأ بقيمة التهيئة القياسية العكسية لجميع البتات (0xFFFFFFFF).
    let crc = 0xffffffff;
    // يمر على كل بايت في محتوى الملف الممرر عبر المصفوفة bytes.
    for (let i = 0; i < bytes.length; i++) {
      // يحدّث قيمة البصمة بالاستعانة الفورية بجدول crcTable المحسوب في الخطوة السابقة.
      crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
      // يغلق حلقة قراءة بايتات الملف.
    }
    // يعكس البتات النهائية ويضمن إرجاع النتيجة كعدد 32 بت موجب صالح للتخزين في ترويسة ZIP.
    return (crc ^ 0xffffffff) >>> 0;
    // يغلق دالة حساب CRC32.
  }

  // يعرّف الدالة الهندسية التي تبني ملف أرشيف ZIP حقيقي متوافق مع جميع المتصفحات وأنظمة التشغيل مباشرة في الذاكرة (RAM).
  function createZipBlob(entries) {
    // ينشئ مرمّز نصوص UTF-8 لتحويل أسماء الملفات ومحتوياتها النصية إلى مصفوفات بايتات ثنائية.
    const encoder = new TextEncoder();
    // ينشئ مصفوفة لتجميع الترويسات المحلية ومحتويات الملفات المتتابعة في القسم الأول من ملف الـ ZIP.
    const localParts = [];
    // ينشئ مصفوفة لتجميع سجلات الفهرس المركزي (Central Directory) التي توضع في نهاية ملف الـ ZIP.
    const centralParts = [];
    // يتتبع الإزاحة الثنائية بالبايت لكل ملف داخل الأرشيف لربط الفهرس المركزي بموقع كل ملف بدقة.
    let offset = 0;

    // يمر على كل ملف مدخل (اسم + محتوى نصي أو ثنائي) من ملفات الإضافة الـ 15.
    for (const entry of entries) {
      // يحوّل مسار واسم الملف النسبي (مثل "popup/popup.js") إلى بايتات UTF-8.
      const nameBytes = encoder.encode(entry.name);
      // يتحقق مما إذا كان محتوى الملف مصفوفة ثنائية جاهزة (مثل صور الأيقونات PNG) أو نصاً يحتاج للترميز.
      const dataBytes =
        // يبقي المصفوفة الثنائية كما هي أو يرمّز النص عبر encoder المجهز أعلاه.
        entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data));
      // يحسب بصمة التحقق من السلامة CRC32 لبايتات الملف عبر الدالة crc32 المعرّفة سابقاً.
      const crc = crc32(dataBytes);
      // يحفظ الحجم الدقيق للملف بالبايت لكتابته في ترويسة الحجم غير المضغوط والمخزن.
      const size = dataBytes.length;

      // Local file header (30 bytes + name)
      // يحجز مساحة ثنائية للترويسة المحلية للملف بطول 30 بايت قياسياً مضافاً إليها طول اسم الملف.
      const localHeader = new Uint8Array(30 + nameBytes.length);
      // ينشئ عارض بيانات ثنائي (DataView) لكتابة الأعداد الصحيحة بترتيب Little-Endian المعتمد في صيغة ZIP.
      const lv = new DataView(localHeader.buffer);
      // يكتب البصمة السحرية القياسية لترويسة الملف المحلية (0x04034b50) عند البايت 0.
      lv.setUint32(0, 0x04034b50, true); // signature
      // يحدد أقل إصدار PKZIP مطلوب لفك الأرشيف (الإصدار 2.0 = القيمة 20).
      lv.setUint16(4, 20, true);         // version needed
      // يفعّل راية الترميز العالمي UTF-8 (0x0800) لضمان سلامة أسماء الملفات عبر كل الأنظمة.
      lv.setUint16(6, 0x0800, true);     // UTF-8 flag
      // يحدد طريقة الحفظ المباشر السريع Store (0) نظراً لصغر حجم ملفات الإضافة الفائق (~40KB).
      lv.setUint16(8, 0, true);          // store method (0)
      // يضع توقيت التعديل الثنائي القياسي بصفر لتوحيد المخرجات الحتمية.
      lv.setUint16(10, 0, true);         // mod time
      // يسجل تاريخاً ثنائياً صالحاً بصيغة MS-DOS لتقبله جميع برامج فك الضغط والمتصفحات.
      lv.setUint16(12, 0x559e, true);    // mod date
      // يكتب قيمة التدقيق CRC32 المحسوبة سابقاً عند البايت 14 من الترويسة.
      lv.setUint32(14, crc, true);
      // يكتب الحجم المخزن للملف بالبايت عند الإزاحة 18.
      lv.setUint32(18, size, true);
      // يكتب الحجم الأصلي للملف بالبايت عند الإزاحة 22 (مطابق للمخزن في وضع Store).
      lv.setUint32(22, size, true);
      // يكتب طول اسم الملف بالبايت عند الإزاحة 26 ليعرف القارئ أين ينتهي الاسم ويبدأ المحتوى.
      lv.setUint16(26, nameBytes.length, true);
      // يحدد طول الحقول الإضافية بصفر لعدم الحاجة لبيانات وصفية زائدة.
      lv.setUint16(28, 0, true);
      // ينسخ بايتات اسم الملف مباشرة بعد البايت الـ 30 في الترويسة المحلية.
      localHeader.set(nameBytes, 30);

      // يضيف الترويسة المحلية متبوعة ببايتات محتوى الملف نفسه إلى مصفوفة القسم الأول للأرشيف.
      localParts.push(localHeader, dataBytes);

      // Central directory header (46 bytes + name)
      // يحجز مساحة سجل الفهرس المركزي لهذا الملف (46 بايت قياسياً + طول اسم الملف).
      const centralHeader = new Uint8Array(46 + nameBytes.length);
      // ينشئ عارض بيانات ثنائي لملء حقول الفهرس المركزي.
      const cv = new DataView(centralHeader.buffer);
      // يكتب التوقيع القياسي لسجل الفهرس المركزي (0x02014b50).
      cv.setUint32(0, 0x02014b50, true);
      // يسجل إصدار منشئ الأرشيف (20 = PKZIP 2.0).
      cv.setUint16(4, 20, true);
      // يسجل الإصدار المطلوب للاستخراج (20).
      cv.setUint16(6, 20, true);
      // يفعّل راية دعم الأسماء بترميز UTF-8 مطابقة للترويسة المحلية.
      cv.setUint16(8, 0x0800, true);
      // يحدد طريقة التخزين Store (0) مطابقة للترويسة المحلية.
      cv.setUint16(10, 0, true);
      // يسجل وقت التعديل القياسي.
      cv.setUint16(12, 0, true);
      // يسجل تاريخ التعديل القياسي.
      cv.setUint16(14, 0x559e, true);
      // يسجل نفس بصمة التدقيق CRC32 للملف في الفهرس المركزي.
      cv.setUint32(16, crc, true);
      // يسجل الحجم المخزن للملف.
      cv.setUint32(20, size, true);
      // يسجل الحجم الأصلي للملف.
      cv.setUint32(24, size, true);
      // يسجل طول اسم الملف بالبايت.
      cv.setUint16(28, nameBytes.length, true);
      // يضع طول الحقل الإضافي بصفر.
      cv.setUint16(30, 0, true);
      // يضع طول تعليق الملف بصفر لتجنب أي زيادة غير ضرورية في الحجم.
      cv.setUint16(32, 0, true);
      // يحدد رقم القرص الابتدائي بصفر (أرشيف من جزء واحد).
      cv.setUint16(34, 0, true);
      // يضع السمات الداخلية للملف بصفر.
      cv.setUint16(36, 0, true);
      // يضع السمات الخارجية للملف بصفر.
      cv.setUint32(38, 0, true);
      // يسجل الإزاحة الدقيقة (offset) لبداية الترويسة المحلية لهذا الملف منذ أول بايت في الأرشيف.
      cv.setUint32(42, offset, true);
      // ينسخ بايتات اسم الملف بعد البايت 46 من سجل الفهرس المركزي.
      centralHeader.set(nameBytes, 46);

      // يضيف سجل الفهرس المركزي المكتمل إلى مصفوفة الفهارس المركزية.
      centralParts.push(centralHeader);
      // يحدّث عداد الإزاحة بإضافة حجم الترويسة المحلية وحجم بيانات الملف الحالي تمهيداً للملف التالي.
      offset += localHeader.length + size;
      // يغلق حلقة حزم ملفات الإضافة.
    }

    // يحسب الحجم الإجمالي لقسم الفهرس المركزي بجمع أطوال كافة سجلاته في centralParts.
    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
    // يحجز 22 بايت لسجل نهاية الفهرس المركزي الإلزامي (End of Central Directory - EOCD).
    const eocd = new Uint8Array(22);
    // ينشئ عارض بيانات لملء حقول سجل الختام EOCD.
    const ev = new DataView(eocd.buffer);
    // يكتب التوقيع الرسمي لنهاية ملف الـ ZIP (0x06054b50).
    ev.setUint32(0, 0x06054b50, true);
    // يسجل رقم هذا القرص بصفر.
    ev.setUint16(4, 0, true);
    // يسجل رقم القرص الذي يبدأ فيه الفهرس المركزي بصفر.
    ev.setUint16(6, 0, true);
    // يكتب إجمالي عدد ملفات الإضافة في هذا القرص.
    ev.setUint16(8, entries.length, true);
    // يكتب إجمالي عدد ملفات الإضافة الكلي في الأرشيف.
    ev.setUint16(10, entries.length, true);
    // يسجل الحجم الكلي للفهرس المركزي المحسوب في centralSize أعلاه.
    ev.setUint32(12, centralSize, true);
    // يسجل موقع بداية الفهرس المركزي بالبايت (وهو قيمة offset النهائية بعد آخر ملف).
    ev.setUint32(16, offset, true);
    // يحدد طول التعليق الختامي للأرشيف بصفر.
    ev.setUint16(20, 0, true);

    // يجمع كافة الأجزاء المحلية والفهارس المركزية وسجل الختام في كائن Blob واحد بصيغة application/zip جاهز للتسليم الفوري.
    return new Blob([...localParts, ...centralParts, eocd], { type: "application/zip" });
    // يغلق دالة تكوين ملف الـ ZIP في الذاكرة createZipBlob.
  }

  // يعرّف الدالة العليا التي تجلب جميع ملفات extension/، وتطبّق تخصيصات المستخدم وتوافق المتصفح، ثم تحزمها عبر createZipBlob.
  async function buildExtensionPackage({ targetBrowser = "chromium", customDefaults = null } = {}) {
    // ينشئ مصفوفة لتخزين الملفات المقروءة والمعدّلة قبل تمريرها لحازم الـ ZIP.
    const entries = [];
    // يمر بالتتابع على كل مسار ملف مدرج في قائمة EXTENSION_FILES المعرّفة مطلع الملف.
    for (const relPath of EXTENSION_FILES) {
      // يطلب الملف عبر واجهة fetch القياسية بمسار نسبي يعمل على الخادم المحلي وعلى GitHub Pages معاً.
      const resp = await fetch(`./extension/${relPath}`);
      // يتحقق من نجاح قراءة الملف أو يرمي خطأً واضحاً باللغة العربية يحدد الملف المتعثر.
      if (!resp.ok) throw new Error(`تعذر قراءة الملف: ${relPath}`);

      // يفحص ما إذا كان الملف الحالي صورة أيقونة بصيغة PNG ليقرأه كبيانات ثنائية خام دون تحريف نصي.
      if (relPath.endsWith(".png")) {
        // يقرأ المخزن الثنائي الكامل للصورة من الاستجابة.
        const buf = await resp.arrayBuffer();
        // يضيف الأيقونة كمصفوفة بايتات Uint8Array إلى قائمة مدخلات الأرشيف.
        entries.push({ name: relPath, data: new Uint8Array(buf) });
        // يتعامل مع بقية الملفات النصية (JSON, JS, HTML, CSS).
      } else {
        // يقرأ المحتوى النصي الكامل للملف بترميز UTF-8.
        let text = await resp.text();
        // يفحص ما إذا كان الملف هو manifest.json والمتصفح المختار هو فايرفوكس لضبط خلفية Manifest V3 وفق متطلبات موزيلا.
        if (relPath === "manifest.json" && targetBrowser === "firefox") {
          // يحلل نص البيان إلى كائن جافاسكربت لإجراء التعديل الهيكلي بأمان.
          const manifest = JSON.parse(text);
          // Firefox MV3 supports background.scripts alongside service_worker
          // يستبدل تعريف الخلفية بصيغة مصفوفة scripts التي يشترطها متصفح Firefox في Manifest V3.
          manifest.background = {
            // يشير إلى نفس ملف عامل الخدمة الخلفي دون الحاجة لتكرار الشفرة.
            scripts: ["background/service-worker.js"]
            // يغلق كائن خلفية فايرفوكس.
          };
          // يعيد تحويل كائن البيان المعدّل إلى نص JSON منسق بدقة.
          text = JSON.stringify(manifest, null, 2);
          // يغلق شرط تكييف البيان لمتصفح فايرفوكس.
        }
        // يفحص وجود إعدادات مبدئية مخصصة من المستخدم لتضمينها مباشرة داخل المحرك وعامل الخدمة قبل الضغط.
        if (
          // يتأكد من تمرير كائن customDefaults.
          customDefaults &&
          // يحصر التعديل في ملفي المحرك الأساسي وعامل الخدمة اللذين يحملان القيم الافتراضية.
          (relPath === "core/mustaqbalat-engine.js" || relPath === "background/service-worker.js")
          // يغلق شرط استهداف ملفي الإعدادات الافتراضية.
        ) {
          // يستبدل قيمة السطوع الافتراضية 88 بالقيمة المفضلة التي حددها المستخدم في واجهة المحوّل.
          text = text.replace(
            // النص الأصلي لقيمة السطوع المبدئية.
            "brightness: 88,",
            // النص البديل حاملاً القيمة المخصصة من المستخدم.
            `brightness: ${Number(customDefaults.brightness) || 88},`
            // يغلق عملية استبدال السطوع الافتراضي.
          );
          // يستبدل كثافة طبقة التعتيم الافتراضية 14 بالقيمة المخصصة من المستخدم.
          text = text.replace(
            // النص الأصلي لكثافة الطبقة العلوية.
            "overlayOpacity: 14,",
            // النص البديل حاملاً الكثافة المخصصة.
            `overlayOpacity: ${Number(customDefaults.overlay) ?? 14},`
            // يغلق عملية استبدال كثافة الطبقة.
          );
          // يتحقق من تحديد المستخدم للون شاشة HEX مخصص لتحديث اللون الافتراضي به.
          if (customDefaults.tintColor) {
            // يستبدل اللون الافتراضي (#F59E0B) باللون السداسي المختار من المستخدم.
            text = text.replace(
              // النص الأصلي للون العنبر الافتراضي.
              'tintColor: "#F59E0B",',
              // النص البديل باللون الجديد.
              `tintColor: "${customDefaults.tintColor}",`
              // يغلق استبدال كود اللون.
            );
            // يغلق شرط اللون المخصص.
          }
          // يغلق كتلة حقن التفضيلات المسبقة في ملفات الإضافة.
        }
        // يدرج الملف النصي الجاهز في مصفوفة مدخلات الأرشيف.
        entries.push({ name: relPath, data: text });
        // يغلق فرع معالجة الملفات النصية.
      }
      // يغلق حلقة جلب ومعالجة جميع ملفات الإضافة.
    }

    // يستدعي دالة createZipBlob لتجميع كافة المدخلات في كائن أرشيف ZIP واحد داخل الذاكرة العشوائية.
    const blob = createZipBlob(entries);
    // يعيد كائناً شاملاً يحتوي على ملف الـ Blob وإحصائيات الحجم الدقيقة لعرضها في واجهة studio.js.
    return {
      // كائن ملف الـ ZIP الثنائي الجاهز للتنزيل.
      blob,
      // الحجم الكلي النهائي للحزمة بالبايت.
      sizeBytes: blob.size,
      // إجمالي عدد الملفات المدمجة داخل الحزمة.
      fileCount: entries.length,
      // قائمة تفصيلية باسم وحجم كل ملف بالبايت لعرض الشفافية الكاملة حول صغر حجم الأداة.
      entries: entries.map((e) => ({
        // اسم ومسار الملف داخل الحزمة.
        name: e.name,
        // يحسب حجم الملف بالبايت سواء كان ثنائياً أو نصياً.
        bytes: e.data instanceof Uint8Array ? e.data.length : new TextEncoder().encode(e.data).length
        // يغلق تحويل معلومات الملف الواحد.
      }))
      // يغلق الكائن المُرجع من دالة بناء الحزمة.
    };
    // يغلق دالة buildExtensionPackage.
  }

  // يعرّف دالة جلب شفرة الأداة العائمة وتوليد صيغتي الويب الفوريتين (Bookmarklet وUserscript) دفعة واحدة.
  async function generateWebAddons(presetObj) {
    // يجلب الشفرة المصدرية لمشغّل الأداة العائمة المستقلة من مجلد converter/.
    const resp = await fetch("./converter/web-widget-runtime.js");
    // يستخرج النص الكامل للشفرة المصدرية بعد نجاح الجلب في السطر السابق.
    const widgetSource = await resp.text();
    // يولّد رابط الـ Bookmarklet المضغوط عديم الاستهلاك التخزيني عبر دالة compactJsForBookmarklet.
    const bookmarkletHref = compactJsForBookmarklet(widgetSource, presetObj);
    // يولّد نص ملف الـ Userscript التلقائي عبر دالة buildUserscriptSource بنفس الإعدادات المسبقة.
    const userscriptText = buildUserscriptSource(widgetSource, presetObj);

    // يعيد الصيغتين المولدتين مع مقاييس طولهما وحجمهما لواجهة المنصة في studio.js.
    return {
      // رابط الـ Bookmarklet الجاهز للسحب إلى شريط الإشارات أو النسخ.
      bookmarkletHref,
      // عدد أحرف رابط الـ Bookmarklet بعد الضغط.
      bookmarkletChars: bookmarkletHref.length,
      // النص الكامل لملف mustaqbalat.user.js.
      userscriptText,
      // الحجم الفعلي بالبايت لملف الـ Userscript.
      userscriptBytes: new Blob([userscriptText]).size
      // يغلق كائن مخرجات إضافات الويب.
    };
    // يغلق دالة generateWebAddons.
  }

  // يصدر الدوال الأساسية الثلاث للمحوّل على النطاق العام تحت اسم MustaqbalatConverter لتستخدمها المنصة والاختبارات.
  globalScope.MustaqbalatConverter = {
    // يتيح دالة توليد الـ Bookmarklet والـ Userscript.
    generateWebAddons,
    // يتيح دالة حزم إضافة المتصفح بالذاكرة العشوائية.
    buildExtensionPackage,
    // يتيح دالة الضغط المباشر للتحقق الآلي في الاختبارات (validate-and-convert.js).
    compactJsForBookmarklet
    // يغلق كائن الواجهة العامة للمحوّل.
  };
  // يغلق الدالة الفورية ويمرر لها window في المتصفح أو globalThis في بيئة الاختبار.
})(typeof window !== "undefined" ? window : globalThis);
