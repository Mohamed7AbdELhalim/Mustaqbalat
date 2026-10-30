/**
 * Mustaqbalat — Extension Popup Controller
 * Works seamlessly both inside Browser Extension context (chrome.*)
 * and inside the Zero-Install Web Studio simulator (localStorage + postMessage).
 */
// يفتح دالة فورية التنفيذ لعزل منطق نافذة التحكم المنبثقة (popup.html) ومنع تسرب أي متغيرات للنطاق العام.
(function () {
  // يفعّل الوضع الصارم لضمان انضباط الأنواع وسلامة معالجة الأحداث وحسابات عجلة الألوان.
  "use strict";

  // يعرّف مفتاح التخزين الموحّد للإعدادات ليطابق المفتاح المعتمد في المحرك الأساسي وعامل الخدمة.
  const STORAGE_KEY_SETTINGS = "mustaqbalat_settings_v1";
  // يعرّف مفتاح سجل الاستهلاك الزمني والنظامي لقراءة بيانات المخطط المصغر للأيام والأسابيع.
  const STORAGE_KEY_USAGE = "mustaqbalat_usage_v1";
  // يعرّف مفتاح قائمة المواقع غير المتوافقة لعرضها وإدارتها في تبويب بلاغات GitHub.
  const STORAGE_KEY_BROKEN_SITES = "mustaqbalat_broken_sites_v1";

  // يعرّف مصفوفة لوحات الألوان الثمان الجاهزة لعرضها كأزرار لونية سريعة في تبويب الألوان HEX.
  const PRESET_PALETTES = [
    // لوحة العنبر الدافئ لتصفية الضوء الأزرق الليلي.
    { id: "amber", name: "عنبر دافئ", hex: "#F59E0B", opacity: 18, blend: "multiply" },
    // لوحة ضوء الشموع البرتقالية الهادئة.
    { id: "candle", name: "ضوء الشموع", hex: "#EA580C", opacity: 22, blend: "multiply" },
    // لوحة ورق القراءة الكلاسيكي للمقالات والمستندات.
    { id: "sepia", name: "ورق القراءة", hex: "#D6B88A", opacity: 24, blend: "multiply" },
    // لوحة الطيف الأخضر المريح للأعصاب البصرية.
    { id: "forest", name: "أخضر مريح", hex: "#10B981", opacity: 14, blend: "multiply" },
    // لوحة الوردي الناعم المخصصة لتخفيف الحساسية الضوئية والصداع.
    { id: "rose", name: "وردي هادئ", hex: "#F43F5E", opacity: 14, blend: "soft-light" },
    // لوحة الأزرق القمري الليلي.
    { id: "moon", name: "أزرق قمري", hex: "#38BDF8", opacity: 15, blend: "multiply" },
    // لوحة البنفسجي الخافت لتهدئة السطوع الأبيض.
    { id: "violet", name: "بنفسجي خافت", hex: "#8B5CF6", opacity: 15, blend: "multiply" },
    // لوحة الرمادي السينمائي المحايد لخفض الإضاءة دون المساس بدرجات الألوان.
    { id: "slate", name: "رمادي سينمائي", hex: "#334155", opacity: 25, blend: "multiply" }
    // يغلق مصفوفة اللوحات اللونية الجاهزة PRESET_PALETTES.
  ];

  // يعرّف القيم الافتراضية القياسية لكافة عناصر التحكم في النافذة المنبثقة وعند استعادة الضبط المصنعي.
  const DEFAULT_SETTINGS = {
    // التفعيل الشامل الافتراضي على جميع الصفحات.
    globalEnabled: true,
    // نسبة السطوع المبدئية المريحة (88%).
    brightness: 88,
    // نسبة التباين القياسية للنصوص (100%).
    contrast: 100,
    // نسبة الدفء اللوني وتصفية الأزرق (12%).
    warmth: 12,
    // نسبة تشبع ألوان الصفحة (100%).
    saturation: 100,
    // زاوية تدوير طيف ألوان الصفحة (0 درجة).
    hueRotate: 0,
    // نسبة تخفيف وهج البياض (8%).
    pageColorDim: 8,
    // آلية الدمج الذكي بين الفلتر والطبقات ("hybrid").
    method: "hybrid",
    // كثافة طبقة التعتيم الفوقية فوق الموقع (14%).
    overlayOpacity: 14,
    // حالة تفعيل طبقة اللون المخصص ابتدائياً.
    tintEnabled: false,
    // كود اللون السداسي الابتدائي (#F59E0B).
    tintColor: "#F59E0B",
    // شفافية طبقة اللون المخصص (18%).
    tintOpacity: 18,
    // نمط دمج الطبقة اللونية مع الصفحة ("multiply").
    tintBlendMode: "multiply",
    // حالة الوضع الداكن المبدئية ("off").
    darkMode: "off",
    // تفعيل معالجة مستندات PDF افتراضياً.
    pdfEnabled: true,
    // نسبة التعتيم الإضافي لبياض صفحات PDF (10%).
    pdfExtraDim: 10,
    // إظهار مؤشر الاستهلاك الحي داخل الصفحة افتراضياً.
    showInPageHud: true,
    // عرض المؤشر بالحجم الكامل غير المصغر.
    hudMinimized: false,
    // تثبيت المؤشر في الزاوية اليسرى السفلية.
    hudPosition: "bottom-left",
    // مستودع GitHub الافتراضي المرتبط بنظام البلاغات.
    githubRepo: "Mohamed7AbdELhalim/Mustaqbalat",
    // مصفوفة المواقع المستثناة من قبل المستخدم.
    excludedSites: [],
    // كائن التخصيصات الخاصة بكل موقع.
    siteOverrides: {}
    // يغلق كائن الإعدادات الافتراضية DEFAULT_SETTINGS.
  };

  // ينشئ كائن الإعدادات النشط في ذاكرة النافذة المنبثقة مبدوءاً بالقيم الافتراضية أعلاه.
  let settings = Object.assign({}, DEFAULT_SETTINGS);
  // ينشئ كائناً لتخزين بيانات التبويب المفتوح حالياً (معرّفه، رابطه، نطاقه، كونه PDF، أو كونه مقيداً من المتصفح).
  let activeTabInfo = {
    // معرّف التبويب الرقمي في المتصفح لإرسال الرسائل المباشرة إليه.
    id: null,
    // الرابط الكامل للتبويب لاستخدامه التلقائي في نموذج بلاغات GitHub.
    url: "https://example.com",
    // اسم النطاق المختصر لعرضه في الشريط العلوي للنافذة المنبثقة.
    hostname: "example.com",
    // راية توضح ما إذا كان التبويب يعرض ملف PDF لإظهار شارة PDF الحمراء.
    isPdf: false,
    // راية توضح ما إذا كان المتصفح يمنع عمل الإضافات في هذه الصفحة (مثل chrome://).
    restricted: false,
    // نص السبب التوضيحي باللغة العربية عند كون الصفحة مقيدة.
    restrictedReason: ""
    // يغلق كائن معلومات التبويب النشط activeTabInfo.
  };
  // يحدد المدى الزمني الابتدائي للمخطط البياني المصغر في تبويب الاستهلاك بآخر 7 أيام ("7d").
  let chartRange = "7d";

  // يفحص ما إذا كانت النافذة تعمل داخل إضافة المتصفح الحقيقية أم داخل محاكي المنصة السحابية.
  const isExtensionEnv =
    // التحقق من وجود كائن chrome.
    typeof chrome !== "undefined" &&
    // التحقق من وجود واجهة التخزين storage.
    chrome.storage &&
    // التحقق من وجود المخزن المحلي local.
    chrome.storage.local &&
    // التحقق من وجود دالة الجلب get.
    typeof chrome.storage.local.get === "function";

  // يعرّف دالة مختصرة لجلب عناصر واجهة popup.html بواسطة المعرّف.
  const $ = (id) => document.getElementById(id);

  // Storage helpers
  // يعرّف دالة موحدة لقراءة أي مفتاح من تخزين الإضافة أو من localStorage في وضع المحاكاة.
  async function storageGet(key, fallback) {
    // يقرأ من تخزين الإضافة الرسمي عند توفره.
    if (isExtensionEnv) {
      // يعيد وعداً بجلب المفتاح المطلوب.
      return new Promise((resolve) => {
        // يطلب القيمة المخزنة للمفتاح key.
        chrome.storage.local.get([key], (res) => {
          // يعيد القيمة إن وُجدت أو يعود للقيمة الاحتياطية fallback.
          resolve(res && res[key] !== undefined ? res[key] : fallback);
          // يغلق استدعاء الجلب.
        });
        // يغلق الوعد البرمجي.
      });
      // يغلق فرع تخزين الإضافة.
    }
    // يقرأ من localStorage عند العمل داخل محاكي المنصة الحية (index.html).
    try {
      // يجلب النص الخام للمفتاح.
      const raw = localStorage.getItem(key);
      // يحلل النص كـ JSON أو يعيد fallback عند عدم وجوده.
      return raw ? JSON.parse(raw) : fallback;
      // يلتقط أي خطأ في التحليل النصي.
    } catch (_) {
      // يعيد القيمة الاحتياطية بأمان.
      return fallback;
      // يغلق كتلة الحماية.
    }
    // يغلق دالة القراءة storageGet.
  }

  // يعرّف دالة موحدة لحفظ أي مفتاح في تخزين الإضافة أو مزامنته حياً مع الصفحة الأم في المنصة.
  async function storageSet(key, val) {
    // يحفظ في تخزين الإضافة الرسمي إذا كانت البيئة إضافة متصفح.
    if (isExtensionEnv) {
      // يعيد وعداً ينتظر إتمام الكتابة في chrome.storage.local.
      return new Promise((resolve) => {
        // يخزن القيمة val تحت المفتاح key ثم يحل الوعد.
        chrome.storage.local.set({ [key]: val }, resolve);
        // يغلق الوعد البرمجي.
      });
      // يغلق فرع الحفظ في الإضافة.
    }
    // يحفظ في localStorage في وضع الويب والمحاكي.
    try {
      // يحول القيمة إلى نص JSON ويحفظها.
      localStorage.setItem(key, JSON.stringify(val));
      // يتجاهل قيود الكتابة إن وُجدت.
    } catch (_) {}
    // إذا كانت النافذة مدمجة داخل إطار iframe في صفحة المنصة الرئيسية (index.html)، يرسل التحديث فوراً للصفحة الأم!
    if (window.parent && window.parent !== window) {
      // يبث رسالة التزامن الحية ليستقبلها studio.js ويحدث ألوان وسطوع الصفحة أمام المستخدم لحظياً.
      window.parent.postMessage({ type: "MUSTAQBALAT_STUDIO_SYNC", key, value: val }, "*");
      // يغلق شرط التزامن مع الإطار الأب.
    }
    // يغلق دالة الحفظ storageSet.
  }

  // يعرّف دالة التحقق الصارم من صيغة كود اللون السداسي HEX المدخل يدوياً في تبويب الألوان.
  function sanitizeHex(hex) {
    // يعود للون الافتراضي إذا لم يكن المدخل نصاً.
    if (typeof hex !== "string") return "#F59E0B";
    // يزيل الفراغات المحيطة بالنص المدخل.
    const c = hex.trim();
    // يقبل صيغة الـ 6 خانات القياسية المسبوقة بـ # ويعيدها بأحرف كبيرة.
    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toUpperCase();
    // يوسع صيغة الـ 3 خانات المختصرة إلى 6 خانات كاملة.
    if (/^#[0-9a-fA-F]{3}$/.test(c)) {
      // يكرر كل خانة لونية مرتين لتكوين الكود القياسي.
      return ("#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]).toUpperCase();
      // يغلق شرط الصيغة المختصرة.
    }
    // يضيف علامة # تلقائياً إذا كتب المستخدم 6 خانات سداسية صحيحة بدونها.
    if (/^[0-9a-fA-F]{6}$/.test(c)) return ("#" + c).toUpperCase();
    // يعيد null أثناء كتابة المستخدم لكود غير مكتمل بعد حتى لا يمسح كتابته قبل إتمامها.
    return null;
    // يغلق دالة التحقق اللوني sanitizeHex.
  }

  // يعرّف دالة تفكيك كود اللون السداسي HEX إلى مركباته الرقمية الثلاث (R, G, B) لمزامنة أشرطة الألوان.
  function hexToRgb(hex) {
    // يضمن الحصول على كود سداسي صالح أو يعتمد العنبر الافتراضي.
    const valid = sanitizeHex(hex) || "#F59E0B";
    // يعيد كائناً بالقيم العشرية للقنوات الثلاث بين 0 و255.
    return {
      // قيمة القناة الحمراء R.
      r: parseInt(valid.slice(1, 3), 16),
      // قيمة القناة الخضراء G.
      g: parseInt(valid.slice(3, 5), 16),
      // قيمة القناة الزرقاء B.
      b: parseInt(valid.slice(5, 7), 16)
      // يغلق كائن القنوات اللونية.
    };
    // يغلق دالة hexToRgb.
  }

  // يعرّف دالة تجميع القنوات الرقمية الثلاث (R, G, B) وتحويلها مجدداً إلى كود سداسي HEX.
  function rgbToHex(r, g, b) {
    // دالة داخلية تقيد الرقم بين 0 و255 وتحوله لخانتين سداسيتين مسبوقتين بصفر عند اللزوم.
    const toH = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    // يركب الكود الكامل بأحرف كبيرة مسبوقاً بعلامة #.
    return ("#" + toH(r) + toH(g) + toH(b)).toUpperCase();
    // يغلق دالة rgbToHex.
  }

  // يعرّف المعادلة الرياضية لتحويل الفضاء اللوني الدائري (صبغة Hue، تشبع Sat، إضاءة Light) إلى فضاء RGB لرسم عجلة الألوان.
  function hslToRgb(h, s, l) {
    // يحسب شدة الكروما اللونية (Chroma) من الإضاءة والتشبع.
    const c = (1 - Math.abs(2 * l - 1)) * s;
    // يحسب المركبة اللونية الوسيطة الثانية تبعاً لزاوية الصبغة مقسومة على قطاعات من 60 درجة.
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    // يحسب مقدار الإزاحة الضوئية لمطابقة مستوى السطوع المطلوب.
    const m = l - c / 2;
    // يهيئ المركبات الأولية الثلاث بأصفار.
    let r = 0, g = 0, b = 0;
    // القطاع الأول (0°–60°): من الأحمر إلى الأصفر.
    if (h < 60) [r, g, b] = [c, x, 0];
    // القطاع الثاني (60°–120°): من الأصفر إلى الأخضر.
    else if (h < 120) [r, g, b] = [x, c, 0];
    // القطاع الثالث (120°–180°): من الأخضر إلى السماوي.
    else if (h < 180) [r, g, b] = [0, c, x];
    // القطاع الرابع (180°–240°): من السماوي إلى الأزرق.
    else if (h < 240) [r, g, b] = [0, x, c];
    // القطاع الخامس (240°–300°): من الأزرق إلى الأرجواني.
    else if (h < 300) [r, g, b] = [x, 0, c];
    // القطاع السادس (300°–360°): من الأرجواني عائداً للأحمر.
    else [r, g, b] = [c, 0, x];
    // يحول القيم النسبية الممزوجة مع m إلى أعداد صحيحة قياسية بين 0 و255.
    return {
      // القناة الحمراء النهائية.
      r: Math.round((r + m) * 255),
      // القناة الخضراء النهائية.
      g: Math.round((g + m) * 255),
      // القناة الزرقاء النهائية.
      b: Math.round((b + m) * 255)
      // يغلق كائن اللون الناتج.
    };
    // يغلق دالة التحويل الهندسي hslToRgb.
  }

  // Draw Interactive Color Wheel
  // يحتفظ بنسخة مخبأة في الذاكرة لبيانات بكسلات عجلة الألوان كي تُحسب مرة واحدة فقط ولا تعاد مع كل حركة فأرة!
  let wheelImageCache = null;
  // يعرّف دالة رسم عجلة الألوان التفاعلية الكاملة مع حلقة المعاينة الوسطى للون المختار حالياً.
  function drawColorWheel(selectedHex) {
    // يجلب عنصر لوحة الرسم الدائرية من تبويب الألوان في popup.html.
    const canvas = $("colorWheelCanvas");
    // يتوقف بأمان إذا لم يكن العنصر موجوداً.
    if (!canvas) return;
    // يحصل على سياق الرسم ثنائي الأبعاد.
    const ctx = canvas.getContext("2d");
    // يقرأ القطر الكامل للوحة بالبكسل (132 بكسل).
    const size = canvas.width;
    // يحسب نصف القطر لتحديد مركز الدائرة وحدودها.
    const radius = size / 2;

    // يبني خريطة بكسلات العجلة اللونية مرة واحدة فقط عند الفتح الأول ويحفظها في wheelImageCache.
    if (!wheelImageCache) {
      // ينشئ مصفوفة بيانات لونية خام بحجم اللوحة.
      const img = ctx.createImageData(size, size);
      // يمر عمودياً على كل صف بكسلات y.
      for (let y = 0; y < size; y++) {
        // يمر أفقياً على كل بكسل x داخل الصف الحالي.
        for (let x = 0; x < size; x++) {
          // يحسب البعد الأفقي للبكسل عن مركز الدائرة.
          const dx = x - radius;
          // يحسب البعد الرأسي للبكسل عن مركز الدائرة.
          const dy = y - radius;
          // يحسب المسافة الإقليدية الشعاعية من المركز إلى البكسل الحالي.
          const dist = Math.sqrt(dx * dx + dy * dy);
          // يحسب موقع البكسل داخل مصفوفة البيانات الرباعية (RGBA).
          const idx = (y * size + x) * 4;
          // يرسم اللون إذا وقع البكسل داخل محيط الدائرة.
          if (dist <= radius) {
            // يحسب زاوية البكسل بالدرجات (0–360) لتمثل صبغة اللون (Hue).
            const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
            // يحسب نسبة التشبع اللوني من المسافة الشعاعية (أبيض بالمنتصف وألوان مشبعة بالحواف).
            const sat = Math.min(1, dist / radius);
            // يوازن الإضاءة اللونية لتظهر جميع درجات الطيف زاهية وواضحة.
            const light = 1 - sat * 0.5;
            // يحول إحداثيات العجلة القطبية إلى قيم RGB عبر دالة hslToRgb السابقة.
            const rgb = hslToRgb(angle, sat, light);
            // يسجل مركبة اللون الأحمر للبكسل.
            img.data[idx] = rgb.r;
            // يسجل مركبة اللون الأخضر للبكسل.
            img.data[idx + 1] = rgb.g;
            // يسجل مركبة اللون الأزرق للبكسل.
            img.data[idx + 2] = rgb.b;
            // يجعل البكسل معتماً بالكامل (255).
            img.data[idx + 3] = 255;
            // أما البكسلات الواقعة خارج الدائرة في زوايا المربع فيجعلها شفافة تماماً.
          } else {
            // شفافية صفرية لخارج محيط العجلة.
            img.data[idx + 3] = 0;
            // يغلق شرط داخل/خارج الدائرة.
          }
          // يغلق حلقة الأعمدة الأفقية.
        }
        // يغلق حلقة الصفوف العمودية.
      }
      // يخزن صورة العجلة المحسوبة في الذاكرة لإعادة رسمها في أقل من 0.1 مللي ثانية لاحقاً.
      wheelImageCache = img;
      // يغلق شرط البناء الأولي لخريطة بكسلات العجلة.
    }

    // يطبع خريطة بكسلات العجلة المخزنة فوراً على لوحة الـ Canvas.
    ctx.putImageData(wheelImageCache, 0, 0);

    // Center preview ring with selected color
    // يبدأ رسم الدائرة المركزية التي تعرض اللون المختار حالياً في قلب عجلة الألوان.
    ctx.beginPath();
    // يرسم دائرة بنصف قطر 14 بكسل في مركز العجلة تماماً.
    ctx.arc(radius, radius, 14, 0, Math.PI * 2);
    // يملأ الدائرة باللون السداسي المختار حالياً.
    ctx.fillStyle = sanitizeHex(selectedHex) || "#F59E0B";
    // ينفذ تعبئة لون المعاينة المركزي.
    ctx.fill();
    // يحدد سماكة الإطار الأبيض الفاصل حول دائرة المعاينة بـ 2.5 بكسل.
    ctx.lineWidth = 2.5;
    // يضبط لون الإطار بالأبيض الناصع لإبراز اللون المختار.
    ctx.strokeStyle = "#FFFFFF";
    // ينفذ رسم الإطار الدائري الأبيض.
    ctx.stroke();
    // يغلق دالة رسم عجلة الألوان drawColorWheel.
  }

  // يعرّف دالة ربط تفاعلات النقر والسحب بالماوس على عجلة الألوان لاختيار أي لون بنعومة فورية.
  function setupColorWheelEvents() {
    // يجلب لوحة عجلة الألوان.
    const canvas = $("colorWheelCanvas");
    // يتوقف إن لم تتوفر اللوحة.
    if (!canvas) return;
    // يتتبع ما إذا كان زر الفأرة مضغوطاً حالياً للسماح بالسحب المستمر عبر أطياف العجلة.
    let dragging = false;

    // يعرّف دالة التقاط اللون الواقع تحت مؤشر الفأرة تماماً وتحويله إلى كود HEX وتطبيقه على الشاشة.
    const pickAt = (e) => {
      // يقرأ أبعاد وموقع العجلة الفعلي على الشاشة.
      const rect = canvas.getBoundingClientRect();
      // يحسب معامل التحجيم الأفقي بين حجم الرسم الداخلي وحجم العرض الظاهري.
      const scaleX = canvas.width / rect.width;
      // يحسب معامل التحجيم الرأسي المقابل.
      const scaleY = canvas.height / rect.height;
      // يستخرج الإحداثي الأفقي الدقيق لنقطة النقر داخل اللوحة.
      const x = (e.clientX - rect.left) * scaleX;
      // يستخرج الإحداثي الرأسي الدقيق لنقطة النقر.
      const y = (e.clientY - rect.top) * scaleY;
      // يحسب نصف قطر العجلة.
      const radius = canvas.width / 2;
      // يحسب البعد الأفقي عن المركز.
      const dx = x - radius;
      // يحسب البعد الرأسي عن المركز.
      const dy = y - radius;
      // يحسب المسافة الشعاعية عن المركز.
      const dist = Math.sqrt(dx * dx + dy * dy);
      // يتجاهل النقرات الواقعة خارج محيط الدائرة أو فوق دائرة المعاينة المركزية الصغيرة.
      if (dist > radius || dist < 14) return;

      // يستخرج زاوية الصبغة اللونية (Hue) المقابلة لموضع الفأرة.
      const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      // يستخرج درجة التشبع اللوني من المسافة الشعاعية.
      const sat = Math.min(1, dist / radius);
      // يستخرج درجة الإضاءة المقابلة.
      const light = 1 - sat * 0.5;
      // يحول القيم المستخرجة إلى مركبات RGB عبر hslToRgb.
      const rgb = hslToRgb(angle, sat, light);
      // يحول مركبات RGB إلى كود سداسي HEX عبر rgbToHex.
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      // يطبق اللون السداسي الجديد ويزامن كافة الحقول وأشرطة RGB ويحدث الشاشة فوراً!
      applyNewHexColor(hex, true);
      // يغلق دالة التقاط اللون pickAt.
    };

    // يبدأ السحب ويلتقط اللون فور ضغط زر الفأرة فوق العجلة.
    canvas.addEventListener("mousedown", (e) => {
      // يفعّل راية السحب المستمر.
      dragging = true;
      // يلتقط اللون عند موضع الضغطة الأولى.
      pickAt(e);
      // يغلق معالج mousedown.
    });
    // يواصل تحديث اللون بسلاسة أثناء تحريك الفأرة طالما الزر مضغوطاً.
    window.addEventListener("mousemove", (e) => {
      // يستدعي التقاط اللون فقط عند تفعيل السحب.
      if (dragging) pickAt(e);
      // يغلق معالج mousemove.
    });
    // ينهي حالة السحب فور إفلات زر الفأرة في أي مكان بالنافذة.
    window.addEventListener("mouseup", () => {
      // يصفر راية السحب.
      dragging = false;
      // يغلق معالج mouseup.
    });
    // يغلق دالة إعداد أحداث عجلة الألوان setupColorWheelEvents.
  }

  // يعرّف الدالة المركزية لتوحيد ومزامنة أي لون جديد عبر حقل HEX ومنتقي النظام وأشرطة RGB وعجلة الألوان وحفظه.
  function applyNewHexColor(hex, autoEnableTint) {
    // يتحقق من صحة الكود السداسي عبر دالة sanitizeHex.
    const valid = sanitizeHex(hex);
    // يتوقف إذا كان الكود غير مكتمل الصيغة بعد.
    if (!valid) return;
    // يفكك الكود الصالح إلى قنواته الرقمية الثلاث عبر hexToRgb.
    const rgb = hexToRgb(valid);
    // يحدث النص المعروض في حقل كود HEX.
    $("hexInput").value = valid;
    // يحدث قيمة منتقي ألوان النظام المدمج.
    $("nativeColorPicker").value = valid;
    // يحدث موضع شريط القناة الحمراء R.
    $("rgbR").value = rgb.r;
    // يحدث موضع شريط القناة الخضراء G.
    $("rgbG").value = rgb.g;
    // يحدث موضع شريط القناة الزرقاء B.
    $("rgbB").value = rgb.b;
    // يعرض الرقم العشري للقناة الحمراء بجوار شريطها.
    $("rgbRVal").textContent = rgb.r;
    // يعرض الرقم العشري للقناة الخضراء بجوار شريطها.
    $("rgbGVal").textContent = rgb.g;
    // يعرض الرقم العشري للقناة الزرقاء بجوار شريطها.
    $("rgbBVal").textContent = rgb.b;
    // يعيد رسم حلقة المعاينة الوسطى في عجلة الألوان باللون الجديد.
    drawColorWheel(valid);

    // يجهز كائن التحديث الجزئي حاملاً كود اللون الجديد.
    const patch = { tintColor: valid };
    // إذا طُلب التفعيل التلقائي لطبقة اللون فور اختيار اللون (كما عند النقر على العجلة أو المربعات الجاهزة):
    if (autoEnableTint) {
      // يفعّل خيار التلوين في الإعدادات.
      patch.tintEnabled = true;
      // يؤشر علامة الصح على مربع "تفعيل اللون" في الواجهة.
      $("tintEnabledCheck").checked = true;
      // يغلق شرط التفعيل التلقائي للون.
    }
    // يحفظ التحديث ويبثه فوراً للتبويب النشط لتتلون الشاشة باللون المختار في التو واللحظة.
    updateAndSave(patch);
    // يغلق دالة applyNewHexColor.
  }

  // يعرّف دالة بناء أزرار لوحات الألوان الطبية الثمان الجاهزة داخل تبويب الألوان.
  function renderSwatches() {
    // يجلب حاوية المربعات اللونية من واجهة popup.html.
    const container = $("swatchesContainer");
    // يتوقف إن لم توجد الحاوية.
    if (!container) return;
    // يفرغ الحاوية قبل بناء الأزرار.
    container.innerHTML = "";
    // يمر على كل لوحة لونية جاهزة في مصفوفة PRESET_PALETTES.
    PRESET_PALETTES.forEach((p) => {
      // ينشئ عنصر زر لكل درجة لونية جاهزة.
      const btn = document.createElement("button");
      // يحدد نوع الزر لمنع أي سلوك إرسال نماذج.
      btn.type = "button";
      // يمنحه الصنف التنسيقي المرسوم في popup.css.
      btn.className = "swatch-btn";
      // يلون خلفية الزر بكود HEX الخاص باللوحة.
      btn.style.backgroundColor = p.hex;
      // يضع تلميحاً عربياً يوضح اسم اللوحة وفائدتها وكودها السداسي عند تمرير الفأرة.
      btn.title = `${p.name} (${p.hex})`;
      // يربط النقر على المربع بتطبيق لونه وشفافيته المثالية ونمط دمجه دفعة واحدة.
      btn.addEventListener("click", () => {
        // يحدث شريط شفافية اللون بالقيمة الموصى بها لهذه اللوحة.
        $("tintOpacityRange").value = p.opacity;
        // يحدث النص المئوي لشدة اللون.
        $("tintOpacityVal").textContent = `${p.opacity}%`;
        // يحدث قائمة نمط الدمج البصري (مثل multiply أو soft-light).
        $("tintBlendSelect").value = p.blend;
        // يحفظ الشفافية ونمط الدمج الجديدين.
        updateAndSave({
          // الشفافية المختارة من اللوحة.
          tintOpacity: p.opacity,
          // نمط الدمج المختار من اللوحة.
          tintBlendMode: p.blend
          // يغلق كائن تحديث الشفافية والدمج.
        });
        // يطبق كود اللون السداسي ويفعل التلوين عبر دالة applyNewHexColor.
        applyNewHexColor(p.hex, true);
        // يغلق معالج نقر الزر اللوني.
      });
      // يدرج زر اللوحة داخل شبكة الألوان في الواجهة.
      container.appendChild(btn);
      // يغلق حلقة بناء اللوحات الجاهزة.
    });
    // يغلق دالة renderSwatches.
  }

  // يعرّف دالة التعرف التلقائي على التبويب المفتوح حالياً وفحص ما إذا كان ملف PDF أو صفحة مقيدة من المتصفح.
  async function detectActiveTab() {
    // يستعلم عن التبويب الحقيقي عبر واجهة chrome.tabs عند العمل داخل الإضافة.
    if (isExtensionEnv && chrome.tabs && chrome.tabs.query) {
      // يفتح كتلة حماية للاستعلام عن التبويب النشط.
      try {
        // يجلب التبويب النشط في النافذة الحالية للمستخدم.
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        // يتحقق من توفر بيانات التبويب ورابطه.
        if (tab && tab.url) {
          // يحفظ معرّف التبويب الرقمي لمخاطبته بالرسائل المباشرة.
          activeTabInfo.id = tab.id;
          // يحفظ الرابط الكامل للتبويب.
          activeTabInfo.url = tab.url;
          // يكتشف كون الرابط ملف PDF إذا انتهى بـ .pdf.
          activeTabInfo.isPdf = tab.url.toLowerCase().endsWith(".pdf");
          // يحاول استخراج اسم النطاق الصافي من الرابط.
          try {
            // يستخرج hostname أو يصنفه كملف محلي.
            activeTabInfo.hostname = new URL(tab.url).hostname || "local-file";
            // يلتقط الروابط الداخلية الخاصة بالمتصفح.
          } catch (_) {
            // يستخرج اسم البروتوكول كبادئة بديلة.
            activeTabInfo.hostname = tab.url.split(":")[0] || "browser";
            // يغلق كتلة تحليل اسم النطاق.
          }

          // يسأل عامل الخدمة الخلفي (service-worker.js) عما إذا كان هذا الرابط محظوراً أمنياً من المتصفح.
          if (chrome.runtime && chrome.runtime.sendMessage) {
            // يرسل رسالة فحص توافقية الرابط.
            chrome.runtime.sendMessage(
              // حمولة الرسالة متضمنة نوع الطلب ورابط التبويب.
              { type: "MUSTAQBALAT_CHECK_URL_SUPPORT", url: tab.url },
              // يستقبل رد عامل الخدمة الخلفي.
              (resp) => {
                // إذا أفاد عامل الخدمة بأن الصفحة مقيدة من المتصفح:
                if (resp && resp.restricted) {
                  // يرفع راية التقييد في معلومات التبويب.
                  activeTabInfo.restricted = true;
                  // يحفظ سبب التقييد العربي الواضح لعرضه في الشريط التحذيري.
                  activeTabInfo.restrictedReason = resp.reason;
                  // يعيد رسم شريط الموقع العلوي لإظهار التنبيه للمستخدم فوراً.
                  renderSiteHeader();
                  // يغلق شرط الصفحة المقيدة.
                }
                // يغلق دالة استلام رد الفحص.
              }
              // يغلق إرسال رسالة الفحص.
            );
            // يغلق شرط توفر إرسال الرسائل.
          }
          // يغلق شرط وجود رابط التبويب.
        }
        // يتجاهل أي خطأ عابر في استعلام التبويبات.
      } catch (_) {}
      // وفي وضع المحاكاة داخل منصة الويب الحية (index.html)، يعيّن بيانات صفحة الاختبار الحية.
    } else {
      // Web Studio simulator mode
      // يحدد رابط صفحة الاختبار التفاعلية في المنصة.
      activeTabInfo.url = window.location.origin + "/demo-page";
      // يعرض اسم نطاق المنصة الحالي في شريط الموقع.
      activeTabInfo.hostname = window.location.hostname || "mustaqbalat.web.app";
      // يغلق فرع وضع المحاكاة.
    }
    // يرسم شريط معلومات الموقع العلوي بالبيانات المستنتجة.
    renderSiteHeader();
    // يملأ حقل رابط الموقع تلقائياً داخل تبويب بلاغات GitHub لتوفير وقت المستخدم عند الإبلاغ!
    $("issueSiteUrlInput").value = activeTabInfo.url;
    // يغلق دالة detectActiveTab.
  }

  // يعرّف دالة تحديث شريط معلومات الموقع العلوي وحالة الاستثناء والتنبيهات الأمنية.
  function renderSiteHeader() {
    // يعرض اسم نطاق الموقع الحالي في الشريط العلوي.
    $("currentHostLabel").textContent = activeTabInfo.hostname;
    // يظهر أو يخفي شارة "PDF" الحمراء بناءً على نوع المستند المفتوح.
    $("pdfDetectedBadge").hidden = !activeTabInfo.isPdf;

    // يفحص ما إذا كان النطاق الحالي مدرجاً في قائمة المواقع المستثناة من التعتيم.
    const isExcluded =
      // يتأكد من مصفوفية القائمة واحتوائها على اسم النطاق.
      Array.isArray(settings.excludedSites) &&
      // يبحث عن تطابق اسم النطاق الحالي.
      settings.excludedSites.includes(activeTabInfo.hostname);
    // يحسب فعالية الأداة على الموقع الحالي (مفعّلة عالمياً + غير مستثناة + الصفحة غير مقيدة من المتصفح).
    const active = settings.globalEnabled && !isExcluded && !activeTabInfo.restricted;

    // يلون النقطة المضيئة بالأخضر عند الفعالية أو بالرمادي عند التوقف.
    $("siteDot").className = active ? "site-dot" : "site-dot off";
    // يغير نص زر الاستثناء السريع بين "استثناء الموقع" و"تفعيل بالموقع" حسب حالته الحالية.
    $("toggleSiteExcludeBtn").textContent = isExcluded ? "تفعيل بالموقع" : "استثناء الموقع";

    // يفحص وجود قيد أمني من المتصفح لإظهار لافتة التوضيح الحمراء أعلى التبويبات.
    if (activeTabInfo.restricted) {
      // يظهر اللافتة التحذيرية للمستخدم.
      $("restrictedBanner").hidden = false;
      // يكتب السبب التقني الدقيق لمنع المتصفح لعمل الإضافات هنا.
      $("restrictedReasonText").textContent = activeTabInfo.restrictedReason;
      // يخفي اللافتة في جميع المواقع العادية المتوافقة.
    } else {
      // يبقي اللافتة التحذيرية مخفية.
      $("restrictedBanner").hidden = true;
      // يغلق شرط اللافتة التحذيرية.
    }
    // يغلق دالة renderSiteHeader.
  }

  // يعرّف دالة تعبئة ومزامنة جميع أشرطة وقوائم وحقول النافذة المنبثقة بالقيم المحفوظة في كائن settings.
  function populateControlsFromSettings() {
    // يضبط حالة المفتاح الرئيسي الشامل أعلى النافذة.
    $("globalEnabledToggle").checked = Boolean(settings.globalEnabled);
    // يحدث النص المرافق للمفتاح الرئيسي بين "مفعّل للكل" و"متوقف مؤقتاً".
    $("globalStateText").textContent = settings.globalEnabled ? "مفعّل للكل" : "متوقف مؤقتاً";

    // يضبط قيمة شريط السطوع.
    $("brightnessRange").value = settings.brightness;
    // يعرض النسبة المئوية للسطوع في الشارة المقابلة.
    $("brightnessVal").textContent = `${settings.brightness}%`;

    // يضبط قيمة شريط طبقة التعتيم الفوقية (Overlay).
    $("overlayRange").value = settings.overlayOpacity;
    // يعرض النسبة المئوية لطبقة التعتيم.
    $("overlayVal").textContent = `${settings.overlayOpacity}%`;

    // يضبط القائمة المنسدلة لآلية خفض السطوع.
    $("methodSelect").value = settings.method || "hybrid";
    // يضبط القائمة المنسدلة لأنماط الوضع الداكن.
    $("darkModeSelect").value = settings.darkMode || "off";

    // يضبط شريط تخفيف وهج البياض.
    $("pageColorDimRange").value = settings.pageColorDim;
    // يعرض نسبة تخفيف وهج البياض.
    $("pageColorDimVal").textContent = `${settings.pageColorDim}%`;

    // يضبط شريط تباين النصوص.
    $("contrastRange").value = settings.contrast;
    // يعرض نسبة التباين الحالية.
    $("contrastVal").textContent = `${settings.contrast}%`;

    // يضبط خانة تفعيل دعم ملفات الـ PDF.
    $("pdfEnabledCheck").checked = Boolean(settings.pdfEnabled);
    // يضبط شريط التعتيم الإضافي لصفحات الـ PDF.
    $("pdfExtraDimRange").value = settings.pdfExtraDim;
    // يعرض نسبة التعتيم الإضافي للـ PDF.
    $("pdfExtraDimVal").textContent = `${settings.pdfExtraDim}%`;

    // يضبط خانة تفعيل طبقة تلوين الشاشة HEX.
    $("tintEnabledCheck").checked = Boolean(settings.tintEnabled);
    // يضبط شريط شدة وشفافية اللون.
    $("tintOpacityRange").value = settings.tintOpacity;
    // يعرض نسبة شدة اللون المئوية.
    $("tintOpacityVal").textContent = `${settings.tintOpacity}%`;
    // يضبط قائمة نمط دمج الطبقة اللونية.
    $("tintBlendSelect").value = settings.tintBlendMode || "multiply";

    // يستخرج كود اللون السداسي المعتمد لتحديث أدوات الألوان المترابطة.
    const hex = sanitizeHex(settings.tintColor) || "#F59E0B";
    // يفكك اللون السداسي إلى مركبات RGB الثلاث.
    const rgb = hexToRgb(hex);
    // يملأ حقل كود HEX النصي.
    $("hexInput").value = hex;
    // يحدث منتقي ألوان النظام.
    $("nativeColorPicker").value = hex;
    // يحدث شريط اللون الأحمر R.
    $("rgbR").value = rgb.r;
    // يحدث شريط اللون الأخضر G.
    $("rgbG").value = rgb.g;
    // يحدث شريط اللون الأزرق B.
    $("rgbB").value = rgb.b;
    // يعرض رقم القناة الحمراء.
    $("rgbRVal").textContent = rgb.r;
    // يعرض رقم القناة الخضراء.
    $("rgbGVal").textContent = rgb.g;
    // يعرض رقم القناة الزرقاء.
    $("rgbBVal").textContent = rgb.b;
    // يرسم عجلة الألوان مع وضع اللون الحالي في حلقة المعاينة الوسطى.
    drawColorWheel(hex);

    // يضبط شريط دفء الألوان وتصفية الأزرق.
    $("warmthRange").value = settings.warmth;
    // يعرض نسبة دفء الألوان.
    $("warmthVal").textContent = `${settings.warmth}%`;

    // يضبط شريط تشبع ألوان عناصر الصفحة.
    $("saturationRange").value = settings.saturation;
    // يعرض نسبة التشبع اللوني.
    $("saturationVal").textContent = `${settings.saturation}%`;

    // يضبط شريط تدوير طيف اللون بالدرجات.
    $("hueRotateRange").value = settings.hueRotate;
    // يعرض زاوية تدوير الطيف اللوني متبوعة برمز الدرجة.
    $("hueRotateVal").textContent = `${settings.hueRotate}°`;

    // يضبط خانة إظهار مؤشر الاستهلاك الحي داخل الصفحة.
    $("showHudCheck").checked = Boolean(settings.showInPageHud);
    // يضبط قائمة اختيار زاوية المؤشر داخل الصفحة.
    $("hudPosSelect").value = settings.hudPosition || "bottom-left";
    // يملأ حقل اسم مستودع GitHub المرتبط بالبلاغات.
    $("githubRepoInput").value = settings.githubRepo || "Mohamed7AbdELhalim/Mustaqbalat";

    // يحدّث شريط الموقع العلوي ليتماشى مع الإعدادات المعروضة.
    renderSiteHeader();
    // يغلق دالة تعبئة عناصر الواجهة populateControlsFromSettings.
  }

  // يعرّف دالة حفظ أي تعديل جزئي وإرساله في التو إلى التبويب النشط وتحديث قراءة الاستهلاك الحي.
  async function updateAndSave(partial) {
    // يدمج الحقول المعدلة في كائن settings المحلي.
    settings = Object.assign({}, settings, partial);
    // يحفظ الإعدادات المحدثة عبر دالة storageSet (التي تزامن كل التبويبات أو تحدّث المنصة الحية).
    await storageSet(STORAGE_KEY_SETTINGS, settings);

    // يرسل رسالة تحديث فورية للتبويب النشط لاسترجاع زمن المعالجة واستهلاك الذاكرة الجديدين مباشرة.
    if (isExtensionEnv && activeTabInfo.id && chrome.tabs && chrome.tabs.sendMessage) {
      // يخاطب المحرك المحقون في التبويب النشط.
      chrome.tabs.sendMessage(
        // معرّف التبويب النشط.
        activeTabInfo.id,
        // نوع الرسالة والتعديل الجزئي الممرر.
        { type: "MUSTAQBALAT_UPDATE_SETTINGS", payload: partial },
        // يستقبل القياسات المحدثة من المحرك بعد تطبيقه للتعديل.
        (resp) => {
          // يتجاهل الخطأ إن كانت الصفحة داخلية لا تحوي سكربت محتوى.
          if (chrome.runtime.lastError) return;
          // يحدث أرقام الاستهلاك المعروضة في تبويب "الاستهلاك" بالقيم الحقيقية الواردة.
          if (resp && resp.telemetry) renderLiveTelemetry(resp.telemetry);
          // يغلق دالة رد الرسالة.
        }
        // يغلق إرسال الرسالة للتبويب.
      );
      // يغلق شرط إرسال الرسالة الفورية.
    }
    // يعيد تحديث شريط معلومات الموقع العلوي.
    renderSiteHeader();
    // يغلق دالة updateAndSave.
  }

  // يعرّف دالة عرض أرقام استهلاك النظام الفورية في المربعات الأربعة داخل تبويب "الاستهلاك".
  function renderLiveTelemetry(t) {
    // يتوقف إذا لم تتوفر قراءة قياسية.
    if (!t) return;
    // يعرض حجم ذاكرة الأداة داخل الصفحة بالكيلوبايت.
    $("liveFootprintKB").textContent = `${t.extensionFootprintKB || 18} KB`;
    // يعرض زمن المعالجة في المعالج بالمللي ثانية.
    $("liveApplyMs").textContent = `${Number(t.lastApplyMs || 0.22).toFixed(2)} ms`;
    // يعرض معدل سلاسة الإطارات بالثانية (FPS).
    $("liveFps").textContent = `${t.fps || 60} FPS`;
    // يعرض عدد عناصر الطبقات الخفيفة المزروعة في الصفحة.
    $("liveDomNodes").textContent = `${t.domNodes || 6} عناصر`;
    // يظهر شارة PDF في الأعلى إذا أكد المحرك اكتشاف عنصر PDF داخل الصفحة.
    if (t.isPdf) $("pdfDetectedBadge").hidden = false;
    // يغلق دالة renderLiveTelemetry.
  }

  // يعرّف دالة طلب القياسات الحية من التبويب المفتوح أو من المحرك المباشر في منصة الويب.
  function pollActiveTabTelemetry() {
    // يطلب اللقطة الحية عبر رسائل التبويبات في بيئة الإضافة.
    if (isExtensionEnv && activeTabInfo.id && chrome.tabs && chrome.tabs.sendMessage) {
      // يرسل طلب MUSTAQBALAT_GET_TELEMETRY إلى المحرك في التبويب الحالي.
      chrome.tabs.sendMessage(
        // معرّف التبويب المستهدف.
        activeTabInfo.id,
        // رسالة طلب القياسات الحية.
        { type: "MUSTAQBALAT_GET_TELEMETRY" },
        // يستلم رد المحرك.
        (resp) => {
          // يتجاهل الصفحات التي لا يعمل بها المحرك (مثل صفحات النظام).
          if (chrome.runtime.lastError) return;
          // يعرض القياسات المستلمة في الواجهة.
          if (resp && resp.telemetry) renderLiveTelemetry(resp.telemetry);
          // يغلق دالة استلام الرد.
        }
        // يغلق استدعاء sendMessage.
      );
      // وفي وضع المحاكاة داخل المنصة الحية، يقرأ القياسات مباشرة من محرك الصفحة الأم!
    } else if (window.parent && window.parent.MustaqbalatEngine) {
      // يعرض القياسات الحقيقية الحية للمنصة المفتوحة حالياً.
      renderLiveTelemetry(window.parent.MustaqbalatEngine.getLiveTelemetry());
      // يغلق فرع قراءة قياسات المنصة الحية.
    }
    // يغلق دالة pollActiveTabTelemetry.
  }

  // Mini Usage Chart (Days & Weeks)
  // يعرّف دالة رسم المخطط البياني المصغر لاستهلاك الأيام السبعة أو الأسابيع الأربعة داخل تبويب "الاستهلاك".
  async function renderMiniUsageChart() {
    // يجلب السجل التاريخي للاستهلاك من التخزين عبر دالة storageGet.
    const history = (await storageGet(STORAGE_KEY_USAGE, {})) || {};
    // يجلب لوحة الرسم المصغرة من الواجهة.
    const canvas = $("miniUsageChart");
    // يتوقف إن لم توجد اللوحة.
    if (!canvas) return;
    // يحصل على سياق الرسم ثنائي الأبعاد.
    const ctx = canvas.getContext("2d");
    // يقرأ عرض اللوحة المصغرة.
    const w = canvas.width;
    // يقرأ ارتفاع اللوحة المصغرة.
    const h = canvas.height;
    // ينظف اللوحة بالكامل تمهيداً لإعادة الرسم.
    ctx.clearRect(0, 0, w, h);

    // ينشئ مصفوفة النقاط الزمنية التي سترسم كأعمدة بيانية.
    const points = [];
    // يلتقط التاريخ الحالي لبناء السلسلة الزمنية.
    const now = new Date();

    // يبني 7 نقاط يومية متتالية إذا اختار المستخدم عرض "7 أيام".
    if (chartRange === "7d") {
      // يمر من قبل 6 أيام حتى اليوم الحالي (0).
      for (let i = 6; i >= 0; i--) {
        // ينشئ كائن تاريخ لليوم المستهدف.
        const d = new Date(now);
        // يضبط التاريخ بطرح i أيام.
        d.setDate(now.getDate() - i);
        // يستخرج مفتاح التاريخ القياسي YYYY-MM-DD.
        const key = d.toISOString().slice(0, 10);
        // يبحث عن سجل ذلك اليوم في التاريخ المخزن.
        const item = history[key] || null;
        // يضيف بيانات اليوم إلى مصفوفة الرسم points.
        points.push({
          // تسمية مختصرة بالشهر واليوم.
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          // دقائق التفعيل في ذلك اليوم.
          minutes: item ? item.activeMinutes : i === 0 ? 1 : 0,
          // متوسط الذاكرة بالكيلوبايت في ذلك اليوم.
          memKB: item ? item.avgFootprintKB : i === 0 ? 18 : 0,
          // عدد الصفحات المحمية في ذلك اليوم.
          pages: item ? item.pagesCount : i === 0 ? 1 : 0
          // يغلق كائن النقطة اليومية.
        });
        // يغلق حلقة الأيام السبعة.
      }
      // ويبني 4 نقاط أسبوعية مجمعة إذا اختار المستخدم عرض "4 أسابيع".
    } else {
      // يمر من قبل 3 أسابيع حتى الأسبوع الحالي (0).
      for (let wk = 3; wk >= 0; wk--) {
        // يصفر عداد دقائق الأسبوع.
        let mins = 0;
        // يصفر مجموع متوسطات الذاكرة للأسبوع.
        let memSum = 0;
        // يصفر عدد الأيام المسجلة في الأسبوع.
        let memCnt = 0;
        // يصفر عداد صفحات الأسبوع.
        let pages = 0;
        // يجمع الأيام السبعة الواقعة ضمن هذا الأسبوع.
        for (let dIdx = 0; dIdx < 7; dIdx++) {
          // ينشئ كائن التاريخ لليوم الفرعي.
          const d = new Date(now);
          // يضبط تاريخ اليوم الفرعي.
          d.setDate(now.getDate() - (wk * 7 + dIdx));
          // يستخرج المفتاح النصي للتاريخ.
          const key = d.toISOString().slice(0, 10);
          // يقرأ بيانات ذلك اليوم إن وُجدت.
          const item = history[key];
          // يراكم القيم إذا وجد نشاطاً مسجلاً في ذلك اليوم.
          if (item) {
            // يجمع دقائق النشاط.
            mins += item.activeMinutes || 0;
            // يجمع قراءة الذاكرة بالكيلوبايت.
            memSum += item.avgFootprintKB || 18;
            // يزيد عداد الأيام النشطة.
            memCnt++;
            // يجمع عدد الصفحات.
            pages += item.pagesCount || 0;
            // يغلق شرط وجود نشاط يومي.
          }
          // يغلق حلقة أيام الأسبوع.
        }
        // يدفع ملخص الأسبوع المجمع إلى مصفوفة الرسم points.
        points.push({
          // تسمية الأسبوع بالعربية.
          label: wk === 0 ? "هذا الأسبوع" : `قبل ${wk} أ`,
          // إجمالي دقائق الأسبوع مقرباً.
          minutes: Number(mins.toFixed(1)),
          // متوسط الذاكرة الأسبوعي بالكيلوبايت.
          memKB: memCnt ? Math.round(memSum / memCnt) : wk === 0 ? 18 : 0,
          // إجمالي الصفحات الأسبوعي.
          pages: pages || (wk === 0 ? 1 : 0)
          // يغلق كائن النقطة الأسبوعية.
        });
        // يغلق حلقة الأسابيع الأربعة.
      }
      // يغلق فرع التجميع الأسبوعي.
    }

    // يحسب إجمالي الدقائق الكلي عبر نقاط المخطط لتحديث شريط الملخص أسفل المخطط.
    const totalMins = points.reduce((s, p) => s + p.minutes, 0);
    // يرشح النقاط ذات قراءة الذاكرة الفعلية لحساب المتوسط الصحيح.
    const nonZeroMem = points.filter((p) => p.memKB > 0);
    // يحسب متوسط الذاكرة بالكيلوبايت عبر الفترة المعروضة.
    const avgMem = nonZeroMem.length
      // يقسم مجموع الذاكرة على عدد النقاط النشطة.
      ? Math.round(nonZeroMem.reduce((s, p) => s + p.memKB, 0) / nonZeroMem.length)
      // يعود لـ 18 كيلوبايت كقيمة ابتدائية مرجعية.
      : 18;
    // يحسب إجمالي عدد الصفحات عبر الفترة المعروضة.
    const totalPages = points.reduce((s, p) => s + p.pages, 0);

    // يعرض إجمالي وقت التفعيل بالساعات (إذا بلغ 60 دقيقة فأكثر) أو بالدقائق في شريط الملخص.
    $("sumActiveTime").textContent =
      // تنسيق الساعات أو الدقائق.
      totalMins >= 60 ? `${(totalMins / 60).toFixed(1)} س` : `${Math.max(1, Math.round(totalMins))} د`;
    // يعرض متوسط استهلاك الذاكرة بالكيلوبايت في شريط الملخص.
    $("sumAvgMem").textContent = `${avgMem} KB`;
    // يعرض إجمالي عدد الصفحات وملفات الـ PDF المعالجة في شريط الملخص.
    $("sumPagesCount").textContent = `${Math.max(1, totalPages)}`;

    // يحدد القيمة العظمى لمحور الرسم الرأسي بحد أدنى 10 دقائق لتناسق الأعمدة.
    const maxVal = Math.max(10, ...points.map((p) => p.minutes));
    // يحدد الهامش الأيسر للرسم.
    const padLeft = 18;
    // يحدد الهامش الأيمن للرسم.
    const padRight = 18;
    // يحدد الهامش العلوي للرسم.
    const padTop = 16;
    // يحدد الهامش السفلي المخصص لتسميات التواريخ.
    const padBottom = 24;
    // يحسب العرض الصافي لمنطقة الأعمدة.
    const plotW = w - padLeft - padRight;
    // يحسب الارتفاع الصافي لمنطقة الأعمدة.
    const plotH = h - padTop - padBottom;
    // يحسب عرض الخانة الأفقية لكل نقطة زمنية.
    const step = plotW / points.length;

    // Grid lines
    // يضبط لون خطوط الشبكة الخلفية الخفيفة.
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    // يحدد سماكة الخط ببكسل واحد.
    ctx.lineWidth = 1;
    // يرسم 3 خطوط إرشادية أفقية خلف الأعمدة.
    for (let g = 0; g <= 2; g++) {
      // يحسب الموضع الرأسي للخط الإرشادي.
      const gy = padTop + (plotH * g) / 2;
      // يبدأ مسار الخط.
      ctx.beginPath();
      // ينطلق من الهامش الأيسر.
      ctx.moveTo(padLeft, gy);
      // يمتد حتى الهامش الأيمن.
      ctx.lineTo(w - padRight, gy);
      // ينفذ رسم الخط على اللوحة.
      ctx.stroke();
      // يغلق حلقة الخطوط الإرشادية.
    }

    // Bars (Active Minutes) + Dots (Memory KB)
    // يمر على النقاط الزمنية لرسم الأعمدة المتدرجة باللون العنبري وتسمياتها السفلية.
    points.forEach((p, idx) => {
      // يحدد عرض العمود المتناسق مع عدد النقاط.
      const barW = Math.min(28, step * 0.55);
      // يحسب موقع العمود الأفقي متوسطاً داخل خانته.
      const x = padLeft + idx * step + (step - barW) / 2;
      // يحسب ارتفاع العمود نسبياً إلى القيمة العظمى maxVal.
      const barH = Math.max(3, (p.minutes / maxVal) * plotH);
      // يحسب الإحداثي العلوي للعمود.
      const y = padTop + plotH - barH;

      // ينشئ تدرجاً عنبرياً أنيقاً من الأعلى للأسفل.
      const grad = ctx.createLinearGradient(0, y, 0, padTop + plotH);
      // لون العنبر الساطع في قمة العمود.
      grad.addColorStop(0, "#F59E0B");
      // لون العنبر الشفاف في قاعدة العمود.
      grad.addColorStop(1, "rgba(245, 158, 11, 0.25)");
      // يعتمد التدرج للتعبئة.
      ctx.fillStyle = grad;
      // يبدأ رسم العمود المستدير الزوايا.
      ctx.beginPath();
      // يرسم مستطيلاً مستدير الحواف بقطر 4 بكسل.
      ctx.roundRect(x, y, barW, barH, 4);
      // يملأ العمود بالتدرج اللوني.
      ctx.fill();

      // يضبط لون تسمية التاريخ بالرمادي الهادئ.
      ctx.fillStyle = "#94A3B8";
      // يحدد حجم الخط بـ 10 بكسل ليناسب عرض النافذة المنبثقة.
      ctx.font = "10px system-ui, sans-serif";
      // يوسطن النص تحت العمود.
      ctx.textAlign = "center";
      // يطبع التاريخ أو رقم الأسبوع أسفل العمود.
      ctx.fillText(p.label, x + barW / 2, h - 7);
      // يغلق حلقة رسم الأعمدة المصغرة.
    });
    // يغلق دالة رسم المخطط المصغر renderMiniUsageChart.
  }

  // Broken Sites & GitHub Issues
  // يعرّف دالة عرض قائمة المواقع المبلّغ عن عدم توافقها أو المستثناة داخل تبويب "جيت هاب".
  async function renderBrokenSitesList() {
    // يقرأ مصفوفة المواقع المحفوظة محلياً تحت المفتاح STORAGE_KEY_BROKEN_SITES.
    const list = (await storageGet(STORAGE_KEY_BROKEN_SITES, [])) || [];
    // يحدث شارة العدد الإجمالي للمواقع المسجلة.
    $("brokenCountBadge").textContent = list.length;
    // يجلب عنصر القائمة غير المرتبة (ul) لعرض المواقع بداخلها.
    const ul = $("brokenSitesList");
    // إذا كانت القائمة خالية، يعرض رسالة توضيحية هادئة وينهي الدالة.
    if (!list.length) {
      // يضع عنصر القائمة الفارغة.
      ul.innerHTML = `<li class="empty-item">لا توجد مواقع مبلّغ عنها حالياً.</li>`;
      // ينهي التنفيذ لعدم وجود عناصر.
      return;
      // يغلق شرط القائمة الخالية.
    }
    // يفرغ القائمة تمهيداً لبناء عناصر المواقع المسجلة.
    ul.innerHTML = "";
    // يعرض أحدث 12 موقعاً مسجلاً مع زر فتح البلاغ في GitHub وزر الحذف من القائمة.
    list.slice(0, 12).forEach((entry) => {
      // ينشئ عنصر سطر جديد (li) للموقع.
      const li = document.createElement("li");
      // يملأ السطر باسم النطاق وزري الإرسال إلى GitHub والحذف المحلي.
      li.innerHTML = `
        <!-- عرض نطاق أو رابط الموقع المبلّغ عنه -->
        <span dir="ltr" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px;">
          ${entry.hostname || entry.siteUrl}
        </span>
        <!-- أزرار فتح التذكرة في GitHub أو إزالة الموقع من السجل -->
        <div style="display:flex;gap:4px;">
          <button type="button" class="btn-xs" data-open-gh="${entry.siteUrl}">GitHub ↗</button>
          <button type="button" class="btn-xs" data-remove-id="${entry.id}">✕</button>
        </div>
      `;
      // يلحق العنصر بالقائمة في الواجهة.
      ul.appendChild(li);
      // يغلق حلقة بناء عناصر المواقع المسجلة.
    });

    // يربط أزرار "GitHub ↗" بفتح تذكرة مشكلة معبأة مسبقاً لذلك الموقع على مستودع المشروع.
    ul.querySelectorAll("[data-open-gh]").forEach((btn) => {
      // يسجل حدث النقر على زر الإرسال لـ GitHub.
      btn.addEventListener("click", () => {
        // يولد رابط تذكرة GitHub المعبأة عبر دالة createGitHubIssueLink.
        const url = createGitHubIssueLink({
          // يأخذ رابط الموقع المخزن في سمة الزر.
          siteUrl: btn.getAttribute("data-open-gh"),
          // يصنف البلاغ كموقع غير متوافق.
          type: "site-incompatible",
          // يضع وصفاً افتراضياً يوضح مصدر البلاغ من السجل المحلي.
          description: "موقع مسجل في قائمة المواقع التي لم تستجب للإضافة."
          // يغلق معاملات توليد الرابط.
        });
        // يفتح صفحة البلاغ في تبويب جديد عبر دالة openUrl.
        openUrl(url);
        // يغلق معالج نقر زر GitHub.
      });
      // يغلق حلقة أزرار GitHub.
    });

    // يربط أزرار الحذف "✕" بإزالة الموقع من السجل المحلي وتحديث العرض فوراً.
    ul.querySelectorAll("[data-remove-id]").forEach((btn) => {
      // يسجل حدث النقر لحذف البلاغ المحلي.
      btn.addEventListener("click", async () => {
        // يقرأ معرّف البلاغ المراد حذفه.
        const id = btn.getAttribute("data-remove-id");
        // يجلب القائمة الحالية من التخزين.
        const curr = (await storageGet(STORAGE_KEY_BROKEN_SITES, [])) || [];
        // يستبعد العنصر المطابق للمعرّف id.
        const filtered = curr.filter((x) => x.id !== id);
        // يحفظ القائمة المنقحة في التخزين.
        await storageSet(STORAGE_KEY_BROKEN_SITES, filtered);
        // يعيد رسم القائمة المحدثة أمام المستخدم.
        renderBrokenSitesList();
        // يغلق معالج الحذف.
      });
      // يغلق حلقة أزرار الحذف.
    });
    // يغلق دالة عرض المواقع المسجلة renderBrokenSitesList.
  }

  // يعرّف دالة تكوين رابط صفحة GitHub New Issue المعبأ بالكامل بالتفاصيل التقنية للمشكلة أو للموقع الرافض للعمل.
  function createGitHubIssueLink({ siteUrl, type, description }) {
    // يقرأ اسم المستودع (Owner/Repo) من حقل الإدخال أو يستخدم المستودع الرسمي Mohamed7AbdELhalim/Mustaqbalat.
    const repo = ($("githubRepoInput").value || "Mohamed7AbdELhalim/Mustaqbalat").trim();
    // يتحقق مما إذا كان نوع البلاغ يخص موقعاً لم تعمل معه الإضافة.
    const isSite = type === "site-incompatible";
    // يتحقق مما إذا كان البلاغ اقتراح تحسين أو ميزة جديدة.
    const isFeature = type === "feature-request";
    // يختار البادئة النصية الدقيقة لعنوان التذكرة حسب النوع.
    const prefix = isSite
      // بادئة المواقع الرافضة أو غير المتوافقة.
      ? "[موقع لم تعمل معه الإضافة]"
      // يفحص حالة الاقتراح.
      : isFeature
      // بادئة اقتراحات التطوير.
      ? "[اقتراح ميزة]"
      // بادئة الأخطاء التقنية العامة.
      : "[مشكلة تقنية]";

    // يستخرج اسم النطاق المختصر لوضعه بوضوح في عنوان التذكرة على GitHub.
    let host = siteUrl;
    // يحاول تحليل الرابط عبر كائن URL القياسي.
    try {
      // يأخذ hostname الصافي متى أمكن.
      host = new URL(siteUrl).hostname || siteUrl;
      // يبقي الرابط كما هو إن لم يكن بصيغة URL كاملة.
    } catch (_) {}

    // يركب عنوان التذكرة النهائي.
    const title = `${prefix} ${host}`;
    // يحدد وسوم GitHub (Labels) المناسبة لفرز التذاكر في المستودع.
    const labels = isSite ? "incompatible-site,bug" : isFeature ? "enhancement" : "bug";
    // يبني متن التذكرة المنظم بلغة Markdown شاملاً الرابط وملاحظات المتصفح ووصف المستخدم والإعدادات النشطة.
    const body = [
      // عنوان القسم الأول.
      "### تفاصيل البلاغ من إضافة مستقبلات",
      // يدرج نوع البلاغ.
      `- **النوع:** ${prefix}`,
      // يدرج الرابط الكامل للصفحة أو ملف الـ PDF.
      `- **رابط الموقع / الملف:** \`${siteUrl}\``,
      // يضيف ملاحظة التقييد الأمني للمتصفح تلقائياً إن كانت الصفحة مقيدة!
      activeTabInfo.restricted ? `- **ملاحظة المتصفح:** ${activeTabInfo.restrictedReason}` : "",
      // فاصل سطري.
      "",
      // عنوان قسم وصف المستخدم.
      "### وصف المستخدم",
      // نص المشكلة الذي كتبه المستخدم أو نص وصفي احتياطي واضح.
      description || "لم تعمل طبقات التعتيم أو الوضع الداكن كما هو متوقع على هذه الصفحة.",
      // فاصل سطري.
      "",
      // عنوان قسم الإعدادات التشخيصية.
      "### إعدادات الأداة وقت البلاغ",
      // يوثق قيم السطوع وطبقة التعتيم.
      `- السطوع: \`${settings.brightness}%\` | طبقة التعتيم: \`${settings.overlayOpacity}%\``,
      // يوثق قيم الوضع الداكن وآلية التطبيق.
      `- الوضع الداكن: \`${settings.darkMode}\` | الآلية: \`${settings.method}\``,
      // يوثق حالة التلوين السداسي HEX.
      `- اللون المخصص HEX: \`${settings.tintEnabled ? settings.tintColor : "غير مفعل"}\``
      // يغلق مصفوفة المتن.
    ]
      // يستبعد الأسطر الشرطية الفارغة تماماً.
      .filter(Boolean)
      // يدمج الأسطر بفاصل السطر الجديد.
      .join("\n");

    // يرمّز المعاملات الثلاثة (العنوان، الوسوم، المتن) لبناء رابط آمن متوافق مع GitHub.
    const params = new URLSearchParams({ title, labels, body });
    // يعيد الرابط النهائي الجاهز للفتح المباشر.
    return `https://github.com/${repo}/issues/new?${params.toString()}`;
    // يغلق دالة createGitHubIssueLink.
  }

  // يعرّف دالة فتح أي رابط خارجي أو صفحة داخلية (مثل لوحة الإحصائيات وقارئ الـ PDF) في تبويب جديد.
  function openUrl(url) {
    // يستخدم واجهة تبويبات الإضافة الرسمية عند العمل كإضافة متصفح.
    if (isExtensionEnv && chrome.tabs && chrome.tabs.create) {
      // ينشئ تبويباً جديداً بالرابط المحدد.
      chrome.tabs.create({ url });
      // أو يستخدم window.open القياسي عند العمل داخل محاكي المنصة السحابية.
    } else {
      // يفتح الرابط في نافذة جديدة مع سمات الحماية الأمنية noopener,noreferrer.
      window.open(url, "_blank", "noopener,noreferrer");
      // يغلق فرع الفتح القياسي.
    }
    // يغلق دالة openUrl.
  }

  // يعرّف دالة إظهار رسائل التأكيد أو الخطأ أسفل أزرار الإرسال في تبويب GitHub.
  function showGithubMsg(text, isError) {
    // يجلب عنصر فقرة الحالة.
    const el = $("githubStatusMsg");
    // يلغي إخفاء العنصر ليظهر للمستخدم.
    el.hidden = false;
    // يضع نص الرسالة التوضيحية.
    el.textContent = text;
    // يلون الخلفية بالأحمر الشفاف للخطأ أو بالأخضر الشفاف للنجاح.
    el.style.background = isError ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.16)";
    // يلون النص بدرجة متباينة مقروءة.
    el.style.color = isError ? "#FCA5A5" : "#86EFAC";
    // يغلق دالة showGithubMsg.
  }

  // يعرّف الدالة الشاملة التي تربط جميع التفاعلات والأحداث لكافة التبويبات والأشرطة والأزرار في النافذة المنبثقة.
  function bindEvents() {
    // Tabs switching
    // يربط أزرار التبويبات الأربعة العلوية بالتنقل الفوري بين لوحات التحكم والألوان والاستهلاك وجيت هاب.
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      // يسجل حدث النقر على كل زر تبويب.
      btn.addEventListener("click", () => {
        // يزيل التفعيل من كافة أزرار التبويبات.
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        // يخفي كافة لوحات التبويبات الأربع.
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        // يفعّل الزر المنقور بصرياً.
        btn.classList.add("active");
        // يجلب اللوحة المقابلة لاسم التبويب (tab-controls, tab-colors, tab-usage, tab-github).
        const target = $("tab-" + btn.dataset.tab);
        // يظهر اللوحة المطلوبة أمام المستخدم.
        if (target) target.classList.add("active");
        // عند فتح تبويب "الاستهلاك"، يحدث القياسات الحية ويرسم مخطط الأيام والأسابيع فوراً.
        if (btn.dataset.tab === "usage") {
          // يطلب أحدث قراءة ذاكرة ومعالج وFPS من الصفحة المفتوحة.
          pollActiveTabTelemetry();
          // يرسم المخطط البياني المصغر المحدث.
          renderMiniUsageChart();
          // يغلق شرط تبويب الاستهلاك.
        }
        // وعند فتح تبويب "جيت هاب"، يحدث قائمة المواقع المسجلة غير المتوافقة.
        if (btn.dataset.tab === "github") {
          // يعيد عرض سجل المواقع المبلّغ عنها.
          renderBrokenSitesList();
          // يغلق شرط تبويب جيت هاب.
        }
        // يغلق معالج النقر على التبويب.
      });
      // يغلق حلقة ربط التبويبات.
    });

    // Global switch
    // يربط المفتاح الرئيسي الشامل بتشغيل أو إيقاف الأداة افتراضياً على كل الصفحات.
    $("globalEnabledToggle").addEventListener("change", (e) => {
      // يقرأ الحالة المنطقية الجديدة للمفتاح.
      const enabled = e.target.checked;
      // يحدث نص الحالة بجوار المفتاح.
      $("globalStateText").textContent = enabled ? "مفعّل للكل" : "متوقف مؤقتاً";
      // يحفظ ويطبق قرار التفعيل الشامل فوراً عبر كل التبويبات.
      updateAndSave({ globalEnabled: enabled });
      // يغلق معالج المفتاح الرئيسي.
    });

    // Per-site exclude toggle
    // يربط زر استثناء/تفعيل الموقع الحالي بإضافة أو إزالة نطاق الموقع من مصفوفة excludedSites.
    $("toggleSiteExcludeBtn").addEventListener("click", () => {
      // يقرأ اسم النطاق الحالي للتبويب.
      const host = activeTabInfo.hostname;
      // ينسخ مصفوفة المواقع المستثناة لتعديلها بأمان.
      const list = Array.isArray(settings.excludedSites) ? [...settings.excludedSites] : [];
      // يبحث عما إذا كان الموقع موجوداً مسبقاً في قائمة الاستثناء.
      const idx = list.indexOf(host);
      // إذا كان موجوداً يزيله لإعادة تفعيل الأداة عليه، وإلا يضيفه لاستثنائه.
      if (idx >= 0) list.splice(idx, 1);
      // يضيف النطاق للاستثناء إن لم يكن مدرجاً.
      else list.push(host);
      // يحفظ القائمة المحدثة ويطبق التغيير فوراً على الموقع المفتوح.
      updateAndSave({ excludedSites: list });
      // يغلق معالج استثناء الموقع.
    });

    // Quick report site jump
    // يربط زر الاختصار السريع "لم تعمل؟" بالانتقال الفوري لتبويب GitHub وتجهيز بلاغ موقع غير متوافق!
    $("quickReportSiteBtn").addEventListener("click", () => {
      // ينقر برمجياً على تبويب "جيت هاب" لفتحه أمام المستخدم.
      document.querySelector('[data-tab="github"]').click();
      // يختار تلقائياً تصنيف "موقع لم تعمل معه الإضافة".
      $("issueTypeSelect").value = "site-incompatible";
      // يملأ رابط الموقع الحالي في حقل الرابط.
      $("issueSiteUrlInput").value = activeTabInfo.url;
      // يضع مؤشر الكتابة مباشرة في حقل وصف المشكلة ليكتب المستخدم ملاحظته إن أراد.
      $("issueDescInput").focus();
      // يغلق معالج زر البلاغ السريع.
    });

    // Brightness slider + chips
    // يربط شريط سطوع الشاشة (20%–150%) بتقليل أو زيادة الإضاءة لحظياً أثناء السحب.
    $("brightnessRange").addEventListener("input", (e) => {
      // يحول قيمة الشريط إلى عدد.
      const val = Number(e.target.value);
      // يحدث شارة النسبة المئوية المعروضة.
      $("brightnessVal").textContent = `${val}%`;
      // يحفظ ويطبق السطوع الجديد فوراً.
      updateAndSave({ brightness: val });
      // يغلق معالج شريط السطوع.
    });

    // يربط أزرار النسب السريعة الخمسة (55%، 75%، 88%، 100%، +125%) بضبط السطوع بنقرة واحدة.
    document.querySelectorAll(".preset-chip").forEach((chip) => {
      // يسجل حدث النقر لكل شريحة سطوع جاهزة.
      chip.addEventListener("click", () => {
        // يقرأ نسبة السطوع المخزنة في السمة data-brightness.
        const val = Number(chip.dataset.brightness);
        // يحرك شريط السطوع ليطابق القيمة المختارة.
        $("brightnessRange").value = val;
        // يحدث شارة النسبة المئوية.
        $("brightnessVal").textContent = `${val}%`;
        // يحفظ ويطبق النسبة فوراً.
        updateAndSave({ brightness: val });
        // يغلق معالج نقر الشريحة الجاهزة.
      });
      // يغلق حلقة شرائح السطوع السريعة.
    });

    // Overlay layer & Modes
    // يربط شريط كثافة طبقة التعتيم الفوقية (Overlay Layer) بتحديث شفافية الطبقة السوداء فوق الموقع لحظياً.
    $("overlayRange").addEventListener("input", (e) => {
      // يقرأ النسبة المختارة (0–85%).
      const val = Number(e.target.value);
      // يحدث نص الشارة المقابلة.
      $("overlayVal").textContent = `${val}%`;
      // يحفظ ويطبق كثافة الطبقة الجديدة.
      updateAndSave({ overlayOpacity: val });
      // يغلق معالج شريط طبقة التعتيم.
    });

    // يربط قائمة اختيار آلية خفض السطوع (دمج ذكي / طبقات فقط / فلتر فقط) بحفظ وتطبيق الآلية.
    $("methodSelect").addEventListener("change", (e) => {
      // يحفظ الآلية المختارة ويحدث المحرك.
      updateAndSave({ method: e.target.value });
      // يغلق معالج قائمة الآلية.
    });

    // يربط قائمة الوضع الداكن بتطبيق النمط المختار (ذكي / دافئ / AMOLED / خاص بالـ PDF / معطل) فوراً.
    $("darkModeSelect").addEventListener("change", (e) => {
      // يحفظ نمط الوضع الداكن ويطبقه على الصفحة.
      updateAndSave({ darkMode: e.target.value });
      // يغلق معالج قائمة الوضع الداكن.
    });

    // يربط شريط تخفيف وهج البياض بتهدئة الخلفيات الفاتحة لحظياً.
    $("pageColorDimRange").addEventListener("input", (e) => {
      // يقرأ القيمة الرقمية للشريط.
      const val = Number(e.target.value);
      // يحدث شارة العرض المئوية.
      $("pageColorDimVal").textContent = `${val}%`;
      // يحفظ ويطبق تخفيف الوهج.
      updateAndSave({ pageColorDim: val });
      // يغلق معالج شريط تخفيف الوهج.
    });

    // يربط شريط تباين النص بضبط وضوح الحروف والحدود من 50% حتى 150%.
    $("contrastRange").addEventListener("input", (e) => {
      // يقرأ نسبة التباين المختارة.
      const val = Number(e.target.value);
      // يحدث شارة التباين.
      $("contrastVal").textContent = `${val}%`;
      // يحفظ ويطبق التباين الجديد.
      updateAndSave({ contrast: val });
      // يغلق معالج شريط التباين.
    });

    // PDF Controls
    // يربط مربع تفعيل دعم ملفات الـ PDF بتشغيل أو إيقاف التعتيم الخاص بمستندات الـ PDF.
    $("pdfEnabledCheck").addEventListener("change", (e) => {
      // يحفظ حالة تفعيل دعم الـ PDF.
      updateAndSave({ pdfEnabled: e.target.checked });
      // يغلق معالج خانة الـ PDF.
    });

    // يربط شريط التعتيم الإضافي لبياض صفحات الـ PDF بتحديث قيمة pdfExtraDim.
    $("pdfExtraDimRange").addEventListener("input", (e) => {
      // يقرأ النسبة الإضافية (0–50%).
      const val = Number(e.target.value);
      // يحدث الشارة الرقمية المقابلة.
      $("pdfExtraDimVal").textContent = `${val}%`;
      // يحفظ ويطبق التعتيم الإضافي للـ PDF.
      updateAndSave({ pdfExtraDim: val });
      // يغلق معالج شريط تعتيم الـ PDF.
    });

    // يربط زر فتح قارئ ومعتّم ملفات الـ PDF المدمج بفتح صفحة pdf-viewer.html في تبويب جديد بدون تثبيت.
    $("openPdfViewerBtn").addEventListener("click", () => {
      // يحدد الرابط الداخلي الصحيح سواء داخل إضافة المتصفح أو داخل منصة الويب.
      const targetUrl = isExtensionEnv
        // رابط مورد الإضافة الرسمي في المتصفح.
        ? chrome.runtime.getURL("pages/pdf-viewer.html")
        // المسار النسبي المكافئ في منصة الويب.
        : "../pages/pdf-viewer.html";
      // يفتح قارئ الـ PDF عبر دالة openUrl.
      openUrl(targetUrl);
      // يغلق معالج زر فتح قارئ الـ PDF.
    });

    // Color Studio
    // يربط مربع تفعيل تلوين الشاشة بتشغيل أو إيقاف طبقة اللون المخصص HEX.
    $("tintEnabledCheck").addEventListener("change", (e) => {
      // يحفظ حالة التفعيل ويحدث الطبقة اللونية فوراً.
      updateAndSave({ tintEnabled: e.target.checked });
      // يغلق معالج تفعيل اللون.
    });

    // يربط الكتابة المباشرة في حقل كود اللون السداسي HEX بفحص الكود ومزامنة العجلة والشاشة فور صحته.
    $("hexInput").addEventListener("input", (e) => {
      // يتحقق من سلامة الصيغة المدخلة عبر sanitizeHex.
      const valid = sanitizeHex(e.target.value);
      // إذا اكتمل كود لوني صالح، يطبقه ويفعل التلوين تلقائياً.
      if (valid) applyNewHexColor(valid, true);
      // يغلق معالج حقل كود HEX.
    });

    // يربط منتقي ألوان النظام المدمج بتطبيق اللون المختار ومزامنة عجلة الألوان وأشرطة RGB.
    $("nativeColorPicker").addEventListener("input", (e) => {
      // يمرر اللون المختار إلى دالة التوحيد اللوني applyNewHexColor.
      applyNewHexColor(e.target.value, true);
      // يغلق معالج منتقي ألوان النظام.
    });

    // يربط زر القطّارة اللونية (💧) بواجهة EyeDropper القياسية لالتقاط أي لون من أي نقطة على الشاشة!
    $("eyeDropperBtn").addEventListener("click", async () => {
      // يتحقق من دعم المتصفح لواجهة EyeDropper الحديثة.
      if ("EyeDropper" in window) {
        // يفتح كتلة آمنة لاحتمال إلغاء المستخدم لعملية الالتقاط بزر Esc.
        try {
          // ينشئ أداة التقاط الألوان من الشاشة.
          const dropper = new window.EyeDropper();
          // يفتح عدسة الالتقاط وينتظر نقر المستخدم على اللون المرغوب.
          const result = await dropper.open();
          // يطبق كود HEX الملتقط فوراً على طبقة تلوين الشاشة وعجلة الألوان.
          if (result && result.sRGBHex) applyNewHexColor(result.sRGBHex, true);
          // يتجاهل الإلغاء اليدوي من المستخدم بهدوء.
        } catch (_) {}
        // وإذا لم يدعم المتصفح القطّارة، يفتح لوحة ألوان النظام كبديل سلس.
      } else {
        // يطلق نقرة على منتقي ألوان النظام.
        $("nativeColorPicker").click();
        // يغلق فرع البديل اللوني.
      }
      // يغلق معالج زر القطّارة.
    });

    // يربط أشرطة القنوات اللونية الثلاث (الأحمر R، الأخضر G، الأزرق B) بتكوين كود HEX المقابل وتطبيقه حياً.
    ["rgbR", "rgbG", "rgbB"].forEach((id) => {
      // يستمع لحركة السحب على كل شريط من الأشرطة الثلاثة.
      $(id).addEventListener("input", () => {
        // يحول القيم الثلاث الحالية إلى كود سداسي موحد عبر دالة rgbToHex.
        const hex = rgbToHex($("rgbR").value, $("rgbG").value, $("rgbB").value);
        // يطبق اللون الناتج ويزامن عجلة الألوان وحقل HEX والشاشة.
        applyNewHexColor(hex, true);
        // يغلق معالج حركة شريط RGB.
      });
      // يغلق حلقة ربط أشرطة RGB.
    });

    // يربط شريط شدة وشفافية اللون بتحديث كثافة طبقة اللون وتفعيلها تلقائياً.
    $("tintOpacityRange").addEventListener("input", (e) => {
      // يقرأ نسبة الشفافية المختارة (0–80%).
      const val = Number(e.target.value);
      // يحدث النص المئوي المعروض لشدة اللون.
      $("tintOpacityVal").textContent = `${val}%`;
      // يحفظ الشفافية الجديدة مع تفعيل طبقة اللون.
      updateAndSave({ tintOpacity: val, tintEnabled: true });
      // يؤشر مربع تفعيل اللون في الواجهة.
      $("tintEnabledCheck").checked = true;
      // يغلق معالج شريط شدة اللون.
    });

    // يربط قائمة نمط دمج الطبقة اللونية (Multiply, Soft-Light, Darken, Color...) بتحديث مزج اللون مع الصفحة.
    $("tintBlendSelect").addEventListener("change", (e) => {
      // يحفظ نمط الدمج الجديد ويطبقه فوراً.
      updateAndSave({ tintBlendMode: e.target.value });
      // يغلق معالج نمط الدمج.
    });

    // يربط شريط دفء الألوان وتصفية الضوء الأزرق بتحديث فلتر الدفء على عناصر الصفحة.
    $("warmthRange").addEventListener("input", (e) => {
      // يقرأ قيمة الدفء (0–100%).
      const val = Number(e.target.value);
      // يحدث الشارة الرقمية للدفء.
      $("warmthVal").textContent = `${val}%`;
      // يحفظ ويطبق قيمة الدفء الجديدة.
      updateAndSave({ warmth: val });
      // يغلق معالج شريط الدفء.
    });

    // يربط شريط تشبع ألوان عناصر الصفحة بتخفيف أو تعزيز الألوان من 0% (رمادي كامل) إلى 150%.
    $("saturationRange").addEventListener("input", (e) => {
      // يقرأ نسبة التشبع اللوني.
      const val = Number(e.target.value);
      // يحدث شارة التشبع.
      $("saturationVal").textContent = `${val}%`;
      // يحفظ ويطبق التشبع الجديد.
      updateAndSave({ saturation: val });
      // يغلق معالج شريط التشبع.
    });

    // يربط شريط تدوير طيف ألوان الصفحة بتغيير درجات ألوان عناصر الموقع بين -180° و+180°.
    $("hueRotateRange").addEventListener("input", (e) => {
      // يقرأ زاوية التدوير المختارة.
      const val = Number(e.target.value);
      // يحدث شارة الزاوية بالدرجات.
      $("hueRotateVal").textContent = `${val}°`;
      // يحفظ ويطبق زاوية الطيف اللوني.
      updateAndSave({ hueRotate: val });
      // يغلق معالج تدوير الطيف.
    });

    // Usage Tab
    // يربط خانة إظهار مؤشر الاستهلاك المباشر داخل الصفحة بإظهار أو إخفاء شريط HUD في المواقع المفتوحة.
    $("showHudCheck").addEventListener("change", (e) => {
      // يحفظ التفضيل ويحدث الصفحة فوراً.
      updateAndSave({ showInPageHud: e.target.checked });
      // يغلق معالج خانة المؤشر الحي.
    });

    // يربط قائمة اختيار زاوية المؤشر داخل الصفحة بنقل المؤشر فوراً للركن المختار.
    $("hudPosSelect").addEventListener("change", (e) => {
      // يحفظ موقع الزاوية الجديد ويطبقه.
      updateAndSave({ hudPosition: e.target.value });
      // يغلق معالج زاوية المؤشر.
    });

    // يربط زر "تحديث القياس الآن" بطلب قراءة فورية جديدة للذاكرة والمعالج وإعادة رسم المخطط المصغر.
    $("refreshTelemetryBtn").addEventListener("click", () => {
      // يستعلم عن القياسات الحية اللحظية.
      pollActiveTabTelemetry();
      // يعيد رسم مخطط الأيام والأسابيع المصغر.
      renderMiniUsageChart();
      // يغلق معالج زر تحديث القياس.
    });

    // يربط زري التبديل الزمني في تبويب الاستهلاك ("7 أيام" و"4 أسابيع") بتحديث المخطط المصغر فوراً.
    document.querySelectorAll(".seg-btn").forEach((btn) => {
      // يسجل النقر على زر النطاق الزمني.
      btn.addEventListener("click", () => {
        // يزيل التفعيل من الزرين.
        document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
        // يفعّل الزر المختار.
        btn.classList.add("active");
        // يحدّث المتغير chartRange بالقيمة ("7d" أو "4w").
        chartRange = btn.dataset.range;
        // يعيد رسم المخطط المصغر بالنطاق الجديد.
        renderMiniUsageChart();
        // يغلق معالج النقر.
      });
      // يغلق حلقة أزرار النطاق الزمني.
    });

    // يربط زر "فتح لوحة الاستهلاك التفصيلية (الأيام والأسابيع)" بفتح صفحة dashboard.html الكاملة.
    $("openDashboardBtn").addEventListener("click", () => {
      // يختار المسار المناسب للإضافة أو لمنصة الويب.
      const targetUrl = isExtensionEnv
        // رابط صفحة اللوحة داخل حزمة الإضافة.
        ? chrome.runtime.getURL("pages/dashboard.html")
        // المسار النسبي في المنصة الحية.
        : "../pages/dashboard.html";
      // يفتح لوحة الإحصائيات التفصيلية في تبويب جديد.
      openUrl(targetUrl);
      // يغلق معالج زر لوحة الإحصائيات.
    });

    // GitHub Reporting
    // يربط حقل اسم مستودع GitHub بحفظ المستودع المحدد (مع العودة للمستودع الرسمي عند تركه فارغاً).
    $("githubRepoInput").addEventListener("change", (e) => {
      // يحفظ اسم المستودع بعد تنظيف المسافات.
      updateAndSave({ githubRepo: e.target.value.trim() || "Mohamed7AbdELhalim/Mustaqbalat" });
      // يغلق معالج حقل مستودع GitHub.
    });

    // يربط زر "إرسال إلى GitHub Issues" بتسجيل البلاغ وإرساله إما عبر GitHub REST API (إن وُضع توكن) أو فتح صفحة التذكرة الجاهزة مباشرة!
    $("submitGithubIssueBtn").addEventListener("click", async () => {
      // يقرأ المستودع الهدف.
      const repo = ($("githubRepoInput").value || "Mohamed7AbdELhalim/Mustaqbalat").trim();
      // يقرأ تصنيف البلاغ المختار.
      const type = $("issueTypeSelect").value;
      // يقرأ رابط الموقع أو الملف المعني بالبلاغ.
      const siteUrl = ($("issueSiteUrlInput").value || activeTabInfo.url).trim();
      // يقرأ شرح المشكلة الذي كتبه المستخدم.
      const description = $("issueDescInput").value.trim();
      // يقرأ رمز الوصول الشخصي الاختياري (إن رغب المستخدم بالإرسال المباشر عبر API).
      const token = $("githubTokenInput").value.trim();

      // Save to local log if site-incompatible
      // إذا كان البلاغ يخص موقعاً لم تعمل معه الإضافة، يحفظه تلقائياً في السجل المحلي أيضاً لمتابعته.
      if (type === "site-incompatible") {
        // يستدعي دالة الحفظ المحلي للموقع غير المتوافق.
        await saveBrokenSiteLocally(siteUrl, description);
        // يغلق شرط الحفظ التلقائي للموقع.
      }

      // إذا أدخل المستخدم توكن GitHub اختيارياً، يرسل البلاغ مباشرة عبر واجهة GitHub REST API دون مغادرة النافذة!
      if (token) {
        // يفتح كتلة اتصال شبكي آمنة.
        try {
          // يعرض رسالة جاري الإرسال للمستخدم.
          showGithubMsg("جاري إرسال البلاغ مباشرة إلى GitHub API...", false);
          // يبني بيانات التذكرة الموحدة عبر دالة createGitHubIssueLink لاستخلاص العنوان والمتن والوسوم.
          const issueUrl = createGitHubIssueLink({ siteUrl, type, description });
          // يحلل الرابط لاستخراج المعاملات الجاهزة.
          const parsed = new URL(issueUrl);
          // يستخرج عنوان التذكرة.
          const title = parsed.searchParams.get("title");
          // يستخرج متن التذكرة التشخيصي الكامل.
          const body = parsed.searchParams.get("body");
          // يستخرج مصفوفة الوسوم التصنيفية.
          const labels = (parsed.searchParams.get("labels") || "").split(",").filter(Boolean);

          // يرسل طلب POST رسمي إلى نقطة نهاية إنشاء التذاكر في GitHub API.
          const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
            // طريقة الإرسال البرمجي POST.
            method: "POST",
            // الترويسات القياسية المطلوبة من GitHub API v3.
            headers: {
              // يحدد قبول صيغة JSON الرسمية من GitHub.
              Accept: "application/vnd.github+json",
              // يمرر رمز المصادقة الاختياري للمستخدم.
              Authorization: `Bearer ${token}`,
              // يحدد نوع المحتوى المرسل كـ JSON.
              "Content-Type": "application/json"
              // يغلق كائن الترويسات.
            },
            // يحول بيانات التذكرة إلى سلسلة JSON للإرسال.
            body: JSON.stringify({ title, body, labels })
            // يغلق استدعاء fetch.
          });
          // يتحقق من نجاح إنشاء التذكرة على خادم GitHub.
          if (res.ok) {
            // يقرأ بيانات التذكرة المنشأة (بما فيها رقمها ورابطها).
            const data = await res.json();
            // يبشّر المستخدم بنجاح إنشاء البلاغ مع عرض رقم التذكرة الفعلي.
            showGithubMsg(`تم إنشاء البلاغ بنجاح رقم #${data.number}!`, false);
            // يفتح التذكرة المنشأة في تبويب جديد ليطلع عليها المستخدم.
            if (data.html_url) openUrl(data.html_url);
            // ينهي الدالة بنجاح تام.
            return;
            // وفي حال رفض التوكن أو نقص صلاحياته، ينتقل بسلاسة للطريقة المباشرة بدون توكن!
          } else {
            // ينبه المستخدم بالانتقال التلقائي لصفحة GitHub المعبأة.
            showGithubMsg("تعذر الإرسال عبر التوكن، سيتم فتح صفحة GitHub الجاهزة مباشرة.", true);
            // يغلق شرط فحص استجابة API.
          }
          // يلتقط أي خطأ اتصال شبكي لينتقل للفتح المباشر المضمون.
        } catch (_) {
          // يخبر المستخدم بفتح النموذج الجاهز مباشرة.
          showGithubMsg("سيتم فتح صفحة البلاغ المُعبّأة في GitHub مباشرة.", false);
          // يغلق كتلة الاتصال عبر API.
        }
        // يغلق شرط وجود التوكن الاختياري.
      }

      // المسار الافتراضي الميسّر بدون أي توكن: يجهز رابط التذكرة المعبأ بالكامل ويفتحه مباشرة في GitHub Issues!
      const ghUrl = createGitHubIssueLink({ siteUrl, type, description });
      // يعرض رسالة تأكيد تجهيز البلاغ.
      showGithubMsg("تم تجهيز البلاغ وفتحه في GitHub Issues!", false);
      // يفتح صفحة البلاغ في تبويب جديد.
      openUrl(ghUrl);
      // يغلق معالج زر إرسال البلاغ لـ GitHub.
    });

    // يربط زر "حفظ واستثناء الموقع" بتدوين الموقع في سجل المواقع غير المتوافقة واستثنائه من التعتيم محلياً بنقرة واحدة.
    $("logBrokenSiteLocalBtn").addEventListener("click", async () => {
      // يقرأ رابط الموقع من الحقل.
      const siteUrl = ($("issueSiteUrlInput").value || activeTabInfo.url).trim();
      // يقرأ ملاحظة المستخدم حول الموقع.
      const description = $("issueDescInput").value.trim();
      // يحفظ الموقع في السجل مع تفعيل معامل الاستثناء التلقائي (true).
      await saveBrokenSiteLocally(siteUrl, description, true);
      // يعرض رسالة تأكيد الحفظ والاستثناء للمستخدم.
      showGithubMsg("تم حفظ الموقع في السجل واستثناؤه محلياً.", false);
      // يغلق معالج زر الحفظ والاستثناء المحلي.
    });

    // Reset Defaults
    // يربط زر "استعادة الافتراضي" في الشريط السفلي بإرجاع جميع إعدادات السطوع والألوان والطبقات للقيم المصنعية المتوازنة.
    $("resetDefaultsBtn").addEventListener("click", async () => {
      // ينسخ القيم الافتراضية النقية إلى كائن settings.
      settings = Object.assign({}, DEFAULT_SETTINGS);
      // يحفظ الإعدادات المستعادة في التخزين ويبثها للتبويبات.
      await storageSet(STORAGE_KEY_SETTINGS, settings);
      // يعيد ضبط جميع المؤشرات والأشرطة في النافذة لتعكس القيم الافتراضية فوراً.
      populateControlsFromSettings();
      // يغلق معالج استعادة الضبط الافتراضي.
    });
    // يغلق دالة ربط كافة الأحداث bindEvents.
  }

  // يعرّف دالة حفظ موقع في القائمة المحلية للمواقع غير المتوافقة مع خيار إضافته لمصفوفة المواقع المستثناة.
  async function saveBrokenSiteLocally(siteUrl, description, alsoExclude) {
    // يهيئ متغير اسم النطاق بقيمة الرابط الممرر مبدئياً.
    let hostname = siteUrl;
    // يحاول استخلاص اسم النطاق الصافي من الرابط.
    try {
      // يستخرج hostname القياسي متى كان الرابط كاملاً.
      hostname = new URL(siteUrl).hostname || siteUrl;
      // يحتفظ بالنص الأصلي عند تعذر التحليل.
    } catch (_) {}

    // يجلب القائمة الحالية للمواقع المسجلة من التخزين.
    const list = (await storageGet(STORAGE_KEY_BROKEN_SITES, [])) || [];
    // يضيف البلاغ الجديد في صدارة القائمة مع معرّف فريد وطابع زمني.
    list.unshift({
      // معرّف فريد مشتق من الوقت الحالي.
      id: Date.now().toString(36),
      // الرابط الكامل للموقع أو الملف.
      siteUrl,
      // اسم النطاق المستخلص.
      hostname,
      // وصف المشكلة أو نص افتراضي مختصر.
      description: description || "لم تستجب الصفحة للتعتيم",
      // تاريخ ووقت التسجيل بصيغة ISO.
      reportedAt: new Date().toISOString()
      // يغلق كائن سجل الموقع.
    });
    // يحفظ القائمة مقلمة عند حد أقصى 100 موقع ليبقى التخزين خفيفاً دائماً.
    await storageSet(STORAGE_KEY_BROKEN_SITES, list.slice(0, 100));

    // إذا طلب المستخدم استثناء الموقع أيضاً (alsoExclude)، يدرج نطاقه ضمن مصفوفة excludedSites.
    if (alsoExclude && hostname) {
      // ينسخ مصفوفة الاستثناءات الحالية.
      const ex = Array.isArray(settings.excludedSites) ? [...settings.excludedSites] : [];
      // يضيف النطاق إن لم يكن مضافاً من قبل.
      if (!ex.includes(hostname)) ex.push(hostname);
      // يحفظ الاستثناء ويطبقه فوراً على التبويب النشط.
      await updateAndSave({ excludedSites: ex });
      // يغلق شرط الاستثناء الإضافي.
    }
    // يعيد رسم قائمة المواقع المسجلة في تبويب GitHub لتظهر الإضافة الجديدة فوراً.
    renderBrokenSitesList();
    // يغلق دالة saveBrokenSiteLocally.
  }

  // يعرّف دالة الإقلاع المتسلسلة للنافذة المنبثقة التي تجهز الإعدادات وعجلة الألوان والأحداث والقياسات الحية.
  async function bootstrap() {
    // يقرأ الإعدادات المحفوظة مسبقاً من التخزين.
    const saved = await storageGet(STORAGE_KEY_SETTINGS, null);
    // يدمج المحفوظات مع القيم الافتراضية لتكوين حالة التشغيل الكاملة.
    settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    // يبني أزرار لوحات الألوان الثمان الجاهزة.
    renderSwatches();
    // يفعل أحداث النقر والسحب على عجلة الألوان التفاعلية.
    setupColorWheelEvents();
    // يملأ كافة الأشرطة والقوائم والحقول بالقيم الحالية.
    populateControlsFromSettings();
    // يربط جميع مستمعات التفاعل للأزرار والتبويبات.
    bindEvents();
    // يتعرف على التبويب النشط ويفحص دعمه أو تقييده.
    await detectActiveTab();
    // يطلب قراءة الاستهلاك الحي للصفحة المفتوحة.
    pollActiveTabTelemetry();
    // يرسم المخطط المصغر لاستهلاك الأيام والأسابيع.
    renderMiniUsageChart();
    // يعرض قائمة المواقع المسجلة في تبويب GitHub.
    renderBrokenSitesList();
    // يغلق دالة الإقلاع bootstrap.
  }

  // يستدعي دالة الإقلاع فور فتح نافذة الإضافة المنبثقة.
  bootstrap();
  // يغلق الدالة الفورية المعزولة وينفذها.
})();
