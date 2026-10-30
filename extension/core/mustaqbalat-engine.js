/**
 * Mustaqbalat (مستقبلات للراحة البصرية) — Core Visual Comfort & Resource Telemetry Engine
 * Ultra-lightweight, zero-dependency engine designed for:
 *  1) Browser Extension (Manifest V3 Content Script)
 *  2) Zero-Install Web Add-on (Bookmarklet & Userscript)
 *  3) Embedded Live Web Studio & PDF Reader
 */
// يفتح دالة فورية التنفيذ تستقبل النطاق العام (window في المتصفح أو globalThis) لعزل المحرك ومنع تلوث متغيرات المواقع.
(function (globalScope) {
  // يفعّل الوضع الصارم في جافاسكربت لضمان دقة إدارة الذاكرة ومنع أي إسناد غير مصرّح به.
  "use strict";

  // يفحص راية التحميل المسبق على النطاق العام لمنع حقن المحرك مرتين في نفس الإطار عند التثبيت الفوري من service-worker.js.
  if (globalScope.__MUSTAQBALAT_ENGINE_LOADED__) {
    // يتحقق من وجود واجهة المحرك المسجلة سابقاً وقابلية استدعاء دالة التحديث refresh.
    if (globalScope.MustaqbalatEngine && typeof globalScope.MustaqbalatEngine.refresh === "function") {
      // يكتفي بإعادة تنشيط الفلاتر والطبقات الحالية بدلاً من تكرار إنشاء العناصر والمؤقتات.
      globalScope.MustaqbalatEngine.refresh();
      // يغلق شرط التحقق من وجود دالة التحديث.
    }
    // يوقف التنفيذ المكرر فوراً بعد ضمان تحديث النسخة المحقونة مسبقاً.
    return;
    // يغلق شرط فحص التحميل المسبق للمحرك.
  }
  // يرفع راية التحميل على النطاق العام لإعلام أي محاولة حقن لاحقة بأن المحرك نشط بالفعل في هذه الصفحة.
  globalScope.__MUSTAQBALAT_ENGINE_LOADED__ = true;

  // يعرّف المفتاح الموحّد لتخزين إعدادات السطوع والألوان والطبقات، وهو مشترك مع popup.js وservice-worker.js.
  const STORAGE_KEY_SETTINGS = "mustaqbalat_settings_v1";
  // يعرّف مفتاح تخزين السجل التاريخي للاستهلاك اليومي والأسبوعي الذي تقرؤه لوحة الإحصائيات dashboard.js.
  const STORAGE_KEY_USAGE = "mustaqbalat_usage_v1";
  // يعرّف مفتاح تخزين المواقع المبلّغ عن عدم استجابتها أو استثنائها لربطه بنظام بلاغات GitHub.
  const STORAGE_KEY_BROKEN_SITES = "mustaqbalat_broken_sites_v1";

  // يبدأ تعريف مصفوفة لوحات الألوان الطبية والقرائية الثمان الجاهزة ليختار منها المستخدم بضغطة واحدة.
  const PRESET_PALETTES = [
    // اللوحة الأولى: لون العنبر الدافئ لتصفية الطيف الأزرق المجهد للشبكية في الإضاءة الليلية.
    { id: "amber", name: "عنبر دافئ (حماية من الأزرق)", hex: "#F59E0B", opacity: 18, blend: "multiply" },
    // اللوحة الثانية: درجة ضوء الشموع البرتقالية العميقة للقراءة المتأخرة قبل النوم.
    { id: "candle", name: "ضوء الشموع الليلي", hex: "#EA580C", opacity: 22, blend: "multiply" },
    // اللوحة الثالثة: درجة الورق الكلاسيكي الدافئ المخصصة للكتب المقالات الطويلة وملفات الـ PDF.
    { id: "sepia", name: "ورق القراءة الكلاسيكي", hex: "#D6B88A", opacity: 24, blend: "multiply" },
    // اللوحة الرابعة: الطيف الأخضر الهادئ المساعد على إراحة الأعصاب البصرية خلال ساعات العمل الطويلة.
    { id: "forest", name: "أخضر مريح للأعصاب البصرية", hex: "#10B981", opacity: 14, blend: "multiply" },
    // اللوحة الخامسة: الطيف الوردي الناعم بنمط soft-light لتخفيف الحساسية الضوئية والصداع النصفي.
    { id: "rose", name: "وردي هادئ (تخفيف الصداع النصفي)", hex: "#F43F5E", opacity: 14, blend: "soft-light" },
    // اللوحة السادسة: الأزرق القمري الخافت لتهدئة التباين الحاد دون تحول لوني برتقالي.
    { id: "moon", name: "أزرق قمري ليلي", hex: "#38BDF8", opacity: 15, blend: "multiply" },
    // اللوحة السابعة: البنفسجي الخافت لتلطيف الخلفيات الرمادية والبيضاء الساطعة.
    { id: "violet", name: "بنفسجي خافت", hex: "#8B5CF6", opacity: 15, blend: "multiply" },
    // اللوحة الثامنة: الرمادي السينمائي المحايد لخفض الإضاءة مع الحفاظ التام على دقة الألوان للتصميم والفيديو.
    { id: "slate", name: "رمادي محايد سينمائي", hex: "#334155", opacity: 25, blend: "multiply" }
    // يغلق مصفوفة اللوحات اللونية الجاهزة PRESET_PALETTES.
  ];

  // يبدأ تعريف كائن الإعدادات الافتراضية الشاملة التي ينطلق بها المحرك تلقائياً قبل أي تخصيص من المستخدم.
  const DEFAULT_SETTINGS = {
    // يفعّل عمل المحرك افتراضياً على كافة مواقع الويب والمستندات فور التثبيت.
    globalEnabled: true,          // يعمل افتراضياً على كل الصفحات والملفات
    // يضبط نسبة السطوع الافتراضية عند 88% (مع دعم التقليل حتى 20% والزيادة حتى 150%).
    brightness: 88,               // 20% إلى 150% (تقليل أو زيادة السطوع)
    // يبقي نسبة تباين العناصر والنصوص عند المستوى الطبيعي 100%.
    contrast: 100,                // 50% إلى 150%
    // يضيف دفئاً لونياً طفيفاً بنسبة 12% لكسر حدة البياض الفاقع.
    warmth: 12,                   // 0% إلى 100% (تقليل حدة اللون الأبيض والأزرق)
    // يحافظ على تشبع ألوان الصفحة عند 100% دون تبهيت مبدئي.
    saturation: 100,              // 0% إلى 150% (التحكم بتشبع ألوان الصفحة)
    // يبقي زاوية الطيف اللوني عند 0 درجة لعدم تغيير ألوان الشعارات والواجهات افتراضياً.
    hueRotate: 0,                 // -180 إلى 180 درجة (تغيير طيف ألوان الصفحة)
    // يخفف وهج الخلفيات البيضاء الصريحة في الصفحة بنسبة 8%.
    pageColorDim: 8,              // تخفيف وهج الألوان الفاتحة بالصفحة (0 - 60%)
    // يعتمد الأسلوب الهجين الجامع بين فلتر الألوان وطبقات التعتيم العلوية لتحقيق أفضل نتيجة بصرية.
    method: "hybrid",             // "filter" | "overlay" | "hybrid"
    // يحدد شفافية طبقة التعتيم السوداء الموضوعة فوق الموقع بنسبة 14%.
    overlayOpacity: 14,           // طبقة تعتيم فوق الموقع نفسه (0 - 85%)
    // يترك طبقة اللون المخصص غير مفعّلة مبدئياً إلى أن يفعّلها المستخدم من تبويب الألوان.
    tintEnabled: false,           // تفعيل تلوين الشاشة المخصص
    // يحفظ كود لون العنبر السداسي كقيمة ابتدائية لطبقة التلوين عند تفعيلها.
    tintColor: "#F59E0B",         // أي لون HEX يختاره المستخدم
    // يحدد كثافة طبقة اللون المخصص عند 18%.
    tintOpacity: 18,              // شدة طبقة اللون (0 - 80%)
    // يختار نمط الدمج multiply لكي تندمج طبقة اللون مع الصفحة دون حجب وضوح النصوص.
    tintBlendMode: "multiply",    // "multiply" | "normal" | "darken" | "soft-light" | "color" | "screen"
    // يبقي الوضع الداكن الكامل متوقفاً مبدئياً حتى يختاره المستخدم حسب رغبته.
    darkMode: "off",              // "off" | "smart" | "warm-dark" | "amoled" | "pdf-dark"
    // يفعّل معالجة وتعتيم ملفات الـ PDF المفتوحة داخل المتصفح افتراضياً.
    pdfEnabled: true,             // دعم ملفات PDF وتعتيمها
    // يضيف 10% تعتيماً إضافياً عند اكتشاف مستند PDF لتعويض البياض الناصع لصفحاته.
    pdfExtraDim: 10,              // تعتيم إضافي اختياري لملفات PDF الساطعة
    // يفعّل إظهار مؤشر قياس استهلاك النظام الحي داخل الصفحة المفتوحة.
    showInPageHud: true,          // إظهار مؤشر استهلاك الأداة داخل الصفحة
    // يعرض مؤشر الاستهلاك بالوضع الكامل غير المصغر عند التشغيل الأول.
    hudMinimized: false,          // تصغير المؤشر داخل الصفحة
    // يثبت مؤشر الاستهلاك الحي في الركن الأيسر السفلي للصفحة افتراضياً.
    hudPosition: "bottom-left",   // "bottom-left" | "bottom-right" | "top-left" | "top-right"
    // يحدد المستودع الرسمي على GitHub لإرسال البلاغات والمواقع غير المتوافقة إليه مباشرة.
    githubRepo: "Mohamed7AbdELhalim/Mustaqbalat",
    // يهيئ قائمة المواقع المستثناة من قبل المستخدم كمصفوفة فارغة.
    excludedSites: [],            // مواقع مستثناة يدوياً
    // يهيئ سجل الإعدادات الخاصة بكل نطاق موقع ككائن فارغ.
    siteOverrides: {}             // إعدادات مخصصة لكل موقع حسب النطاق
    // يغلق كائن الإعدادات الافتراضية DEFAULT_SETTINGS.
  };

  // يلتقط حجم ذاكرة جافاسكربت الأساسي للصفحة لحظة بدء المحرك لحساب الفرق الدقيق (Delta) الذي تستهلكه الأداة وحدها.
  const baselineHeapBytes =
    // يتحقق من دعم المتصفح لواجهة قياس الذاكرة الدقيقة performance.memory.
    typeof performance !== "undefined" && performance.memory
      // يقرأ عدد البايتات المستهلكة قبل إنشاء عناصر مستقبلات في الصفحة.
      ? performance.memory.usedJSHeapSize
      // يعود للصفر في المتصفحات التي تحجب قراءة الذاكرة المباشرة ليُستخدم القياس البديل بحجم DOM.
      : 0;

  // ينشئ كائن الحالة الحية (state) الذي يربط بين الإعدادات وعناصر الصفحة ومقاييس الأداء اللحظية.
  const state = {
    // ينسخ الإعدادات الافتراضية كبداية ريثما تكتمل القراءة غير المتزامنة من التخزين.
    settings: Object.assign({}, DEFAULT_SETTINGS),
    // يستخرج اسم نطاق الموقع الحالي فوراً عبر دالة getCurrentHostname لفحص الاستثناءات.
    hostname: getCurrentHostname(),
    // يحتفظ براية توضح ما إذا كانت الصفحة الحالية مستند PDF أم صفحة ويب عادية.
    isPdf: false,
    // يسجل زمن آخر عملية تطبيق للفلاتر والطبقات بالمللي ثانية.
    lastApplyMs: 0,
    // يراكم إجمالي أزمنة المعالجة خلال الجلسة الحالية لحساب عبء المعالج الفعلي.
    totalApplyMsSession: 0,
    // يعدّ مرات استدعاء دالة التطبيق البصري خلال الجلسة.
    applyCount: 0,
    // يحفظ حجم النصوص والأنماط المحقونة من الأداة بالبايت.
    domBytes: 0,
    // يحفظ عدد عقد DOM التي أنشأتها الأداة داخل الصفحة.
    domNodes: 0,
    // يحتفظ بآخر قراءة لمعدل الإطارات في الثانية (FPS) لعرض سلاسة التصفح في المؤشر الحي.
    fps: 60,
    // يسجل استهلاك الأداة الصافي من الذاكرة بالكيلوبايت (مقارناً مع baselineHeapBytes أعلاه).
    heapDeltaKB: 18,
    // يسجل إجمالي ذاكرة التبويب بالميجابايت عند توفرها من المتصفح.
    tabHeapMB: 0,
    // يحفظ مرجع مؤقت تحديث المؤشر عند الحاجة لإدارته.
    hudTimer: null,
    // يحفظ مرجع المؤقت الدقيق (كل 60 ثانية) لتسجيل الاستهلاك اليومي والأسبوعي.
    usageTimer: null,
    // يحفظ معرّف حلقة requestAnimationFrame الخاصة بقياس الـ FPS لإيقافها فوراً عند إخفاء المؤشر وتوفير المعالج.
    fpsRafId: null,
    // يحتفظ بمرجع عنصر الاستضافة الجذري (#mustaqbalat-root-host) المزروع في الصفحة.
    rootHost: null,
    // يحتفظ بمرجع شجرة Shadow DOM المعزولة التي تحوي طبقات التعتيم والتلوين والمؤشر الحي.
    shadowRoot: null,
    // يحتفظ بمرجع وسم الأنماط (#mustaqbalat-doc-filter-style) المسؤول عن فلاتر الصفحة والـ PDF.
    styleEl: null,
    // يحتفظ بمرجع عنصر مؤشر الاستهلاك الحي داخل شجرة Shadow DOM.
    hudEl: null,
    // يتتبع حالة فتح اللوحة العائمة الإضافية إن استُخدمت في وضع الويب.
    floatingPanelOpen: false
    // يغلق كائن الحالة الحية للمحرك state.
  };

  // يعرّف دالة استخراج اسم النطاق الحالي للصفحة بأمان عبر مختلف البروتوكولات (ويب أو ملفات محلية).
  function getCurrentHostname() {
    // يفتح كتلة حماية للتعامل مع الإطارات المقيدة أو الروابط الخاصة.
    try {
      // يصنف المسارات المحلية (مثل فتح ملف PDF من القرص عبر file://) تحت اسم موحد "local-file".
      if (location.protocol === "file:") return "local-file";
      // يعيد اسم نطاق الموقع (مثل wikipedia.org) أو اسم البروتوكول عند غياب النطاق.
      return location.hostname || location.protocol.replace(":", "") || "unknown";
      // يلتقط أي خطأ أمني في الإطارات المعزولة المتداخلة.
    } catch (_) {
      // يعيد القيمة الآمنة "unknown" لضمان استمرار عمل المحرك دون توقف.
      return "unknown";
      // يغلق كتلة الحماية.
    }
    // يغلق دالة استخراج النطاق getCurrentHostname.
  }

  // يعرّف دالة الاكتشاف الذكي لمستندات الـ PDF سواء فُتحت مباشرة كملف أو دُمجت داخل صفحة ويب.
  function detectPdfPage() {
    // يفتح كتلة فحص آمنة لخصائص الوثيقة وعناصرها.
    try {
      // يتحقق أولاً من نوع محتوى الوثيقة الرسمي الذي يعلنه المتصفح لمستندات PDF المباشرة.
      if (document.contentType === "application/pdf") return true;
      // يقرأ مسار الرابط الحالي محولاً لأحرف صغيرة لفحص امتداد الملف.
      const path = (location.pathname || "").toLowerCase();
      // يتحقق ثانياً من انتهاء مسار الرابط بالامتداد ".pdf".
      if (path.endsWith(".pdf")) return true;
      // يفحص ثالثاً وجود عناصر تضمين عارض PDF داخل شجرة الصفحة (embed أو object أو عارض PDF.js).
      if (
        // يتأكد من جاهزية دالة البحث في الوثيقة.
        document.querySelector &&
        // يبحث عن أي وسم من وسوم عرض ملفات الـ PDF القياسية في المتصفحات.
        document.querySelector(
          // محددات CSS الشاملة لمشغلات وعارضات الـ PDF المدمجة.
          'embed[type="application/pdf"], object[type="application/pdf"], iframe[src*=".pdf"], #viewer.pdfViewer'
          // يغلق استدعاء querySelector.
        )
        // يغلق شرط فحص عناصر الـ PDF المدمجة.
      ) {
        // يؤكد أن الصفحة تعرض محتوى PDF لتطبيق إعدادات pdfEnabled وpdfExtraDim عليها.
        return true;
        // يغلق كتلة التأكيد.
      }
      // يتجاهل أي خطأ وصول أثناء مراحل التحميل المبكرة جداً (document_start).
    } catch (_) {}
    // يعيد false إذا كانت الصفحة صفحة ويب اعتيادية لا تحوي مستند PDF.
    return false;
    // يغلق دالة اكتشاف الـ PDF.
  }

  // يعرّف دالة تنقية وتوحيد أكواد الألوان السداسية (HEX) المدخلة من المستخدم لمنع أي قيم لونية معطوبة.
  function sanitizeHex(hex) {
    // يعود للون العنبر الافتراضي إذا لم تكن القيمة المدخلة نصاً.
    if (typeof hex !== "string") return "#F59E0B";
    // يزيل الفراغات الزائدة من بداية ونهاية الكود النصي.
    const cleaned = hex.trim();
    // يقبل الكود السداسي القياسي المكون من # متبوعة بـ 6 خانات ويعيده بأحرف كبيرة موحدة.
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned.toUpperCase();
    // يدعم الصيغة المختصرة المكونة من 3 خانات (مثل #FA0) بتوسيعها إلى 6 خانات قياسية (#FFAA00).
    if (/^#[0-9a-fA-F]{3}$/.test(cleaned)) {
      // يبدأ تركيب الكود الموسّع ذي الخانات الست.
      return (
        // يضع علامة المربع البادئة #.
        "#" +
        // يضاعف خانة اللون الأحمر الأولى.
        cleaned[1] + cleaned[1] +
        // يضاعف خانة اللون الأخضر الثانية.
        cleaned[2] + cleaned[2] +
        // يضاعف خانة اللون الأزرق الثالثة.
        cleaned[3] + cleaned[3]
        // يحول الناتج لأحرف كبيرة ويعيده.
      ).toUpperCase();
      // يغلق معالجة الصيغة المختصرة.
    }
    // يدعم حالة إدخال المستخدم لـ 6 خانات صحيحة مع نسيان كتابة علامة # في البداية فيضيفها تلقائياً.
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return ("#" + cleaned).toUpperCase();
    // يعود للون العنبر الآمن إذا لم يطابق المدخل أياً من الصيغ اللونية الصحيحة أعلاه.
    return "#F59E0B";
    // يغلق دالة تنقية اللون السداسي sanitizeHex.
  }

  // يعرّف دالة تحويل لون HEX المصفّى مع نسبة الشفافية إلى صيغة rgba لتلوين طبقة الشاشة في Shadow DOM.
  function hexToRgba(hex, alpha) {
    // يمرر اللون أولاً على دالة sanitizeHex السابقة لضمان الحصول على سلسلة من 7 محارف سليمة.
    const valid = sanitizeHex(hex);
    // يحول خانة اللون الأحمر (المحرفين 1 و2) من السداسي عشري إلى عدد عشري بين 0 و255.
    const r = parseInt(valid.slice(1, 3), 16);
    // يحول خانة اللون الأخضر (المحرفين 3 و4) إلى عدد عشري.
    const g = parseInt(valid.slice(3, 5), 16);
    // يحول خانة اللون الأزرق (المحرفين 5 و6) إلى عدد عشري.
    const b = parseInt(valid.slice(5, 7), 16);
    // يحصر قيمة الشفافية alpha صارماً بين 0 (شفاف تماماً) و1 (معتم تماماً).
    const a = Math.max(0, Math.min(1, Number(alpha) || 0));
    // يعيد نص rgba النهائي المعتمد في CSS لتلوين الطبقة #mq-tint-layer.
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
    // يغلق دالة hexToRgba.
  }

  // يعرّف دالة رياضية مساعدة لحصر أي قيمة رقمية بين حد أدنى وأقصى مع قيمة بديلة عند الخطأ، لحماية الفلاتر البصرية.
  function clamp(num, min, max, fallback) {
    // يحول المدخل إلى رقم صريح.
    const n = Number(num);
    // يعيد القيمة الاحتياطية fallback إذا كان المدخل غير رقمي (NaN).
    if (Number.isNaN(n)) return fallback;
    // يضمن ألا تقل القيمة عن min وألا تزيد عن max حتى لا تنقلب الشاشة لسواد تام بالخطأ.
    return Math.min(max, Math.max(min, n));
    // يغلق دالة التقييد الرياضي clamp.
  }

  // يعرّف دالة فحص توفر تخزين إضافات المتصفح الرسمي لتمييز التشغيل كإضافة عن التشغيل كأداة ويب.
  function hasChromeStorage() {
    // يعيد نتيجة التحقق المتسلسل من وجود كائن chrome.storage.local ودالة القراءة الخاصة به.
    return (
      // وجود الكائن chrome في النطاق.
      typeof chrome !== "undefined" &&
      // وجود خاصية التخزين storage.
      chrome.storage &&
      // وجود مخزن البيانات المحلي local.
      chrome.storage.local &&
      // وجود دالة الجلب get صالحة للاستدعاء.
      typeof chrome.storage.local.get === "function"
      // يغلق تعبير التحقق المنطقي.
    );
    // يغلق دالة hasChromeStorage.
  }

  // يعرّف دالة غير متزامنة لتحميل إعدادات المستخدم عند بدء الصفحة سواء من الإضافة أو من تخزين الويب المحلي.
  async function loadSettings() {
    // يستخدم تخزين الإضافة المشترك عبر كل التبويبات إذا كانت hasChromeStorage متحققة.
    if (hasChromeStorage()) {
      // يعيد وعداً برمجياً يجلب الإعدادات من chrome.storage.local.
      return new Promise((resolve) => {
        // يطلب قراءة مفتاح الإعدادات الموحد STORAGE_KEY_SETTINGS.
        chrome.storage.local.get([STORAGE_KEY_SETTINGS], (res) => {
          // يستخرج الكائن المحفوظ أو كائناً فارغاً عند التشغيل الأول.
          const saved = (res && res[STORAGE_KEY_SETTINGS]) || {};
          // يدمج المحفوظات فوق DEFAULT_SETTINGS ويعيد النتيجة المكتملة.
          resolve(Object.assign({}, DEFAULT_SETTINGS, saved));
          // يغلق استدعاء الجلب من تخزين الإضافة.
        });
        // يغلق وعد قراءة الإعدادات.
      });
      // يغلق فرع تخزين الإضافة.
    }
    // يستخدم localStorage القياسي عند التشغيل داخل منصة الويب الحية أو كأداة ويب مستقلة.
    try {
      // يقرأ سلسلة الإعدادات النصية من التخزين المحلي للمتصفح.
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      // يتحقق من وجود بيانات محفوظة مسبقاً.
      if (raw) {
        // يحلل نص JSON ويدمجه مع القيم الافتراضية ويعيده.
        return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
        // يغلق شرط وجود بيانات محلية.
      }
      // يتجاهل أخطاء حجب التخزين في الأطر شديدة التقييد.
    } catch (_) {}
    // يعيد نسخة نقية من الإعدادات الافتراضية عند عدم وجود أي بيانات محفوظة سابقاً.
    return Object.assign({}, DEFAULT_SETTINGS);
    // يغلق دالة تحميل الإعدادات loadSettings.
  }

  // يعرّف دالة تحديث وحفظ الإعدادات جزئياً أو كلياً ومزامنتها فوراً مع التخزين الدائم.
  async function saveSettings(partial) {
    // يدمج التعديلات الجديدة الممررة في partial فوق إعدادات الحالة الحالية state.settings.
    state.settings = Object.assign({}, state.settings, partial);
    // يحفظ النسخة المحدثة في تخزين الإضافة إذا كانت البيئة إضافة متصفح.
    if (hasChromeStorage()) {
      // يعيد وعداً ينتظر اكتمال الحفظ في chrome.storage.local (والذي سيُشعر بقية التبويبات تلقائياً).
      return new Promise((resolve) => {
        // يكتب كائن الإعدادات الكامل المحدث تحت مفتاح STORAGE_KEY_SETTINGS.
        chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: state.settings }, () => {
          // يحل الوعد بإرجاع الإعدادات المحدثة بعد الحفظ.
          resolve(state.settings);
          // يغلق استدعاء تأكيد الحفظ.
        });
        // يغلق وعد الحفظ في الإضافة.
      });
      // يغلق فرع الحفظ في تخزين الإضافة.
    }
    // يحفظ في localStorage عند العمل في وضع المنصة السحابية أو أداة الويب.
    try {
      // يحول الإعدادات إلى JSON ويخزنها محلياً.
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
      // يتجاهل استثناءات الكتابة في أوضاع التصفح المقيدة.
    } catch (_) {}
    // يعيد كائن الإعدادات المحدث للمستدعي.
    return state.settings;
    // يغلق دالة حفظ الإعدادات saveSettings.
  }

  // يعرّف دالة حساب الإعدادات الفعلية النافذة على الصفحة الحالية بعد مراعاة الاستثناءات وتخصيصات الموقع الفردية.
  function getEffectiveConfig() {
    // يأخذ مرجعاً سريعاً للإعدادات العامة الحالية في المحرك.
    const s = state.settings;
    // يأخذ اسم نطاق الموقع المفتوح حالياً والمحفوظ في state.hostname.
    const host = state.hostname;
    // يتحقق مما إذا كان المستخدم قد أدرج هذا الموقع ضمن قائمة المواقع المستثناة excludedSites.
    const isExcluded = Array.isArray(s.excludedSites) && s.excludedSites.includes(host);
    // يتحقق مما إذا كانت هناك إعدادات خاصة بهذا الموقع وحده داخل خريطة siteOverrides.
    const override = (s.siteOverrides && s.siteOverrides[host]) || null;

    // يحدد حالة التفعيل المبدئية بكون التفعيل الشامل نشطاً والموقع غير مستثنى.
    let enabled = Boolean(s.globalEnabled) && !isExcluded;
    // إذا وُجد قرار تفعيل صريح خاص بهذا الموقع في override فإنه يعلو على الحالة العامة.
    if (override && typeof override.enabled === "boolean") {
      // يعتمد قرار التفعيل الخاص بالموقع.
      enabled = override.enabled;
      // يغلق شرط التخصيص الفردي للتفعيل.
    }

    // ينشئ كائناً مدمجاً يجمع الإعدادات العامة مع أي قيم مخصصة للموقع فوقها.
    const merged = Object.assign({}, s, override || {});
    // يثبت النتيجة النهائية لقرار التفعيل في الحقل effectiveEnabled الذي تعتمد عليه دوال الرسم والقياس.
    merged.effectiveEnabled = enabled;
    // يرفق معلومة كون الموقع مستثنى لاستخدامها في التقارير وواجهة popup.js.
    merged.isExcluded = isExcluded;
    // يرفق راية توضح وجود تخصيص خاص لهذا النطاق.
    merged.hasSiteOverride = Boolean(override);
    // يعيد الكائن التنفيذي الجاهز للتطبيق الفوري على الصفحة.
    return merged;
    // يغلق دالة حساب الإعدادات النافذة getEffectiveConfig.
  }

  // يعرّف دالة إنشاء أو استرجاع وسم <style> المسؤول عن تطبيق فلاتر السطوع والوضع الداكن على الوثيقة.
  function ensureDocumentStyle() {
    // يعيد العنصر المحفوظ في الذاكرة مباشرة إذا كان لا يزال متصلاً بشجرة الصفحة لتجنب البحث المتكرر في DOM.
    if (state.styleEl && state.styleEl.isConnected) return state.styleEl;
    // يبحث عن الوسم بمعرّفه إن وُجد مسبقاً أو ينشئ عنصر style جديداً تماماً.
    const el = document.getElementById("mustaqbalat-doc-filter-style") || document.createElement("style");
    // يثبت المعرّف الفريد للوسم لمنع تضاربه مع أنماط الموقع المضيف.
    el.id = "mustaqbalat-doc-filter-style";
    // يضيف سمة وصفية توضح تبعية هذا العنصر لنواة فلاتر مستقبلات.
    el.setAttribute("data-mustaqbalat", "core-filter");
    // يحدد الأب المناسب لإلحاق الوسم به (head إن اكتمل أو جذر documentElement في مرحلة document_start المبكرة).
    const parent = document.head || document.documentElement;
    // يلحق وسم الأنماط بالأب إذا لم يكن متصلاً بعد بشجرة الوثيقة.
    if (parent && !el.isConnected) {
      // ينفذ الإلحاق الفعلي في DOM ليمنع وميض البياض الساطع قبل اكتمال تحميل الصفحة.
      parent.appendChild(el);
      // يغلق شرط الإلحاق.
    }
    // يخزن مرجع العنصر في state.styleEl للاستخدام اللحظي السريع في المرات القادمة.
    state.styleEl = el;
    // يعيد عنصر الأنماط الجاهز لحقن قواعد CSS بداخله.
    return el;
    // يغلق دالة ضمان وسم أنماط الوثيقة ensureDocumentStyle.
  }

  // يعرّف دالة إنشاء أو استرجاع مضيف Shadow DOM المعزول لطبقات التعتيم العلوية ومؤشر الاستهلاك الحي.
  function ensureOverlayHost() {
    // يعيد جذر Shadow DOM مباشرة إذا كان المضيف متصلاً ونشطاً لتعظيم سرعة التحديث (< 0.3ms).
    if (state.rootHost && state.rootHost.isConnected && state.shadowRoot) {
      // يرجع المرجع المخزن دون أي تعديل إضافي على شجرة الصفحة.
      return state.shadowRoot;
      // يغلق شرط التحقق السريع.
    }
    // يحدد الجذر الأعلى للصفحة لإلحاق مضيف الطبقات به حتى في مرحلة document_start.
    const parent = document.documentElement || document.body;
    // يتوقف مؤقتاً إذا لم تنشأ شجرة الوثيقة الأولية بعد.
    if (!parent) return null;

    // يتحقق من وجود عنصر الاستضافة في الصفحة بمعرّفه قبل إنشاء عنصر جديد.
    let host = document.getElementById("mustaqbalat-root-host");
    // إذا لم يكن موجوداً، ينشئ عنصر div معزولاً بالكامل عن تنسيقات الموقع.
    if (!host) {
      // ينشئ عنصر الاستضافة الجذري.
      host = document.createElement("div");
      // يعطيه المعرّف الفريد المرتبط أيضاً بقاعدة العكس المضاد في الوضع الداكن.
      host.id = "mustaqbalat-root-host";
      // يضع سمة تعريفية تشير لدوره كمضيف للطبقات.
      host.setAttribute("data-mustaqbalat", "overlay-host");
      // يصفر جميع الأنماط الموروثة ويجعله بحجم صفري وأعلى ترتيب طبقي مع عدم اعتراض نقرات المستخدم نهائياً.
      host.style.cssText =
        // نص قواعد العزل الصارمة بعلامة !important لمنع أي موقع من إزاحته أو حجبه.
        "all:initial !important; position:fixed !important; inset:0 !important; width:0 !important; height:0 !important; z-index:2147483647 !important; pointer-events:none !important;";
      // يلحق المضيف المعزول بجذر الصفحة.
      parent.appendChild(host);
      // يغلق كتلة إنشاء مضيف الطبقات الجديد.
    }
    // يسترجع شجرة Shadow DOM المفتوحة القائمة أو يرفق شجرة جديدة بالعنصر المضيف.
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    // يحفظ مرجع العنصر المضيف في كائن الحالة العام للمحرك.
    state.rootHost = host;
    // يحفظ مرجع جذر Shadow DOM للوصول الفوري للطبقات والمؤشر الحي.
    state.shadowRoot = shadow;
    // يعيد جذر Shadow DOM المعزول.
    return shadow;
    // يغلق دالة ensureOverlayHost.
  }

  // يعرّف الدالة الهندسية التي تولّد قواعد CSS الدقيقة للسطوع والألوان والوضع الداكن ودعم PDF بناءً على الإعدادات.
  function buildFilterCss(cfg, isPdf) {
    // يعيد نصاً فارغاً فوراً إذا كانت الأداة موقفة على هذه الصفحة لإلغاء أي تأثير بصري.
    if (!cfg.effectiveEnabled) return "";
    // يعيد نصاً فارغاً إذا كانت الصفحة ملف PDF وكان خيار دعم الـ PDF معطلاً من المستخدم.
    if (isPdf && !cfg.pdfEnabled) return "";

    // يحدد ما إذا كان يجب تفعيل فلاتر CSS (في وضعي "filter" أو الدمج الذكي "hybrid").
    const useFilter = cfg.method === "filter" || cfg.method === "hybrid";
    // ينشئ مصفوفة لتجميع كتل قواعد CSS التي ستُحقن في الوثيقة.
    const rules = [];

    // يقيّد قيمة السطوع بين 20% و150% عبر دالة clamp لضمان سلامة العرض.
    let brightness = clamp(cfg.brightness, 20, 150, 88);
    // إذا كانت الصفحة مستند PDF وهناك تعتيم إضافي مخصص للـ PDF، يخصمه من السطوع لراحة أكبر من بياض الورق.
    if (isPdf && cfg.pdfExtraDim > 0) {
      // يطرح نسبة التعتيم الإضافي للـ PDF مع ضمان عدم نزول السطوع الكلي تحت 20%.
      brightness = Math.max(20, brightness - clamp(cfg.pdfExtraDim, 0, 50, 0));
      // يغلق شرط التعتيم الإضافي لمستندات PDF.
    }
    // يقيّد نسبة التباين بين 50% و150%.
    const contrast = clamp(cfg.contrast, 50, 150, 100);
    // يقيّد نسبة الدفء اللوني (تصفية الأزرق) بين 0% و100%.
    const warmth = clamp(cfg.warmth, 0, 100, 12);
    // يقيّد تشبع ألوان الصفحة بين 0% (رمادي كامل) و150% (ألوان غنية).
    const saturation = clamp(cfg.saturation, 0, 150, 100);
    // يقيّد زاوية تدوير طيف الألوان بين -180 و+180 درجة.
    const hueRotate = clamp(cfg.hueRotate, -180, 180, 0);
    // يقيّد معامل تخفيف وهج البياض بين 0% و60%.
    const pageColorDim = clamp(cfg.pageColorDim, 0, 60, 0);

    // ينشئ مصفوفة فرعية لتجميع دوال خاصية filter الواحدة على عنصر html.
    const filterParts = [];

    // Dark Mode transformations
    // يفحص اختيار "الوضع الداكن الذكي" الذي يعكس الإضاءة ويدير الطيف اللوني 180 درجة للحفاظ على هوية الألوان.
    if (cfg.darkMode === "smart") {
      // يضيف عكساً مريحاً بنسبة 92% (رمادي داكن فخم بدلاً من الأسود الحاد) مع تصحيح الطيف اللوني.
      filterParts.push("invert(0.92)", "hue-rotate(180deg)");
      // يفحص اختيار "الوضع الداكن الدافئ للقراءة" المخصص للمقالات والكتب الطويلة.
    } else if (cfg.darkMode === "warm-dark") {
      // يضيف عكساً ناعماً بنسبة 88% مع لمسة دفء sepia لتهدئة إضاءة الأحرف في الظلام.
      filterParts.push("invert(0.88)", "hue-rotate(180deg)", "sepia(0.18)");
      // يفحص اختيار "الوضع الداكن العميق AMOLED" المخصص لشاشات الهواتف والـ OLED الموفرة للطاقة.
    } else if (cfg.darkMode === "amoled") {
      // يضيف عكساً شبه كامل بنسبة 98% مع رفع طفيف للتباين لإبراز النصوص بوضوح عالٍ.
      filterParts.push("invert(0.98)", "hue-rotate(180deg)", "contrast(1.08)");
      // يفحص اختيار "الوضع الداكن المخصص لملفات PDF".
    } else if (cfg.darkMode === "pdf-dark") {
      // يضيف عكساً متوازناً بنسبة 90% وتبايناً هادئاً يناسب خطوط المستندات الأكاديمية والكتب المصورة.
      filterParts.push("invert(0.90)", "hue-rotate(180deg)", "contrast(0.95)");
      // يغلق سلسلة شروط أنماط الوضع الداكن.
    }

    // يفحص تفعيل آلية الفلتر لإضافة دوال السطوع والتباين والدفء والتشبع وتدوير اللون إلى المصفوفة.
    if (useFilter) {
      // يدمج أثر تخفيف وهج الصفحة مع نسبة السطوع الأساسية للوصول إلى السطوع الفعلي المريح.
      const effectiveBrightness = Math.max(15, brightness - pageColorDim * 0.35);
      // يضيف دالة السطوع فقط إذا اختلفت عن 100% لتجنب إجهاد المتصفح بفلتر محايد غير ضروري.
      if (effectiveBrightness !== 100) filterParts.push(`brightness(${(effectiveBrightness / 100).toFixed(3)})`);
      // يضيف دالة التباين عند اختلافها عن القيمة القياسية 100%.
      if (contrast !== 100) filterParts.push(`contrast(${(contrast / 100).toFixed(3)})`);
      // يضيف دالة الدفء اللوني (sepia) متناسبة مع شريط الدفء لتصفية الضوء الأزرق.
      if (warmth > 0) filterParts.push(`sepia(${(warmth / 100 * 0.65).toFixed(3)})`);
      // يضيف دالة تشبع الألوان عند رغبة المستخدم بتقليل أو زيادة حدة ألوان الموقع.
      if (saturation !== 100) filterParts.push(`saturate(${(saturation / 100).toFixed(3)})`);
      // يضيف دالة تدوير طيف ألوان الصفحة عند اختيار زاوية غير صفرية.
      if (hueRotate !== 0) filterParts.push(`hue-rotate(${hueRotate}deg)`);
      // يغلق كتلة تجميع دوال الفلتر اللوني والضوئي.
    }

    // يتحقق من وجود فلتر واحد على الأقل لتوليد قواعد CSS المقابلة له.
    if (filterParts.length > 0) {
      // يدمج جميع دوال الفلتر المتجمعة في سلسلة نصية واحدة مفصولة بمسافات.
      const filterStr = filterParts.join(" ");
      // يدفع القاعدة الرئيسية التي تطبق الفلتر على عنصر جذر الوثيقة html مع انتقال ناعم 120ms.
      rules.push(`
        html {
          filter: ${filterStr} !important;
          transition: filter 120ms ease !important;
        }
      `);

      // Counter-invert images, videos & media when Smart Dark Mode is enabled (except PDFs)
      // يتحقق من تفعيل الوضع الداكن على صفحة ويب عادية لحماية الصور والفيديوهات من التحول لألوان سلبية معكوسة.
      if (
        // يشمل أوضاع الداكن الذكي والدافئ وAMOLED.
        (cfg.darkMode === "smart" || cfg.darkMode === "warm-dark" || cfg.darkMode === "amoled") &&
        // يستثني مستندات الـ PDF المباشرة لكي تنعكس صفحاتها البيضاء بالكامل بنجاح.
        !isPdf
        // يغلق شرط حماية الوسائط المرئية.
      ) {
        // يدفع قاعدة العكس المضاد على الصور والفيديو واللوحات الرسومية وإطارات يوتيوب وفيميو لتبقى بألوانها الطبيعية.
        rules.push(`
          html img,
          html video,
          html picture,
          html canvas,
          html svg image,
          html [style*="background-image"]:not(body):not(html),
          html iframe[src*="youtube.com"],
          html iframe[src*="vimeo.com"] {
            filter: invert(1) hue-rotate(180deg) !important;
          }
        `);
        // يغلق كتلة حماية الوسائط المرئية في الوضع الداكن.
      }

      // Direct targeting for embedded PDF plugins so Chromium/Firefox PDF embeds dim reliably
      // يضيف استهدافاً صريحاً لعناصر عارض الـ PDF المدمج لأن متصفحات كروميوم تتطلب تطبيق الفلتر مباشرة على عنصر embed.
      if (cfg.pdfEnabled) {
        // يدفع قاعدة الفلتر المخصصة لوسمي embed وobject من نوع application/pdf شاملة السطوع والوضع الداكن.
        rules.push(`
          embed[type="application/pdf"],
          object[type="application/pdf"] {
            filter: ${useFilter ? `brightness(${(brightness / 100).toFixed(3)}) contrast(${(contrast / 100).toFixed(3)})` : "none"} ${
          cfg.darkMode === "pdf-dark" || cfg.darkMode === "smart"
            ? "invert(0.9) hue-rotate(180deg)"
            : ""
        } !important;
          }
        `);
        // يغلق شرط استهداف عارضات الـ PDF المدمجة.
      }
      // يغلق كتلة القواعد المعتمدة على وجود فلاتر نشطة.
    }

    // Counter-invert our own Shadow Host if HTML is inverted so HUD & color overlay stay accurate!
    // إذا كان عنصر html معكوساً بالوضع الداكن، يطبق عكساً مضاداً على مضيف طبقاتنا ليبقى لون HEX المختار ومؤشر الاستهلاك بألوانهما الحقيقية الدقيقة!
    if (cfg.darkMode !== "off" && filterParts.length > 0) {
      // يدفع قاعدة حماية مضيف Shadow DOM من انعكاس الوضع الداكن الأبوي.
      rules.push(`
        #mustaqbalat-root-host {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `);
      // يغلق شرط حماية مضيف الطبقات.
    }

    // Soften glaring white backgrounds when pageColorDim > 0 without dark mode
    // يهدئ لون خلفية الجذر الأبيض الفاقع بدرجة رمادية/ورقية ناعمة عند رفع شريط تخفيف وهج الأبيض في الوضع العادي.
    if (pageColorDim > 0 && cfg.darkMode === "off") {
      // يحسب الدرجة اللونية الهادئة بطرح نسبة من القيمة البيضاء القصوى 255.
      const shade = Math.round(255 - pageColorDim * 1.4);
      // يدفع قاعدة تهدئة خلفية الجذر لتقليل إبهار الحواف البيضاء في المواقع.
      rules.push(`
        html {
          background-color: rgb(${shade}, ${shade}, ${Math.max(200, shade - 4)}) !important;
        }
      `);
      // يغلق شرط تهدئة وهج الخلفية البيضاء.
    }

    // يجمع كافة القواعد المتولدة في نص CSS واحد متكامل لحقنه في وسم الأنماط.
    return rules.join("\n");
    // يغلق دالة توليد أنماط الفلاتر buildFilterCss.
  }

  // يعرّف دالة تحويل اسم الزاوية المختارة لمؤشر الاستهلاك الحي إلى إحداثيات CSS دقيقة.
  function getHudPositionCss(pos) {
    // يفحص قيمة الزاوية المحددة في الإعدادات.
    switch (pos) {
      // حالة الزاوية اليمنى السفلية.
      case "bottom-right":
        // يعيد إزاحة 14 بكسل من الأسفل واليمين.
        return "bottom: 14px; right: 14px;";
      // حالة الزاوية اليسرى العلوية.
      case "top-left":
        // يعيد إزاحة 14 بكسل من الأعلى واليسار.
        return "top: 14px; left: 14px;";
      // حالة الزاوية اليمنى العلوية.
      case "top-right":
        // يعيد إزاحة 14 بكسل من الأعلى واليمين.
        return "top: 14px; right: 14px;";
      // حالة الزاوية اليسرى السفلية والحالة الافتراضية المعتمدة.
      case "bottom-left":
      // يحدد المسار الافتراضي عند أي قيمة غير معروفة.
      default:
        // يعيد إزاحة 14 بكسل من الأسفل واليسار.
        return "bottom: 14px; left: 14px;";
      // يغلق جملة التبديل switch.
    }
    // يغلق دالة تحديد موقع المؤشر getHudPositionCss.
  }

  // يعرّف دالة رسم وتحديث الطبقات العلوية الفوقية (Overlay Layers) ومؤشر الاستهلاك الحي داخل شجرة Shadow DOM المعزولة.
  function renderShadowOverlay(cfg, isPdf) {
    // يضمن وجود واسترجاع جذر Shadow DOM عبر دالة ensureOverlayHost.
    const shadow = ensureOverlayHost();
    // يخرج بأمان إذا لم تكن شجرة الوثيقة جاهزة بعد في أجزاء المللي ثانية الأولى.
    if (!shadow) return;

    // يحدد ما إذا كانت الطبقات البصرية يجب أن تنشط على هذه الصفحة (مع مراعاة تفعيل الـ PDF).
    const active = cfg.effectiveEnabled && (!isPdf || cfg.pdfEnabled);
    // يتحقق من اختيار المستخدم لوضع الطبقات الفوقية ("overlay") أو الوضع الهجين ("hybrid").
    const useOverlay = cfg.method === "overlay" || cfg.method === "hybrid";

    // Calculate dimmer layer alpha:
    // Combine explicit overlayOpacity + extra dimming if user selected "overlay"-only mode and brightness < 100
    // يهيئ متغير شفافية طبقة التعتيم السوداء بصفر مبدئياً.
    let dimmerAlpha = 0;
    // يهيئ متغير شفافية طبقة رفع الإضاءة البيضاء بصفر مبدئياً (تُستخدم عند اختيار وضع الطبقات فقط مع سطوع > 100%).
    let boostAlpha = 0;
    // يحسب كثافة الطبقات الفعلية إذا كانت الأداة نشطة ووضع الطبقات مفعلاً.
    if (active && useOverlay) {
      // يحول النسبة المئوية لشريط طبقة التعتيم (overlayOpacity) إلى معامل شفافية بين 0 و0.85.
      dimmerAlpha = clamp(cfg.overlayOpacity, 0, 85, 14) / 100;
      // إذا اختار المستخدم الاعتماد على "طبقات فوق الموقع فقط" بدون فلتر CSS، يترجم شريط السطوع أيضاً إلى كثافة طبقة!
      if (cfg.method === "overlay") {
        // يقرأ قيمة السطوع المقيّدة بين 20 و150.
        const b = clamp(cfg.brightness, 20, 150, 88);
        // عند خفض السطوع تحت 100%، يزيد شفافية طبقة التعتيم السوداء تناسبياً.
        if (b < 100) {
          // يدمج تعتيم السطوع مع شفافية الطبقة بحد أقصى آمن 0.88 حتى تظل عناصر الصفحة مرئية.
          dimmerAlpha = Math.min(0.88, dimmerAlpha + (100 - b) / 115);
          // وعند رفع السطوع فوق 100% في وضع الطبقات، يفعّل طبقة الإضاءة الساطعة بنمط دمج screen.
        } else if (b > 100) {
          // يحسب شفافية طبقة رفع السطوع بحد أقصى ناعم 0.35.
          boostAlpha = Math.min(0.35, (b - 100) / 140);
          // يغلق شروط ترجمة السطوع إلى طبقات.
        }
        // يغلق شرط وضع الطبقات الخالص.
      }
      // يضيف تعتيم الـ PDF الإضافي إلى الطبقة السوداء العلوية لضمان تعتيم حتى عارضات الـ PDF المحمية في المتصفح.
      if (isPdf && cfg.pdfExtraDim > 0) {
        // يرفع كثافة طبقة التعتيم فوق مستند الـ PDF بحد أقصى 0.90.
        dimmerAlpha = Math.min(0.9, dimmerAlpha + clamp(cfg.pdfExtraDim, 0, 50, 0) / 150);
        // يغلق شرط تعتيم الـ PDF عبر الطبقة العلوية.
      }
      // يغلق كتلة حساب شفافية طبقات التعتيم والإضاءة.
    }

    // يحسب شفافية طبقة التلوين السداسي (HEX) عند تفعيلها صراحة أو عند رفع شريط الدفء لمستويات عالية.
    const tintAlpha =
      // يشترط كون الأداة نشطة مع تفعيل اللون المخصص أو تجاوز الدفء 25%.
      active && (cfg.tintEnabled || cfg.warmth > 25)
        // يفحص ما إذا كان المستخدم قد فعّل لون HEX المخصص صراحة.
        ? cfg.tintEnabled
          // يعتمد شدة اللون المختارة في شريط tintOpacity مقسومة على 100.
          ? clamp(cfg.tintOpacity, 0, 80, 18) / 100
          // وإلا يضيف مسحة عنبرية خفيفة تلقائية متناسبة مع شريط الدفء العالي.
          : clamp((cfg.warmth - 25) * 0.25, 0, 20, 0) / 100
        // يضع الشفافية بصفر عند إيقاف الأداة أو عدم تفعيل التلوين.
        : 0;

    // يحول كود لون HEX المختار وشفافيته المحسوبة أعلاه إلى قيمة rgba صالحة للرسم عبر دالة hexToRgba.
    const tintRgba = hexToRgba(cfg.tintColor || "#F59E0B", tintAlpha);
    // يقرأ نمط الدمج البصري المختار لطبقة اللون (مثل multiply أو soft-light أو color).
    const blendMode = cfg.tintBlendMode || "multiply";

    // يبني الهيكل الداخلي لشجرة Shadow DOM لمرة واحدة فقط في عمر الصفحة لتفادي هدم وإعادة بناء العناصر مع كل حركة مؤشر.
    if (!shadow.querySelector("#mustaqbalat-shadow-style")) {
      // يزرع أنماط الطبقات ومؤشر الاستهلاك الحي وعناصر الطبقات الأربع داخل Shadow DOM.
      shadow.innerHTML = `
        <style id="mustaqbalat-shadow-style">
          /* يعزل جذر Shadow DOM تماماً عن أي أنماط موروثة من الموقع المفتوح */
          :host { all: initial; }
          /* الصنف المشترك لجميع الطبقات البصرية العلوية الموضوعة فوق الموقع */
          .mq-layer {
            /* تثبيت كامل عبر الشاشة يغطي التمرير وكافة الإطارات */
            position: fixed;
            /* يمتد من الحافة للحافة في الاتجاهات الأربعة */
            inset: 0;
            /* يغطي عرض نافذة المتصفح بالكامل */
            width: 100vw;
            /* يغطي ارتفاع نافذة المتصفح بالكامل */
            height: 100vh;
            /* يضمن مرور جميع نقرات الفأرة واللمس إلى أزرار الموقع تحت الطبقة دون أي إعاقة */
            pointer-events: none !important;
            /* يمنع تحديد الطبقة عند تظليل النصوص في الصفحة */
            user-select: none !important;
            /* يضمن انتقالاً بصرياً سلساً مريحاً للعين عند تحريك أشرطة السطوع واللون */
            transition: background-color 140ms ease, opacity 140ms ease;
          }
          /* ترتيب طبقة التعتيم السوداء فوق محتوى الموقع مباشرة */
          #mq-dimmer-layer { z-index: 2147483640; }
          /* ترتيب طبقة رفع الإضاءة البيضاء بنمط دمج screen */
          #mq-boost-layer  { z-index: 2147483641; mix-blend-mode: screen; }
          /* ترتيب طبقة تلوين الشاشة المخصص بكود HEX فوق الطبقتين السابقتين */
          #mq-tint-layer   { z-index: 2147483642; }
          /* تنسيق مؤشر قياس استهلاك النظام الحي المعروض داخل الصفحة */
          #mq-hud {
            /* تثبيت المؤشر في الزاوية المختارة من الشاشة */
            position: fixed;
            /* وضعه فوق الطبقات اللونية ليبقى مقروءاً بوضوح */
            z-index: 2147483646;
            /* السماح للمستخدم بالنقر على أزرار التصغير والإخفاء داخل المؤشر */
            pointer-events: auto;
            /* ضبط اتجاه القراءة العربي من اليمين إلى اليسار */
            direction: rtl;
            /* استخدام خطوط النظام العربية الواضحة دون تحميل خطوط خارجية تستهلك الشبكة */
            font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif;
            /* خلفية كحلية داكنة نصف شفافة مريحة للعين */
            background: rgba(15, 23, 42, 0.90);
            /* لون نص أبيض هادئ واضح القراءة */
            color: #F8FAFC;
            /* إطار سماوي دقيق يميز المؤشر عن محتوى الصفحة */
            border: 1px solid rgba(56, 189, 248, 0.35);
            /* حواف دائرية ناعمة */
            border-radius: 12px;
            /* حشوة داخلية مضغوطة لكي لا يحجب مساحة من الموقع */
            padding: 7px 11px;
            /* حجم خط مدمج ومتوازن */
            font-size: 11.5px;
            /* ارتفاع سطر مريح للأرقام العربية والإنجليزية */
            line-height: 1.45;
            /* ظل ناعم لفصل المؤشر عن الصفحات الفاتحة والداكنة */
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
            /* تمويه زجاجي خلفي خفيف */
            backdrop-filter: blur(8px);
            /* رصف أفقي مرن للنقطة المضيئة والقياسات والأزرار */
            display: flex;
            /* توسيط عمودي للعناصر داخل المؤشر */
            align-items: center;
            /* مسافة فاصلة منتظمة بين أجزاء المؤشر */
            gap: 8px;
            /* انتقال ناعم عند التصغير أو مرور الفأرة */
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          /* إظهار المؤشر بوضوح كامل عند تمرير مؤشر الفأرة فوقه */
          #mq-hud:hover { opacity: 1 !important; }
          /* تنسيق الحالة المصغرة الكبسولية للمؤشر عند ضغط زر التصغير */
          #mq-hud.minimized {
            /* تقليص الحشوة الداخلية في الوضع المصغر */
            padding: 5px 9px;
            /* تحويل الحواف إلى شكل كبسولة دائرية بالكامل */
            border-radius: 999px;
            /* تخفيف الشفافية ليكون شبه خفي أثناء القراءة */
            opacity: 0.72;
          }
          /* النقطة الضوئية الخضراء الدالة على عمل الحماية البصرية في الصفحة */
          .mq-dot {
            /* عرض النقطة 8 بكسل */
            width: 8px;
            /* ارتفاع النقطة 8 بكسل */
            height: 8px;
            /* استدارة كاملة */
            border-radius: 50%;
            /* لون أخضر دال على التفعيل السليم */
            background: #22C55E;
            /* توهج أخضر خفيف حول النقطة */
            box-shadow: 0 0 8px #22C55E;
            /* منع انكماش النقطة عند ضيق المساحة */
            flex-shrink: 0;
          }
          /* تحويل لون النقطة للرمادي بدون توهج عند إيقاف الأداة على الموقع */
          .mq-dot.off {
            /* لون رمادي محايد */
            background: #94A3B8;
            /* إزالة التوهج الضوئي */
            box-shadow: none;
          }
          /* حاوية شرائح الأرقام القياسية (الوضع، المعالجة، الذاكرة، الإطارات) */
          .mq-metrics {
            /* عرض مرن أفقي للشرائح */
            display: flex;
            /* محاذاة عمودية في المنتصف */
            align-items: center;
            /* مسافة 8 بكسل بين كل قراءة وأخرى */
            gap: 8px;
            /* السماح بالالتفاف في الشاشات الضيقة جداً */
            flex-wrap: wrap;
          }
          /* تنسيق كل شريحة قراءة فردية داخل المؤشر الحي */
          .mq-chip {
            /* خلفية داكنة تبرز الرقم القياسي */
            background: rgba(30, 41, 59, 0.9);
            /* حدود خفيفة فاصلة */
            border: 1px solid rgba(148, 163, 184, 0.2);
            /* زوايا مستديرة صغيرة */
            border-radius: 6px;
            /* حشوة داخلية خفيفة حول النص والرقم */
            padding: 1px 6px;
            /* تثبيت عرض الأرقام لمنع اهتزاز الشريط عند تغير أجزاء المللي ثانية */
            font-variant-numeric: tabular-nums;
            /* لون نص رمادي فاتح مريح */
            color: #E2E8F0;
            /* منع انقسام القراءة الواحدة على سطرين */
            white-space: nowrap;
          }
          /* تمييز القيمة الرقمية نفسها باللون السماوي الواضح والخط العريض */
          .mq-chip b { color: #38BDF8; font-weight: 600; }
          /* تنسيق أزرار التحكم الصغيرة (تصغير / توسيع / إخفاء) داخل المؤشر */
          .mq-btn-icon {
            /* إزالة كافة تنسيقات الأزرار الافتراضية للمتصفح */
            all: unset;
            /* إظهار مؤشر اليد عند التمرير */
            cursor: pointer;
            /* لون رمادي هادئ للأيقونة */
            color: #94A3B8;
            /* حجم الأيقونة النصية */
            font-size: 12px;
            /* مساحة نقر مريحة */
            padding: 2px 5px;
            /* زوايا ناعمة عند التمرير */
            border-radius: 5px;
            /* انتقال سلس للخلفية واللون */
            transition: background 0.15s, color 0.15s;
          }
          /* إضاءة خلفية الزر عند مرور الفأرة فوقه */
          .mq-btn-icon:hover {
            /* خلفية بيضاء شفافة خفيفة */
            background: rgba(255, 255, 255, 0.12);
            /* تحويل لون الأيقونة للأبيض الصريح */
            color: #FFFFFF;
          }
        </style>
        <!-- عنصر طبقة التعتيم السوداء الشفافة فوق الصفحة -->
        <div id="mq-dimmer-layer" class="mq-layer"></div>
        <!-- عنصر طبقة رفع الإضاءة عند اختيار سطوع أعلى من 100% في وضع الطبقات -->
        <div id="mq-boost-layer" class="mq-layer"></div>
        <!-- عنصر طبقة تلوين الشاشة المخصص بكود HEX وأنماط الدمج -->
        <div id="mq-tint-layer" class="mq-layer"></div>
        <!-- عنصر مؤشر استهلاك الأداة الحي داخل الصفحة -->
        <div id="mq-hud" style="display:none;"></div>
        <!-- منفذ احتياطي مخصص لدمج أدوات الويب الإضافية عند الحاجة -->
        <div id="mq-web-widget-slot"></div>
      `;
      // يغلق شرط التأسيس الأولي لشجرة Shadow DOM.
    }

    // يجلب عنصر طبقة التعتيم السوداء من داخل Shadow DOM لتحديث شفافيته.
    const dimmerEl = shadow.getElementById("mq-dimmer-layer");
    // يجلب عنصر طبقة التعزيز الضوئي من داخل Shadow DOM.
    const boostEl = shadow.getElementById("mq-boost-layer");
    // يجلب عنصر طبقة التلوين السداسي HEX من داخل Shadow DOM.
    const tintEl = shadow.getElementById("mq-tint-layer");
    // يجلب عنصر مؤشر الاستهلاك الحي لتحديث قراءاته وموقعه.
    const hudEl = shadow.getElementById("mq-hud");

    // يحدّث طبقة التعتيم السوداء إذا كانت موجودة في الشجرة.
    if (dimmerEl) {
      // يضبط اللون الأسود بالشفافية المحسوبة بدقة في متغير dimmerAlpha.
      dimmerEl.style.backgroundColor = `rgba(0, 0, 0, ${dimmerAlpha.toFixed(3)})`;
      // يخفي الطبقة تماماً من حسابات الرسم في المتصفح إذا كانت شفافيتها صفرية لتوفير طاقة المعالج الرسومي (GPU).
      dimmerEl.style.display = dimmerAlpha > 0.002 ? "block" : "none";
      // يغلق تحديث طبقة التعتيم.
    }
    // يحدّث طبقة رفع الإضاءة البيضاء بنفس الكفاءة.
    if (boostEl) {
      // يضبط اللون الأبيض بالشفافية المحسوبة في متغير boostAlpha.
      boostEl.style.backgroundColor = `rgba(255, 255, 255, ${boostAlpha.toFixed(3)})`;
      // يعطل رسم الطبقة في المتصفح عندما لا تكون مطلوبة (السطوع <= 100%).
      boostEl.style.display = boostAlpha > 0.002 ? "block" : "none";
      // يغلق تحديث طبقة التعزيز الضوئي.
    }
    // يحدّث طبقة تلوين الشاشة المخصصة بكود HEX.
    if (tintEl) {
      // يسند لون rgba المستنتج من كود HEX والشفافية إلى خلفية الطبقة.
      tintEl.style.backgroundColor = tintRgba;
      // يطبق نمط الدمج البصري المختار من المستخدم (multiply, soft-light, color...).
      tintEl.style.mixBlendMode = blendMode;
      // يوقف رسم الطبقة بالكامل عند عدم تفعيل التلوين للحفاظ على صفرية استهلاك الموارد.
      tintEl.style.display = tintAlpha > 0.002 ? "block" : "none";
      // يغلق تحديث طبقة التلوين.
    }

    // يحفظ مرجع عنصر المؤشر في state.hudEl ليستخدمه جامع القياسات الحية.
    state.hudEl = hudEl;
    // يستدعي دالة تحديث محتوى وموضع مؤشر الاستهلاك الحي داخل الصفحة.
    updateHudDisplay(cfg, isPdf);
    // يغلق دالة رسم طبقات Shadow DOM.
  }

  // يعرّف دالة القياس الفعلي لاستهلاك الأداة داخل الصفحة الحالية (حجم الأنماط، عقد DOM، وفرق ذاكرة JS).
  function measureMetrics() {
    // يقرأ طول النص المحقون في وسم أنماط الوثيقة إن وُجد.
    const styleText = state.styleEl ? state.styleEl.textContent || "" : "";
    // يقرأ طول الشفرة الهيكلية المحقونة داخل شجرة Shadow DOM إن وُجدت.
    const shadowHtml = state.shadowRoot ? state.shadowRoot.innerHTML || "" : "";
    // يجمع إجمالي عدد المحارف المحقونة من قبل الأداة في الصفحة.
    const totalChars = styleText.length + shadowHtml.length;
    // يخزن الحجم النصي المحقون بالبايت التقريبي داخل state.domBytes.
    state.domBytes = totalChars;
    // يحسب العدد الفعلي الدقيق لجميع عقد DOM التي أضافتها الأداة (وسم النمط + المضيف + عناصر Shadow DOM).
    state.domNodes =
      // عقدة واحدة لوسم الأنماط في رأس الصفحة.
      (state.styleEl ? 1 : 0) +
      // عقدة واحدة لعنصر الاستضافة المعزول.
      (state.rootHost ? 1 : 0) +
      // مضافاً إليها عدد العناصر الداخلية الخفيفة داخل Shadow DOM.
      (state.shadowRoot ? state.shadowRoot.querySelectorAll("*").length : 0);

    // يفحص توفر واجهة performance.memory لقراءة ذاكرة كومة جافاسكربت الفعلية في متصفحات كروميوم.
    if (typeof performance !== "undefined" && performance.memory) {
      // يقرأ إجمالي الذاكرة المستخدمة في التبويب حالياً بالبايت.
      const currentHeap = performance.memory.usedJSHeapSize;
      // يحول إجمالي ذاكرة التبويب إلى ميجابايت مقربة لخانتين عشريتين.
      state.tabHeapMB = Number((currentHeap / (1024 * 1024)).toFixed(2));
      // يحسب الزيادة الفعلية بالكيلوبايت مقارنة بالذاكرة المرجعية baselineHeapBytes قبل تشغيل الأداة.
      const rawDeltaKB = Math.max(12, Math.round((currentHeap - baselineHeapBytes) / 1024));
      // يقيّد القراءة لعزل تقلبات جامع القمامة التلقائي في المتصفح (GC) عن استهلاك الأداة الحقيقي.
      state.heapDeltaKB = Math.min(rawDeltaKB, 420);
      // وفي المتصفحات التي لا تكشف performance.memory (مثل فايرفوكس وسفاري)، يحسب البصمة هندسياً من حجم DOM الفعلي.
    } else {
      // يضع ذاكرة التبويب الكلية بصفر لعدم كشف المتصفح لها.
      state.tabHeapMB = 0;
      // يحسب استهلاك الأداة بالكيلوبايت من مجموع حجم أنماطها وهياكلها مضافاً إليه 12KB للبنية البرمجية بالذاكرة.
      state.heapDeltaKB = Math.max(14, Math.round(state.domBytes / 1024) + 12);
      // يغلق فرع الحساب البديل للذاكرة.
    }
    // يغلق دالة قياس الموارد measureMetrics.
  }

  // يعرّف دالة قياس معدل الإطارات الحقيقي (FPS) التي تعمل فقط عندما يكون مؤشر الاستهلاك مفتوحاً ومرئياً أمام المستخدم.
  function startFpsSampler() {
    // يمنع تشغيل أكثر من حلقة قياس واحدة في نفس الوقت.
    if (state.fpsRafId) return;
    // يصفر عداد الإطارات المرسومة خلال نافذة القياس.
    let frames = 0;
    // يسجل الطابع الزمني لبداية نافذة القياس الحالية.
    let lastTime = performance.now();

    // يعرّف دالة النبضة التي يستدعيها المتصفح مع كل إطار رسم للشاشة.
    function tick(now) {
      // يوقف حلقة القياس تماماً (0% استهلاك CPU) فور إخفاء المؤشر أو تصغيره أو انتقال المستخدم لتبويب آخر!
      if (!state.settings.showInPageHud || state.settings.hudMinimized || document.hidden) {
        // يصفر معرّف الحلقة للسماح بإعادة تشغيلها لاحقاً عند توسيع المؤشر.
        state.fpsRafId = null;
        // ينهي الاستدعاء التكراري فوراً حفاظاً على بطارية وموارد الجهاز.
        return;
        // يغلق شرط التوقف الذكي الموفر للطاقة.
      }
      // يزيد عداد الإطارات بمقدار واحد لهذا الإطار.
      frames++;
      // يحدث قراءة الـ FPS كل 1500 مللي ثانية (ثانية ونصف) لتكون قراءة هادئة ومستقرة دون وميض مزعج.
      if (now - lastTime >= 1500) {
        // يحسب عدد الإطارات في الثانية الواحدة ويقيده بين 1 و144 هرتز.
        state.fps = Math.min(144, Math.max(1, Math.round((frames * 1000) / (now - lastTime))));
        // يعيد تصفير عداد الإطارات للنافذة الزمنية التالية.
        frames = 0;
        // يحدّث الطابع الزمني المرجعي باللحظة الحالية.
        lastTime = now;
        // يحدّث الأرقام فقط داخل المؤشر دون إعادة بناء عناصره.
        updateHudNumbersOnly();
        // يغلق شرط اكتمال نافذة الثانية والنصف.
      }
      // يطلب من المتصفح استدعاء النبضة التالية عند الإطار القادم ويحفظ معرّفها.
      state.fpsRafId = requestAnimationFrame(tick);
      // يغلق دالة النبضة tick.
    }
    // يطلق النبضة الأولى لبدء القياس السلس للإطارات.
    state.fpsRafId = requestAnimationFrame(tick);
    // يغلق دالة مشغّل قياس الإطارات startFpsSampler.
  }

  // يعرّف دالة التحديث السريع للأرقام النصية فقط داخل المؤشر الحي لتفادي إعادة رسم HTML بالكامل.
  function updateHudNumbersOnly() {
    // يتوقف إذا لم يكن عنصر المؤشر موجوداً أو كان مخفياً حالياً.
    if (!state.hudEl || state.hudEl.style.display === "none") return;
    // يجدد قراءة الذاكرة وعقد DOM عبر دالة measureMetrics.
    measureMetrics();
    // يلتقط خانة عرض زمن المعالجة داخل المؤشر.
    const applySpan = state.hudEl.querySelector('[data-mq="apply"]');
    // يلتقط خانة عرض استهلاك الذاكرة بالكيلوبايت داخل المؤشر.
    const memSpan = state.hudEl.querySelector('[data-mq="mem"]');
    // يلتقط خانة عرض معدل الإطارات داخل المؤشر.
    const fpsSpan = state.hudEl.querySelector('[data-mq="fps"]');
    // يحدّث نص زمن المعالجة بالمللي ثانية إن وُجدت الخانة.
    if (applySpan) applySpan.textContent = `${state.lastApplyMs.toFixed(2)}ms`;
    // يحدّث نص استهلاك الذاكرة بالكيلوبايت إن وُجدت الخانة.
    if (memSpan) memSpan.textContent = `${state.heapDeltaKB}KB`;
    // يحدّث رقم معدل الإطارات إن وُجدت الخانة.
    if (fpsSpan) fpsSpan.textContent = `${state.fps}`;
    // يغلق دالة التحديث الرقمي السريع updateHudNumbersOnly.
  }

  // يعرّف دالة بناء وتحديث واجهة مؤشر الاستهلاك الحي (HUD) داخل الصفحة وربط أزرار التصغير والإخفاء.
  function updateHudDisplay(cfg, isPdf) {
    // يأخذ مرجع عنصر المؤشر المحفوظ من Shadow DOM.
    const hud = state.hudEl;
    // يخرج إن لم يكن العنصر متاحاً بعد.
    if (!hud) return;

    // يخفي المؤشر تماماً إذا ألغى المستخدم خيار "إظهار استهلاك الأداة داخل الصفحة".
    if (!cfg.showInPageHud) {
      // يضبط خاصية العرض على none لإخفائه وإيقاف أي أثر بصري له.
      hud.style.display = "none";
      // ينهي الدالة فوراً.
      return;
      // يغلق شرط إخفاء المؤشر.
    }

    // يحدث قياسات الموارد الحالية قبل عرضها في الشريط.
    measureMetrics();
    // يطبق إحداثيات الزاوية المختارة (أسفل يسار/يمين أو أعلى يسار/يمين) مع تفعيل العرض المرن flex.
    hud.style.cssText = `${getHudPositionCss(cfg.hudPosition)} display: flex;`;
    // يطبق الصنف "minimized" إذا كان المؤشر في وضع الكبسولة المصغرة.
    hud.className = cfg.hudMinimized ? "minimized" : "";

    // يقرأ حالة التفعيل الفعلية لتلوين النقطة الضوئية (أخضر للعمل أو رمادي للتوقف).
    const active = cfg.effectiveEnabled;
    // يحدد التسمية المختصرة للوضع الحالي ("PDF" للمستندات، أو "داكن"، أو نسبة السطوع المئوية).
    const modeLabel = isPdf ? "PDF" : cfg.darkMode !== "off" ? "داكن" : `${cfg.brightness}%`;

    // يفحص ما إذا كان المؤشر في الحالة المصغرة لعرض الكبسولة المدمجة الخفيفة.
    if (cfg.hudMinimized) {
      // يبني واجهة الكبسولة المصغرة متضمنة الحالة واستهلاك الذاكرة وزر التوسيع فقط.
      hud.innerHTML = `
        <!-- النقطة الدالة على حالة التشغيل -->
        <span class="mq-dot ${active ? "" : "off"}"></span>
        <!-- ملخص الوضع الحالي -->
        <span style="font-weight:600;">مستقبلات: ${modeLabel}</span>
        <!-- شريحة استهلاك الذاكرة بالكيلوبايت -->
        <span class="mq-chip"><b data-mq="mem">${state.heapDeltaKB}KB</b></span>
        <!-- زر إعادة توسيع المؤشر لعرض كافة التفاصيل -->
        <button class="mq-btn-icon" id="mq-hud-expand" title="توسيع مؤشر الاستهلاك">▴</button>
      `;
      // وفي الحالة الموسعة الكاملة، يعرض جميع المقاييس الأربعة (الوضع، المعالجة ms، الذاكرة KB، الإطارات FPS).
    } else {
      // يبني الواجهة التفصيلية الكاملة للمؤشر الحي داخل الصفحة.
      hud.innerHTML = `
        <!-- النقطة المضيئة الدالة على فعالية التعتيم -->
        <span class="mq-dot ${active ? "" : "off"}"></span>
        <!-- اسم الأداة باللون العنبري المميز -->
        <strong style="color:#F59E0B; white-space:nowrap;">مستقبلات</strong>
        <!-- حاوية الشرائح القياسية الأربع -->
        <div class="mq-metrics">
          <!-- شريحة الوضع النشط أو نسبة السطوع -->
          <span class="mq-chip" title="الحالة والسطوع الحالي">الوضع: <b>${active ? modeLabel : "متوقف"}</b></span>
          <!-- شريحة زمن المعالجة الفعلي بالمللي ثانية -->
          <span class="mq-chip" title="زمن المعالجة في المتصفح">المعالجة: <b data-mq="apply">${state.lastApplyMs.toFixed(2)}ms</b></span>
          <!-- شريحة استهلاك الذاكرة الفعلي بالكيلوبايت -->
          <span class="mq-chip" title="استهلاك الأداة من الذاكرة داخل هذه الصفحة">الذاكرة: <b data-mq="mem">${state.heapDeltaKB}KB</b></span>
          <!-- شريحة معدل سلاسة الإطارات بالثانية -->
          <span class="mq-chip" title="سلاسة الإطارات">FPS: <b data-mq="fps">${state.fps}</b></span>
        </div>
        <!-- زر تصغير المؤشر إلى كبسولة جانبية هادئة -->
        <button class="mq-btn-icon" id="mq-hud-min" title="تصغير المؤشر">▾</button>
        <!-- زر إخفاء المؤشر من الصفحة مع إمكانية استعادته من نافذة الإضافة -->
        <button class="mq-btn-icon" id="mq-hud-hide" title="إخفاء المؤشر من الصفحة">✕</button>
      `;
      // يطلق حساس قياس الإطارات طالما أن المؤشر مفصل ومرئي.
      startFpsSampler();
      // يغلق فرع العرض التفصيلي للمؤشر.
    }

    // يبحث عن زر التوسيع في الحالة المصغرة لربط حدث النقر عليه.
    const expandBtn = hud.querySelector("#mq-hud-expand");
    // إذا وُجد زر التوسيع، يربطه بحفظ إلغاء التصغير وإعادة الرسم فوراً.
    if (expandBtn) {
      // يحفظ hudMinimized: false ويعيد تطبيق الواجهة.
      expandBtn.onclick = () => saveSettings({ hudMinimized: false }).then(() => applyAll());
      // يغلق شرط زر التوسيع.
    }
    // يبحث عن زر التصغير في الحالة الموسعة.
    const minBtn = hud.querySelector("#mq-hud-min");
    // إذا وُجد زر التصغير، يربطه بحفظ وضع الكبسولة المصغرة وإعادة الرسم.
    if (minBtn) {
      // يحفظ hudMinimized: true ويعيد تطبيق الواجهة.
      minBtn.onclick = () => saveSettings({ hudMinimized: true }).then(() => applyAll());
      // يغلق شرط زر التصغير.
    }
    // يبحث عن زر الإخفاء الكلي للمؤشر من الصفحة.
    const hideBtn = hud.querySelector("#mq-hud-hide");
    // إذا وُجد زر الإخفاء، يربطه بتعطيل showInPageHud وحفظ التفضيل عبر كل الصفحات.
    if (hideBtn) {
      // يحفظ showInPageHud: false ويخفي المؤشر فوراً.
      hideBtn.onclick = () => saveSettings({ showInPageHud: false }).then(() => applyAll());
      // يغلق شرط زر الإخفاء.
    }
    // يغلق دالة تحديث مؤشر الاستهلاك الحي updateHudDisplay.
  }

  // يعرّف الدالة التنفيذية المركزية التي تنسق فحص PDF، وتوليد فلاتر CSS، ورسم طبقات Shadow DOM، وحساب زمن المعالجة الدقيق.
  function applyAll() {
    // يسجل طابع البداية الزمني عالي الدقة لقياس زمن التنفيذ الفعلي لهذا التحديث.
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    // يحدث حالة اكتشاف الـ PDF للصفحة الحالية عبر دالة detectPdfPage.
    state.isPdf = detectPdfPage();
    // يستخرج الإعدادات النافذة على هذا الموقع بعد دمج الاستثناءات والتخصيصات عبر getEffectiveConfig.
    const cfg = getEffectiveConfig();

    // يضمن جاهزية وسم أنماط الوثيقة في رأس الصفحة عبر دالة ensureDocumentStyle.
    const styleEl = ensureDocumentStyle();
    // إذا توفر وسم الأنماط، يكتب بداخله قواعد الفلتر والوضع الداكن المتولدة من buildFilterCss.
    if (styleEl) {
      // يسند نص قواعد CSS المولدة إلى الوسم ليطبقها المتصفح فوراً.
      styleEl.textContent = buildFilterCss(cfg, state.isPdf);
      // يغلق شرط تحديث وسم الأنماط.
    }
    // يستدعي دالة رسم وتحديث الطبقات الفوقية ومؤشر الاستهلاك داخل Shadow DOM.
    renderShadowOverlay(cfg, state.isPdf);

    // يسجل طابع النهاية الزمني فور اكتمال حقن الأنماط وتحديث الطبقات.
    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    // يحسب الفرق الزمني الصافي بالمللي ثانية (مع حد أدنى 0.05ms لدقة العرض).
    state.lastApplyMs = Math.max(0.05, t1 - t0);
    // يضيف زمن هذا التحديث إلى المجموع التراكمي للجلسة.
    state.totalApplyMsSession += state.lastApplyMs;
    // يزيد عداد مرات التطبيق بمقدار واحد.
    state.applyCount += 1;
    // يجدد قياسات حجم الذاكرة وعقد DOM.
    measureMetrics();
    // يحدث الأرقام المعروضة في مؤشر الاستهلاك الحي بالزمن الحقيقي المقاس للتو.
    updateHudNumbersOnly();
    // يعيد كائن القياسات الحية الكامل لمن استدعى الدالة (مثل رسائل نافذة الإضافة popup.js).
    return getLiveTelemetry();
    // يغلق الدالة المركزية applyAll.
  }

  // يعرّف دالة استخراج مفتاح التاريخ المحلي بصيغة YYYY-MM-DD لتخزين إحصائيات الاستهلاك اليومية بدقة.
  function getTodayKey(dateObj) {
    // يستخدم التاريخ الممرر أو ينشئ كائن تاريخ اللحظة الحالية.
    const d = dateObj || new Date();
    // يستخرج السنة من أربع خانات.
    const yyyy = d.getFullYear();
    // يستخرج رقم الشهر (1–12) مسبوقاً بصفر عند الحاجة ليكون من خانتين دائماً.
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    // يستخرج رقم اليوم في الشهر مسبوقاً بصفر ليكون من خانتين.
    const dd = String(d.getDate()).padStart(2, "0");
    // يركب مفتاح التاريخ القياسي المرتب زمنياً (مثل "2026-10-30").
    return `${yyyy}-${mm}-${dd}`;
    // يغلق دالة مفتاح التاريخ getTodayKey.
  }

  // يعرّف دالة تسجيل نبضات الاستهلاك الزمني واستهلاك النظام في السجل التاريخي الذي تعرضه لوحة الأيام والأسابيع.
  async function recordUsageTick(minutesDelta, isPageInit) {
    // يفحص الإعدادات الفعلية للصفحة الحالية أولاً.
    const cfg = getEffectiveConfig();
    // لا يسجل استهلاكاً إذا كانت الأداة موقفة أو كان الموقع مستثنى، لضمان أمانة الإحصائيات.
    if (!cfg.effectiveEnabled) return;

    // يحصل على مفتاح تاريخ اليوم الحالي عبر دالة getTodayKey.
    const today = getTodayKey();
    // يحدث قياسات الذاكرة وزمن المعالجة قبل تدوين العينة في السجل.
    measureMetrics();

    // يعرّف دالة التحديث الصافية التي تستقبل خريطة السجل التاريخي وتحدث خانة اليوم الحالي بداخلها.
    const updateBucket = (history) => {
      // يضمن وجود كائن سجل صالح أو ينشئ كائناً جديداً.
      const store = history && typeof history === "object" ? history : {};
      // يسترجع سجل اليوم الحالي إن وُجد أو يؤسس سجلاً ابتدائياً نظيفاً لهذا التاريخ.
      const day = store[today] || {
        // تاريخ اليوم بصيغة YYYY-MM-DD.
        date: today,
        // إجمالي دقائق التفعيل النشط خلال اليوم.
        activeMinutes: 0,
        // إجمالي عدد الصفحات التي حمتها الأداة خلال اليوم.
        pagesCount: 0,
        // إجمالي عدد ملفات الـ PDF التي جرى تعتيمها خلال اليوم.
        pdfsCount: 0,
        // دقائق عمل الوضع الداكن خلال اليوم.
        darkModeMinutes: 0,
        // دقائق عمل تلوين الشاشة السداسي HEX خلال اليوم.
        tintMinutes: 0,
        // مجموع زمن معالجة المعالج بالمللي ثانية خلال اليوم.
        totalApplyMs: 0,
        // متوسط استهلاك الذاكرة بالكيلوبايت خلال اليوم.
        avgFootprintKB: state.heapDeltaKB || 18,
        // أقصى ذروة استهلاك ذاكرة سُجلت خلال اليوم بالكيلوبايت.
        peakFootprintKB: state.heapDeltaKB || 18,
        // مجموع نسب السطوع لحساب متوسط التعتيم عند الحاجة.
        brightnessSum: 0,
        // عدد العينات المسجلة لحساب المتوسط المتحرك الدقيق للذاكرة.
        samples: 0
        // يغلق كائن تأسيس اليوم الجديد.
      };

      // يضيف الدقائق المنقضية (minutesDelta) إلى رصيد التفعيل اليومي مقرباً لخانتين عشريتين.
      day.activeMinutes = Number((day.activeMinutes + minutesDelta).toFixed(2));
      // إذا كانت هذه النبضة هي نبضة فتح الصفحة الأولى (isPageInit)، يزيد عداد الصفحات والـ PDF.
      if (isPageInit) {
        // يزيد عداد الصفحات المحمية بمقدار صفحة واحدة.
        day.pagesCount += 1;
        // وإذا كانت الصفحة مستند PDF، يزيد عداد ملفات الـ PDF بمقدار واحد أيضاً.
        if (state.isPdf) day.pdfsCount += 1;
        // يغلق شرط نبضة التأسيس الأولى للصفحة.
      }
      // يضيف الدقائق المنقضية إلى رصيد الوضع الداكن إذا كان أي نمط داكن نشطاً حالياً.
      if (cfg.darkMode !== "off") {
        // يراكم دقائق الوضع الداكن لليوم الحالي.
        day.darkModeMinutes = Number((day.darkModeMinutes + minutesDelta).toFixed(2));
        // يغلق شرط الوضع الداكن.
      }
      // يضيف الدقائق المنقضية إلى رصيد تلوين الشاشة إذا كانت طبقة لون HEX مفعّلة.
      if (cfg.tintEnabled) {
        // يراكم دقائق تلوين الشاشة لليوم الحالي.
        day.tintMinutes = Number((day.tintMinutes + minutesDelta).toFixed(2));
        // يغلق شرط تلوين الشاشة.
      }
      // يضيف زمن المعالجة الأخير إلى إجمالي زمن المعالج اليومي.
      day.totalApplyMs = Number((day.totalApplyMs + state.lastApplyMs).toFixed(2));
      // يزيد عدد العينات المأخوذة في اليوم بمقدار واحد.
      day.samples += 1;
      // يراكم نسبة السطوع الحالية في المجموع اليومي.
      day.brightnessSum += clamp(cfg.brightness, 20, 150, 88);
      // يحسب المتوسط التراكمي الدقيق لاستهلاك الذاكرة بالكيلوبايت مع دخول القراءة الجديدة.
      day.avgFootprintKB = Math.round(
        // معادلة المتوسط المتحرك الموزون بعدد العينات.
        (day.avgFootprintKB * (day.samples - 1) + state.heapDeltaKB) / day.samples
        // يغلق تقريب المتوسط.
      );
      // يحدث ذروة استهلاك الذاكرة اليومية إذا تجاوزت القراءة الحالية الرقم القياسي السابق.
      day.peakFootprintKB = Math.max(day.peakFootprintKB || 0, state.heapDeltaKB);

      // يحفظ سجل اليوم المحدث داخل خريطة التواريخ العامة.
      store[today] = day;

      // Keep last 90 days max so storage footprint stays tiny (< 8 KB)
      // يرتب مفاتيح التواريخ تصاعدياً لتقليم السجلات الأقدم من 90 يوماً ومنع تضخم مساحة التخزين أبداً.
      const keys = Object.keys(store).sort();
      // طالما زاد عدد الأيام المسجلة عن 90 يوماً (قرابة 13 أسبوعاً)، يحذف اليوم الأقدم تلقائياً.
      while (keys.length > 90) {
        // يزيل أقدم مفتاح تاريخ من الكائن للحفاظ على حجم تخزين أقل من 8 كيلوبايت دائماً.
        delete store[keys.shift()];
        // يغلق حلقة التقليم التلقائي للسجل.
      }
      // يعيد السجل المحدث والمنظف للحفظ.
      return store;
      // يغلق دالة تحديث السجل updateBucket.
    };

    // يحفظ السجل المحدث في تخزين الإضافة المحلي إذا كنا في بيئة إضافة المتصفح.
    if (hasChromeStorage()) {
      // يقرأ السجل الحالي أولاً من chrome.storage.local.
      chrome.storage.local.get([STORAGE_KEY_USAGE], (res) => {
        // يمرر السجل الحالي لدالة updateBucket لإضافة نبضة اليوم.
        const updated = updateBucket(res && res[STORAGE_KEY_USAGE]);
        // يكتب السجل المحدث مجدداً في تخزين الإضافة لتقرأه لوحة الإحصائيات والنافذة المنبثقة.
        chrome.storage.local.set({ [STORAGE_KEY_USAGE]: updated });
        // يغلق استدعاء القراءة والكتابة في تخزين الإضافة.
      });
      // وإلا يحفظ السجل في localStorage القياسي عند العمل عبر الويب أو الـ Bookmarklet.
    } else {
      // يفتح كتلة حماية للتخزين المحلي في المتصفح.
      try {
        // يقرأ السجل النصي الحالي من localStorage.
        const raw = localStorage.getItem(STORAGE_KEY_USAGE);
        // يحدث السجل عبر دالة updateBucket.
        const updated = updateBucket(raw ? JSON.parse(raw) : {});
        // يعيد كتابة السجل بصيغة JSON في localStorage.
        localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(updated));
        // يتجاهل أخطاء امتلاء أو تقييد التخزين في وضع التصفح الخفي.
      } catch (_) {}
      // يغلق فرع الحفظ المحلي.
    }
    // يغلق دالة تسجيل نبضات الاستهلاك recordUsageTick.
  }

  // يعرّف دالة تجميع وتصدير لقطة القياسات الحية الكاملة للصفحة الحالية لإرسالها إلى نافذة الإضافة أو تقارير GitHub.
  function getLiveTelemetry() {
    // يستخرج الإعدادات النافذة حالياً على الموقع.
    const cfg = getEffectiveConfig();
    // يجدد أرقام الذاكرة وعقد DOM قبل تكوين اللقطة.
    measureMetrics();
    // يعيد كائناً شاملاً يوثق حالة الموقع والسطوع والطبقات واستهلاك الموارد اللحظي.
    return {
      // اسم نطاق الموقع الحالي.
      hostname: state.hostname,
      // الرابط الكامل للصفحة أو ملف الـ PDF.
      url: location.href,
      // هل المستند المفتوح ملف PDF.
      isPdf: state.isPdf,
      // هل الحماية البصرية نشطة فعلياً الآن على هذه الصفحة.
      effectiveEnabled: cfg.effectiveEnabled,
      // هل هذا الموقع مدرج ضمن قائمة الاستثناءات.
      isExcluded: cfg.isExcluded,
      // نسبة السطوع المطبقة حالياً.
      brightness: cfg.brightness,
      // كثافة طبقة التعتيم الفوقية الحالية.
      overlayOpacity: cfg.overlayOpacity,
      // نمط الوضع الداكن النشط حالياً.
      darkMode: cfg.darkMode,
      // حالة تفعيل طبقة لون HEX.
      tintEnabled: cfg.tintEnabled,
      // كود اللون السداسي المختار.
      tintColor: cfg.tintColor,
      // آلية التعتيم المتبعة (hybrid / overlay / filter).
      method: cfg.method,
      // زمن آخر معالجة بالمللي ثانية.
      lastApplyMs: Number(state.lastApplyMs.toFixed(2)),
      // إجمالي زمن المعالجة منذ فتح الصفحة بالمللي ثانية.
      totalApplyMsSession: Number(state.totalApplyMsSession.toFixed(2)),
      // عدد مرات التحديث المنفذة في الجلسة.
      applyCount: state.applyCount,
      // البصمة الذاكرية الصافية للأداة بالكيلوبايت داخل الصفحة.
      extensionFootprintKB: state.heapDeltaKB,
      // حجم النصوص والأنماط المحقونة بالبايت.
      domBytes: state.domBytes,
      // عدد عناصر DOM التي أضافتها الأداة.
      domNodes: state.domNodes,
      // إجمالي ذاكرة التبويب بالميجابايت (إن توفرت).
      tabHeapMB: state.tabHeapMB,
      // معدل سلاسة الإطارات المقاس بالثانية.
      fps: state.fps
      // يغلق كائن القياسات الحية المُرجع.
    };
    // يغلق دالة getLiveTelemetry.
  }

  // يعرّف دالة بناء رابط بلاغ GitHub Issues المعبأ تلقائياً بالبيانات التشخيصية للمشكلة أو للموقع غير المتوافق.
  function buildGitHubIssueUrl(payload) {
    // يحدد مستودع GitHub المستهدف من الحمولة الممررة أو من الإعدادات أو يعود للمستودع الرسمي للمشروع.
    const repo =
      // المستودع الممرر صراحة في الاستدعاء.
      (payload && payload.repo) ||
      // أو المستودع المحفوظ في إعدادات المستخدم.
      state.settings.githubRepo ||
      // أو المستودع الأساسي الافتراضي للمشروع.
      "Mohamed7AbdELhalim/Mustaqbalat";
    // يحدد تصنيف البلاغ (موقع لم تعمل معه الإضافة أم مشكلة عامة).
    const type = (payload && payload.type) || "site-incompatible";
    // يحدد رابط الموقع موضوع البلاغ أو يستخدم رابط الصفحة المفتوحة حالياً.
    const siteUrl = (payload && payload.siteUrl) || location.href;
    // يختار البادئة العربية الواضحة لعنوان التذكرة في GitHub حسب نوع البلاغ.
    const titlePrefix =
      // يفحص ما إذا كان البلاغ يخص موقعاً رفض الاستجابة للإضافة.
      type === "site-incompatible"
        // بادئة بلاغات المواقع غير المتوافقة.
        ? "[موقع غير متوافق / لم تعمل الإضافة]"
        // بادئة البلاغات التقنية العامة والاقتراحات.
        : "[بلاغ مشكلة / اقتراح]";
    // يركب العنوان الكامل للتذكرة جامعاً البادئة مع عنوان المستخدم أو اسم النطاق.
    const title = `${titlePrefix} ${payload && payload.title ? payload.title : state.hostname}`;
    // يحدد وسوم التصنيف (Labels) المناسبة في GitHub لفرز البلاغات تلقائياً.
    const labels =
      // وسوم خاصة بالمواقع غير المتوافقة أو وسوم تقارير المستخدمين العامة.
      type === "site-incompatible" ? "incompatible-site,bug" : "bug,user-report";

    // يلتقط القياسات الحية اللحظية عبر دالة getLiveTelemetry لإرفاقها في متن التذكرة التشخيصي.
    const telemetry = getLiveTelemetry();
    // يبني أسطر متن التذكرة بنسق Markdown منظم باللغة العربية يسهل قراءته ومراجعته في GitHub.
    const bodyLines = [
      // ترويسة القسم الأول لبيان نوع البلاغ.
      "### نوع البلاغ",
      // يوضح نصياً طبيعة البلاغ المرسل.
      type === "site-incompatible"
        // وصف حالة عدم توافق الموقع.
        ? "- موقع إلكتروني / ملف لم تعمل معه الإضافة أو رفض الاستجابة"
        // وصف حالة المشكلة العامة.
        : "- مشكلة عامة أو ملاحظة من المستخدم",
      // سطر فاصل لتنسيق Markdown.
      "",
      // ترويسة القسم الثاني لبيانات الرابط والنطاق.
      "### رابط الموقع أو الصفحة",
      // يدرج الرابط الكامل للصفحة داخل تنسيق الكود.
      `- الرابط: \`${siteUrl}\``,
      // يدرج اسم النطاق المستخرج.
      `- النطاق: \`${telemetry.hostname}\``,
      // يوضح ما إذا كانت الصفحة مستند PDF أم صفحة ويب.
      `- نوع المستند: \`${telemetry.isPdf ? "ملف PDF" : "صفحة ويب"}\``,
      // سطر فاصل.
      "",
      // ترويسة القسم الثالث لوصف المشكلة كما كتبها المستخدم.
      "### وصف المشكلة التي واجهت المستخدم",
      // يدرج شرح المستخدم أو نصاً افتراضياً واضحاً إن ترك الحقل فارغاً.
      payload && payload.description
        // النص المكتوب من قبل المستخدم.
        ? payload.description
        // النص الاحتياطي التلقائي.
        : "لم يتم تطبيق التعتيم أو الوضع الداكن بالشكل المتوقع على هذا الموقع.",
      // سطر فاصل.
      "",
      // ترويسة القسم الرابع للبيانات التقنية واستهلاك النظام لحظة البلاغ.
      "### الإعدادات واستهلاك النظام وقت البلاغ",
      // يوثق نسب السطوع وطبقة التعتيم.
      `- السطوع: \`${telemetry.brightness}%\` | طبقة التعتيم: \`${telemetry.overlayOpacity}%\``,
      // يوثق نمط الوضع الداكن وآلية التطبيق.
      `- الوضع الداكن: \`${telemetry.darkMode}\` | الطريقة: \`${telemetry.method}\``,
      // يوثق حالة وكود لون الشاشة HEX.
      `- لون الشاشة المخصص: \`${telemetry.tintEnabled ? telemetry.tintColor : "غير مفعل"}\``,
      // يوثق استهلاك الأداة بالكيلوبايت وزمن المعالجة بالمللي ثانية لإثبات عدم إبطاء النظام.
      `- استهلاك الأداة داخل الصفحة: \`${telemetry.extensionFootprintKB} KB\` | زمن المعالجة: \`${telemetry.lastApplyMs} ms\``,
      // يوثق معلومات المتصفح ونظام التشغيل لمساعدة المطور على إعادة تمثيل المشكلة وحلها.
      `- المتصفح: \`${navigator.userAgent}\``
      // يغلق مصفوفة أسطر متن البلاغ.
    ];

    // يرمّز العنوان والوسوم والمتن بأمان عبر URLSearchParams لبناء رابط GitHub سليم مهما احتوى من رموز عربية أو خاصة.
    const params = new URLSearchParams({
      // يمرر عنوان التذكرة.
      title,
      // يمرر الوسوم التصنيفية.
      labels,
      // يدمج أسطر المتن بفاصل السطر الجديد.
      body: bodyLines.join("\n")
      // يغلق كائن المعاملات.
    });
    // يعيد الرابط النهائي المباشر لفتح تذكرة جديدة جاهزة للإرسال على مستودع GitHub.
    return `https://github.com/${repo}/issues/new?${params.toString()}`;
    // يغلق دالة بناء رابط بلاغ GitHub.
  }

  // يعرّف دالة الإقلاع الرئيسية للمحرك التي تحمل الإعدادات، وتطبق الحماية فوراً، وتربط مستمعات التزامن والقياس الدوري.
  async function init() {
    // يحمّل إعدادات المستخدم المحفوظة (أو الافتراضية المفعّلة تلقائياً) عبر دالة loadSettings.
    state.settings = await loadSettings();
    // يطبق الفلاتر والطبقات فوراً حتى قبل اكتمال بقية موارد الصفحة لمنع الوميض الأبيض الساطع.
    applyAll();

    // Re-apply once DOM finishes loading (catches late <embed type="application/pdf"> elements)
    // يفحص ما إذا كانت الوثيقة لا تزال في طور البناء الأولي لإعادة التأكيد عند اكتمال شجرة العناصر.
    if (document.readyState === "loading") {
      // يسجل مستمعاً يعمل لمرة واحدة فقط فور جهوزية DOMContentLoaded لالتقاط عناصر عارض PDF المتأخرة.
      document.addEventListener(
        // اسم الحدث القياسي لاكتمال بناء شجرة الوثيقة.
        "DOMContentLoaded",
        // الدالة المنفذة عند اكتمال البناء.
        () => {
          // يعيد تطبيق الفلاتر والطبقات لضمان تغطية أي عنصر <embed> أُدرج أثناء التحميل.
          applyAll();
          // يسجل نبضة فتح الصفحة الابتدائية (0.15 دقيقة + احتساب الصفحة في عداد اليوم).
          recordUsageTick(0.15, true);
          // يغلق دالة حدث اكتمال التحميل.
        },
        // يضمن إزالة المستمع تلقائياً بعد تنفيذه لمرة واحدة توفيراً للذاكرة.
        { once: true }
        // يغلق تسجيل مستمع DOMContentLoaded.
      );
      // وإذا كانت الصفحة محملة مسبقاً لحظة حقن المحرك، يسجل نبضة التأسيس مباشرة.
    } else {
      // يدون فتح الصفحة في سجل الإحصائيات اليومي والأسبوعي.
      recordUsageTick(0.15, true);
      // يغلق فرع الصفحة المكتملة مسبقاً.
    }

    // Track active usage every 60 seconds while page is visible (0% CPU when idle/hidden)
    // ينشئ المؤقت الدقيق لتسجيل دقائق التفعيل الفعلي كل 60 ثانية طالما التبويب مرئياً أمام المستخدم.
    if (!state.usageTimer) {
      // يضبط فاصل الستين ثانية (60000 مللي ثانية) حتى لا يمثل أي عبء على المعالج مطلقاً.
      state.usageTimer = setInterval(() => {
        // يتحقق من أن الصفحة مرئية حالياً وليست في الخلفية لاحتساب زمن القراءة الحقيقي فقط.
        if (!document.hidden) {
          // يضيف دقيقة واحدة نشطة إلى سجل اليوم والأسبوع عبر دالة recordUsageTick.
          recordUsageTick(1, false);
          // يغلق شرط الرؤية الفعلية للصفحة.
        }
        // يغلق دالة المؤقت الدوري.
      }, 60000);
      // يغلق شرط إنشاء مؤقت تتبع الاستهلاك.
    }

    // Listen for extension storage changes across all open tabs immediately
    // يربط مستمع تغييرات تخزين الإضافة لتتحدث جميع التبويبات المفتوحة في نفس اللحظة عندما يحرك المستخدم أي شريط في النافذة المنبثقة!
    if (hasChromeStorage() && chrome.storage.onChanged) {
      // يسجل دالة الاستماع للتعديلات الطارئة على مساحة التخزين.
      chrome.storage.onChanged.addListener((changes, area) => {
        // يتحقق من أن التعديل تم في المخزن المحلي وشمل مفتاح إعدادات مستقبلات.
        if (area === "local" && changes[STORAGE_KEY_SETTINGS]) {
          // يحدث نسخة الإعدادات المحلية في هذا التبويب بالقيم الجديدة الواردة فوراً.
          state.settings = Object.assign(
            // يبدأ بكائن جديد نظيف.
            {},
            // يضع القيم الافتراضية كقاعدة أمان.
            DEFAULT_SETTINGS,
            // يدمج القيم المحدثة القادمة من النافذة المنبثقة أو لوحة التحكم.
            changes[STORAGE_KEY_SETTINGS].newValue || {}
            // يغلق دمج الإعدادات المحدثة.
          );
          // يطبق التغييرات البصرية لحظياً على الصفحة دون الحاجة لإعادة تحميلها.
          applyAll();
          // يغلق شرط تغير مفتاح الإعدادات.
        }
        // يغلق مستمع تغييرات التخزين.
      });
      // يغلق شرط توفر حدث التزامن في الإضافة.
    }

    // Listen for popup / background direct messages
    // يسجل مستمع الرسائل المباشرة القادمة من نافذة popup.js لقراءة القياسات الحية أو التحديث الفوري السريع.
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      // يضيف معالج الرسائل إلى قناة اتصال الإضافة.
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        // يتحقق من سلامة بنية الرسالة الواردة.
        if (!msg || typeof msg !== "object") return false;
        // يعالج طلب نافذة الإضافة الحصول على قراءة فورية لاستهلاك الذاكرة والمعالج والـ FPS في هذه الصفحة.
        if (msg.type === "MUSTAQBALAT_GET_TELEMETRY") {
          // يرسل لقطة القياسات الحية والإعدادات الحالية فوراً إلى نافذة الإضافة لعرضها في تبويب "الاستهلاك".
          sendResponse({ ok: true, telemetry: getLiveTelemetry(), settings: state.settings });
          // يعيد true لتأكيد إتمام الاستجابة عبر القناة.
          return true;
          // يغلق معالجة طلب القياسات الحية.
        }
        // يعالج أمر التحديث المباشر للإعدادات المرسل من أشرطة التحكم في النافذة المنبثقة.
        if (msg.type === "MUSTAQBALAT_UPDATE_SETTINGS") {
          // يحفظ التعديلات الجزئية ثم يعيد تطبيق الفلاتر والطبقات ويرد بالقياسات الجديدة في خطوة متكاملة.
          saveSettings(msg.payload || {}).then(() => {
            // يطبق التعديلات ويقيس زمن المعالجة الناتج.
            const telemetry = applyAll();
            // يرد على النافذة المنبثقة بالقياسات المحدثة لتنعكس أمام المستخدم في نفس اللحظة.
            sendResponse({ ok: true, telemetry, settings: state.settings });
            // يغلق وعد ما بعد الحفظ.
          });
          // يعيد true لإبقاء قناة الرد غير المتزامن مفتوحة حتى يكتمل الحفظ والتطبيق.
          return true;
          // يغلق معالجة تحديث الإعدادات.
        }
        // يعيد false لأي رسائل أخرى لا تخص المحرك.
        return false;
        // يغلق معالج الرسائل المباشرة.
      });
      // يغلق شرط توفر واجهة رسائل الإضافة.
    }
    // يغلق دالة الإقلاع الرئيسية init.
  }

  // يجمّع الواجهة البرمجية العامة للمحرك (Public API) لإتاحتها لمنصة الويب الحية (studio.js) ولوحة الإحصائيات والاختبارات.
  const api = {
    // يصدر ثابت مفتاح الإعدادات الموحد.
    STORAGE_KEY_SETTINGS,
    // يصدر ثابت مفتاح سجل الاستهلاك اليومي والأسبوعي.
    STORAGE_KEY_USAGE,
    // يصدر ثابت مفتاح قائمة المواقع غير المتوافقة.
    STORAGE_KEY_BROKEN_SITES,
    // يصدر كائن الإعدادات الافتراضية المرجعي.
    DEFAULT_SETTINGS,
    // يصدر مصفوفة لوحات الألوان الطبية الثمان الجاهزة.
    PRESET_PALETTES,
    // يصدر دالة التهيئة والإقلاع.
    init,
    // يصدر دالة إعادة التطبيق السريع تحت الاسم الواضح refresh.
    refresh: applyAll,
    // يصدر دالة قراءة نسخة آمنة من الإعدادات الحالية.
    getSettings: () => Object.assign({}, state.settings),
    // يصدر دالة تحديث الإعدادات وإعادة الرسم المباشر (المستخدمة في محاكي المنصة الحية).
    updateSettings: (partial) => saveSettings(partial).then(() => applyAll()),
    // يصدر دالة جلب قياسات استهلاك الموارد الحية.
    getLiveTelemetry,
    // يصدر دالة توليد روابط تذاكر GitHub المعبأة تلقائياً.
    buildGitHubIssueUrl,
    // يصدر دالة التحقق من صيغة ألوان HEX وتنقيتها.
    sanitizeHex,
    // يصدر دالة الوصول إلى شجرة Shadow DOM المعزولة.
    getShadowRoot: ensureOverlayHost
    // يغلق كائن الواجهة البرمجية للمحرك api.
  };

  // يسجل الواجهة البرمجية للمحرك على النطاق العام تحت اسم MustaqbalatEngine لربطها بسائر ملفات المشروع.
  globalScope.MustaqbalatEngine = api;

  // Auto-init unless explicitly suppressed by host page
  // يبدأ تشغيل المحرك تلقائياً فور تحميل الملف ما لم تطلب بيئة اختبار خارجية تأجيل التشغيل اليدوي.
  if (!globalScope.__MUSTAQBALAT_MANUAL_INIT__) {
    // يستدعي دالة الإقلاع التلقائي لتفعيل التعتيم والحماية البصرية مباشرة.
    init();
    // يغلق شرط الإقلاع التلقائي.
  }
  // يغلق الدالة الفورية المعزولة ويمرر لها النطاق العام المناسب للبيئة.
})(typeof window !== "undefined" ? window : globalThis);
