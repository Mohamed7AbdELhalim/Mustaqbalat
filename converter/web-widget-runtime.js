/**
 * Mustaqbalat — Self-Contained Floating Web Add-on Widget (0-Disk Bookmarklet & Userscript Runtime)
 * Runs on ANY webpage inside an isolated Shadow DOM with Brightness, Overlay Layers,
 * Smart Dark Mode, HEX Color Picker, Live System Resource Monitor, and GitHub Issue Reporter.
 */
// يفتح دالة فورية التنفيذ لعزل مشغّل إضافة الويب الفورية (Bookmarklet / Userscript) عن متغيرات أي موقع يُحقن بداخله.
(function () {
  // يفعّل الوضع الصارم لضمان عدم تلويث النطاق العام للموقع المضيف.
  "use strict";

  // يعرّف المعرّف الفريد لعنصر الاستضافة المعزول الذي تزرعه الأداة في الصفحة.
  const HOST_ID = "mustaqbalat-web-addon-host";
  // يبحث في الصفحة الحالية عما إذا كانت الأداة مفعّلة ومحقونة مسبقاً لتجنب تكرار الطبقات عند النقر الثاني على الـ Bookmarklet.
  const existing = document.getElementById(HOST_ID);
  // إذا وُجد العنصر مسبقاً، يكتفي بتبديل إظهار أو إخفاء اللوحة العائمة بدلاً من إعادة البناء.
  if (existing) {
    // يصل إلى عنصر اللوحة الداخلية عبر جذر الـ Shadow DOM الخاص بالعنصر الموجود.
    const panel = existing.shadowRoot && existing.shadowRoot.getElementById("mqw-panel");
    // يتحقق من العثور على اللوحة داخل Shadow DOM.
    if (panel) {
      // يبدّل حالة العرض بين الإخفاء والإظهار استجابةً لنقرة المستخدم المتكررة.
      panel.style.display = panel.style.display === "none" ? "block" : "none";
      // يغلق شرط وجود اللوحة.
    }
    // ينهي التنفيذ فوراً بعد تبديل الظهور حفاظاً على الموارد.
    return;
    // يغلق شرط التحقق من الحقن المسبق.
  }

  // يعرّف مفتاح التخزين المحلي لحفظ إعدادات المستخدم على كل نطاق موقع يزوره عبر الـ Bookmarklet أو الـ Userscript.
  const STORAGE_KEY = "mustaqbalat_web_addon_v1";
  // يبني كائن الإعدادات الابتدائية بدمج القيم القياسية مع أي إعدادات مسبقة حقنها المحوّل في window.__MUSTAQBALAT_PRESET__.
  const DEFAULTS = Object.assign(
    // يفتح كائن القيم القياسية للأداة العائمة.
    {
      // يفعّل التعتيم فور تشغيل الأداة افتراضياً.
      enabled: true,
      // يضبط السطوع المبدئي عند 86% لتقليل وهج الشاشة مباشرة.
      brightness: 86,
      // يضبط كثافة طبقة التعتيم الفوقية عند 15%.
      overlay: 15,
      // يبقي الوضع الداكن متوقفاً مبدئياً ما لم يفعّله المستخدم أو التفضيل المسبق.
      darkMode: "off",
      // يترك طبقة اللون المخصص غير مفعّلة مبدئياً.
      tintEnabled: false,
      // يحدد لون العنبر الدافئ كقيمة ابتدائية لمنتقي ألوان HEX.
      tintColor: "#F59E0B",
      // يضبط شفافية طبقة اللون عند 18%.
      tintOpacity: 18,
      // يفعّل عرض شريط قياس الاستهلاك داخل اللوحة.
      hudVisible: true,
      // يربط زر الإبلاغ عن المشكلات والمواقع بمستودع المشروع الرسمي على GitHub.
      repo: "Mohamed7AbdELhalim/Mustaqbalat"
      // يغلق كائن القيم القياسية.
    },
    // يدمج التخصيصات القادمة من أداة التحويل إن وُجدت لتعلو فوق القيم القياسية السابقة.
    window.__MUSTAQBALAT_PRESET__ || {}
    // يغلق عملية دمج الإعدادات الافتراضية.
  );

  // ينشئ نسخة العمل الحية للإعدادات انطلاقاً من كائن DEFAULTS أعلاه.
  let cfg = Object.assign({}, DEFAULTS);
  // يحاول استرجاع آخر إعدادات حفظها المستخدم على هذا الموقع من localStorage.
  try {
    // يقرأ النص المخزن تحت المفتاح STORAGE_KEY.
    const saved = localStorage.getItem(STORAGE_KEY);
    // يحلل النص المقروء ويدمجه في كائن cfg لاستعادة تفضيلات الزيارة السابقة للموقع.
    if (saved) cfg = Object.assign({}, cfg, JSON.parse(saved));
    // يتجاهل أخطاء الوصول للتخزين في وضع التصفح الخفي المقيد.
  } catch (_) {}

  // يعرّف دالة حفظ الإعدادات المحدثة في localStorage عقب كل تعديل يجريه المستخدم.
  function save() {
    // يفتح كتلة حماية للكتابة الآمنة في تخزين المتصفح.
    try {
      // يحول كائن cfg إلى نص JSON ويحفظه محلياً.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      // يتجاهل القيود الأمنية لبعض الإطارات المعزولة دون إيقاف عمل التعتيم.
    } catch (_) {}
    // يغلق دالة الحفظ save.
  }

  // ينشئ وسم style لحقن فلاتر السطوع والوضع الداكن على مستوى وثيقة الموقع المضيف.
  const styleDoc = document.createElement("style");
  // يمنح وسم الأنماط معرّفاً واضحاً لتمييزه في شجرة DOM.
  styleDoc.id = "mustaqbalat-web-doc-style";
  // يلحق وسم الأنماط برأس الصفحة أو جذرها ليبدأ مفعوله البصري فوراً.
  (document.head || document.documentElement).appendChild(styleDoc);

  // ينشئ العنصر المضيف المعزول الذي سيحمل طبقات التعتيم واللوحة العائمة بعيداً عن أنماط الموقع.
  const host = document.createElement("div");
  // يعيّن المعرّف الفريد HOST_ID للعنصر المضيف ليتعرف عليه الفحص في مطلع الملف.
  host.id = HOST_ID;
  // يصفر كافة الأنماط الموروثة ويثبت العنصر بأعلى طبقة z-index مع تمرير النقرات للموقع تحته.
  host.style.cssText =
    // سلسلة قواعد التثبيت والعزل البصري الكامل للعنصر المضيف.
    "all:initial!important;position:fixed!important;inset:0!important;width:0!important;height:0!important;z-index:2147483647!important;pointer-events:none!important;";
  // يدرج العنصر المضيف في شجرة الصفحة الرئيسية.
  (document.documentElement || document.body).appendChild(host);

  // ينشئ شجرة Shadow DOM معزولة داخل العنصر المضيف لحماية واجهة الأداة من تنسيقات الموقع الخارجي.
  const shadow = host.attachShadow({ mode: "open" });
  // يبني الهيكل الكامل للأنماط والطبقات ولوحة التحكم داخل Shadow DOM.
  shadow.innerHTML = `
    <style>
      /* يعزل جذر Shadow DOM عن أي وراثة خارجية من الموقع المضيف */
      :host { all: initial; }
      /* ينسق طبقات التعتيم والتلوين لتغطي كامل نافذة العرض دون حجب نقرات الفأرة */
      .layer {
        /* يثبت الطبقة في كافة زوايا الشاشة بعرض وارتفاع كاملين */
        position: fixed; inset: 0; width: 100vw; height: 100vh;
        /* يمنع اعتراض الفأرة ويضيف انتقالاً ناعماً عند تحريك الأشرطة */
        pointer-events: none !important; transition: background 120ms ease;
      }
      /* يضع طبقة التعتيم السوداء في المستوى الأول فوق محتوى الصفحة */
      #dim { z-index: 2147483640; }
      /* يضع طبقة تلوين HEX فوق طبقة التعتيم بنمط دمج multiply المريح للقراءة */
      #tint { z-index: 2147483641; mix-blend-mode: multiply; }
      /* ينسق الزر العائم المصغر (FAB) في أسفل يسار الشاشة لفتح وإغلاق اللوحة */
      #fab {
        /* يحدد موقع الزر العائم وترتيبه الطبقي فوق الطبقات الشفافة */
        position: fixed; bottom: 16px; left: 16px; z-index: 2147483646;
        /* يسمح بالنقر على الزر ويضبط اتجاه النص العربي من اليمين لليسار */
        pointer-events: auto; cursor: pointer; direction: rtl;
        /* يمنح الزر خلفية داكنة شبه شفافة ولون نص أبيض مريح للعين */
        background: rgba(15,23,42,0.92); color: #F8FAFC;
        /* يرسم إطاراً بلون العنبر وحواف دائرية كبسولية */
        border: 1px solid rgba(245,158,11,0.5); border-radius: 999px;
        /* يضبط الحشوة الداخلية وحجم ونوع الخط القياسي للنظام */
        padding: 6px 12px; font: 600 12px system-ui, sans-serif;
        /* يضيف ظلاً ناعماً ومحاذاة مرنة للأيقونة والنسبة المئوية */
        box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 7px;
      }
      /* ينسق الصنف الاحتياطي للوحة العائمة الرئيسية بأبعاد متوازنة */
      #panel {
        /* يثبت اللوحة فوق الزر العائم مباشرة بعرض 310 بكسل */
        position: fixed; bottom: 56px; left: 16px; width: 310px; z-index: 2147483647;
        /* يفعّل التفاعل باللمس والفأرة داخل اللوحة بالاتجاه العربي */
        pointer-events: auto; direction: rtl;
        /* يطبق الخلفية الكحلية الداكنة لمنع أي وهج ليلي عند فتح الإعدادات */
        background: #0F172A; color: #F1F5F9;
        /* يضيف إطاراً رقيقاً وزوايا مستديرة حديثة */
        border: 1px solid rgba(148,163,184,0.25); border-radius: 14px;
        /* يضبط المسافات الداخلية وحجم الخط */
        padding: 13px; font: 12px/1.45 system-ui, sans-serif;
        /* يضيف ظلاً عميقاً لفصل اللوحة بصرياً عن خلفية الموقع */
        box-shadow: 0 18px 42px rgba(0,0,0,0.55);
      }
      /* ينسق ترويسة اللوحة العائمة ومفتاح التفعيل السريع */
      .hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:7px; }
      /* يميز عنوان الأداة باللون العنبري الدافئ */
      .hd strong { color:#F59E0B; font-size:13.5px; }
      /* يفصل بين صفوف أدوات التحكم عمودياً */
      .row { margin-top:7px; }
      /* يوزع اسم الأداة وقيمتها الرقمية على طرفي السطر */
      .lbl { display:flex; justify-content:space-between; font-size:11px; color:#CBD5E1; margin-bottom:2px; }
      /* ينسق أشرطة السحب باللون العنبري الموحد */
      input[type="range"] { width:100%; accent-color:#F59E0B; cursor:pointer; }
      /* ينسق القوائم المنسدلة وحقل إدخال كود اللون السداسي HEX */
      select, input[type="text"] {
        /* خلفية داكنة متباينة مع حدود ناعمة */
        background:#1E293B; color:#FFF; border:1px solid rgba(255,255,255,0.15);
        /* حواف دائرية وعرض متكامل داخل الحاوية */
        border-radius:6px; padding:4px 6px; font-size:11.5px; width:100%; box-sizing:border-box;
      }
      /* يرتب مربعات الألوان الجاهزة أفقياً */
      .swatches { display:flex; gap:5px; margin-top:5px; }
      /* يحدد مقاس وشكل كل مربع لون جاهز */
      .sw { width:22px; height:22px; border-radius:5px; border:1.5px solid rgba(255,255,255,0.3); cursor:pointer; }
      /* ينسق الأزرار الإجرائية داخل اللوحة العائمة */
      .btn {
        /* تصميم بارز واضح وسهل النقر */
        background:#F59E0B; color:#0B1120; border:none; border-radius:7px;
        /* خط عريض وعرض كامل للزر */
        padding:6px 9px; font-weight:700; font-size:11px; cursor:pointer; width:100%; margin-top:8px;
      }
      /* يخصص تنسيقاً سماوياً هادئاً لزر الإبلاغ عبر GitHub */
      .btn-gh { background:rgba(56,189,248,0.15); color:#38BDF8; border:1px solid rgba(56,189,248,0.35); }
      /* ينسق شريط عرض استهلاك الذاكرة وزمن المعالجة الحي داخل اللوحة */
      .stat { font-size:10.5px; color:#94A3B8; margin-top:7px; display:flex; justify-content:space-between; background:#1E293B; padding:4px 8px; border-radius:6px; }
    </style>
    <!-- طبقة التعتيم السوداء الشفافة فوق الموقع -->
    <div id="dim" class="layer"></div>
    <!-- طبقة تلوين الشاشة المخصصة بكود HEX فوق الموقع -->
    <div id="tint" class="layer"></div>
    <!-- الزر العائم الدائم لتصغير أو فتح لوحة التحكم وعرض نسبة السطوع الحالية -->
    <button id="fab" title="فتح/إغلاق مستقبلات للراحة البصرية">🌙 مستقبلات <span id="fabStat">86%</span></button>
    <!-- حاوية اللوحة التفاعلية الكاملة لإضافة الويب الخفيفة -->
    <div id="mqw-panel" style="position:fixed;bottom:56px;left:16px;width:305px;z-index:2147483647;pointer-events:auto;direction:rtl;background:#0F172A;color:#F1F5F9;border:1px solid rgba(148,163,184,0.25);border-radius:14px;padding:13px;font:12px/1.45 system-ui,sans-serif;box-shadow:0 18px 42px rgba(0,0,0,0.55);">
      <!-- رأس اللوحة المحتوي على اسم الأداة ومربع التفعيل العام -->
      <div class="hd">
        <!-- عنوان يوضح أنها نسخة الويب عديمة الاستهلاك التخزيني -->
        <strong>🌙 مستقبلات (إضافة ويب 0KB)</strong>
        <!-- مفتاح تشغيل أو إيقاف التأثير فوراً على الصفحة الحالية -->
        <label style="font-size:11px;cursor:pointer;"><input type="checkbox" id="enChk" checked /> مفعّل</label>
      </div>
      <!-- صف التحكم بتقليل أو زيادة سطوع الشاشة -->
      <div class="row">
        <!-- تسمية السطوع مع القيمة المئوية الحية -->
        <div class="lbl"><span>سطوع الشاشة</span><b id="bVal">86%</b></div>
        <!-- شريط السطوع من 20% للتعتيم العميق حتى 150% لرفع الإضاءة -->
        <input type="range" id="bRng" min="20" max="150" value="86" />
      </div>
      <!-- صف التحكم بكثافة طبقة التعتيم الموضوعة فوق الموقع -->
      <div class="row">
        <!-- تسمية طبقة التعتيم وقيمتها المئوية -->
        <div class="lbl"><span>طبقة تعتيم فوق الموقع</span><b id="oVal">15%</b></div>
        <!-- شريط كثافة طبقة التعتيم من 0% حتى 85% -->
        <input type="range" id="oRng" min="0" max="85" value="15" />
      </div>
      <!-- صف اختيار نمط الوضع الداكن للصفحة أو ملف الـ PDF -->
      <div class="row">
        <!-- عنوان قائمة الوضع الداكن -->
        <div class="lbl"><span>الوضع الداكن</span></div>
        <!-- قائمة الأوضاع الداكنة المتاحة -->
        <select id="dmSel">
          <!-- خيار إبقاء ألوان الصفحة الأصلية مع الاكتفاء بالتعتيم -->
          <option value="off">إيقاف (عادي)</option>
          <!-- خيار الوضع الداكن الذكي الذي يحافظ على ألوان الصور والفيديو -->
          <option value="smart">داكن ذكي (يحفظ الصور)</option>
          <!-- خيار الوضع الداكن الدافئ المريح للقراءة المطولة -->
          <option value="warm">داكن دافئ للقراءة</option>
          <!-- خيار الوضع الداكن المخصص لعرض مستندات PDF -->
          <option value="pdf">داكن خاص لملفات PDF</option>
        </select>
      </div>
      <!-- صف أدوات تلوين الشاشة بكود HEX ولوحات الألوان -->
      <div class="row">
        <!-- مفتاح تفعيل طبقة اللون وعرض شدتها الحالية -->
        <div class="lbl">
          <!-- خانة اختيار لتشغيل أو إيقاف التلوين اللوني -->
          <label style="cursor:pointer;"><input type="checkbox" id="tChk" /> تلوين الشاشة HEX</label>
          <!-- عرض النسبة المئوية لشفافية اللون -->
          <b id="tVal">18%</b>
        </div>
        <!-- صف إدخال كود اللون نصياً أو اختياره من لوحة ألوان النظام -->
        <div style="display:flex;gap:5px;margin-top:3px;">
          <!-- حقل كتابة كود HEX السداسي مباشرة -->
          <input type="text" id="hexIn" value="#F59E0B" dir="ltr" style="font-family:monospace;" />
          <!-- منتقي الألوان المرئي المدمج في المتصفح -->
          <input type="color" id="colPick" value="#F59E0B" style="width:34px;height:28px;border:none;background:none;cursor:pointer;" />
        </div>
        <!-- شريط ضبط شدة وكثافة اللون المختار -->
        <input type="range" id="tRng" min="0" max="75" value="18" style="margin-top:4px;" />
        <!-- صف الألوان الطبية المريحة للعين الجاهزة للاختيار بنقرة واحدة -->
        <div class="swatches">
          <!-- لون العنبر لتصفية الضوء الأزرق -->
          <button class="sw" style="background:#F59E0B" data-hex="#F59E0B" title="عنبر"></button>
          <!-- لون ضوء الشموع الليلي الدافئ -->
          <button class="sw" style="background:#EA580C" data-hex="#EA580C" title="شموع"></button>
          <!-- لون الورق الكلاسيكي للقراءة -->
          <button class="sw" style="background:#D6B88A" data-hex="#D6B88A" title="ورقي"></button>
          <!-- اللون الأخضر المهدئ للإجهاد البصري -->
          <button class="sw" style="background:#10B981" data-hex="#10B981" title="أخضر"></button>
          <!-- اللون الوردي الهادئ لتخفيف الصداع الضوئي -->
          <button class="sw" style="background:#F43F5E" data-hex="#F43F5E" title="وردي"></button>
          <!-- اللون الأزرق القمري الليلي -->
          <button class="sw" style="background:#38BDF8" data-hex="#38BDF8" title="قمري"></button>
        </div>
      </div>
      <!-- شريط قياس استهلاك الذاكرة وزمن المعالجة الفعلي داخل الصفحة -->
      <div class="stat">
        <!-- يعرض الحجم التقديري لاستهلاك الأداة بالكيلوبايت -->
        <span>الاستهلاك: <b id="memStat" style="color:#38BDF8;">14 KB</b></span>
        <!-- يعرض زمن تطبيق الفلاتر بالمللي ثانية -->
        <span>المعالجة: <b id="msStat" style="color:#22C55E;">0.2ms</b></span>
      </div>
      <!-- زر فتح بلاغ مباشر في مستودع GitHub للمشكلات والمواقع غير المتوافقة -->
      <button class="btn btn-gh" id="ghBtn">🐞 إبلاغ عن مشكلة / موقع في GitHub</button>
    </div>
  `;

  // يعرّف دالة مختصرة للبحث عن العناصر داخل شجرة Shadow DOM المعزولة التي أُنشئت أعلاه.
  const q = (id) => shadow.getElementById(id);
  // يحفظ مرجع اللوحة التفاعلية لاستخدامه السريع عند الفتح والإغلاق من الزر العائم.
  const panel = q("mqw-panel");

  // يعرّف دالة تحويل كود اللون السداسي HEX ودرجة الشفافية إلى صيغة لونية rgba صالحة لطبقة التلوين.
  function hexToRgba(hex, a) {
    // يتحقق من سلامة كود اللون المكون من 6 خانات سداسية أو يعود للون العنبر الافتراضي.
    const h = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#F59E0B";
    // يحول القنوات الثلاث من النظام السداسي عشري إلى أرقام عشرية ويدمجها مع معامل الشفافية a.
    return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
    // يغلق دالة تحويل اللون hexToRgba.
  }

  // يعرّف دالة التحديث البصري والقياسي الشاملة التي تطبق إعدادات cfg على الصفحة وتقيس زمن التنفيذ والذاكرة.
  function render() {
    // يسجل اللحظة الزمنية الدقيقة لبدء التحديث لقياس استهلاك المعالج بالمللي ثانية.
    const t0 = performance.now();
    // يزامن حالة مربع التفعيل مع قيمة cfg.enabled.
    q("enChk").checked = cfg.enabled;
    // يزامن موضع شريط السطوع مع قيمة cfg.brightness.
    q("bRng").value = cfg.brightness;
    // يعرض رقم نسبة السطوع الحالية للمستخدم.
    q("bVal").textContent = cfg.brightness + "%";
    // يزامن موضع شريط طبقة التعتيم مع قيمة cfg.overlay.
    q("oRng").value = cfg.overlay;
    // يعرض النسبة المئوية لطبقة التعتيم.
    q("oVal").textContent = cfg.overlay + "%";
    // يزامن القائمة المنسدلة للوضع الداكن مع قيمة cfg.darkMode.
    q("dmSel").value = cfg.darkMode;
    // يزامن مربع تفعيل التلوين مع قيمة cfg.tintEnabled.
    q("tChk").checked = cfg.tintEnabled;
    // يحدّث حقل النص السداسي بكود اللون النشط حالياً.
    q("hexIn").value = cfg.tintColor;
    // يحدّث منتقي الألوان المرئي بنفس كود اللون النشط.
    q("colPick").value = cfg.tintColor;
    // يزامن شريط شفافية اللون مع قيمة cfg.tintOpacity.
    q("tRng").value = cfg.tintOpacity;
    // يعرض نسبة شدة اللون المئوية.
    q("tVal").textContent = cfg.tintOpacity + "%";

    // يتحقق مما إذا أوقف المستخدم الأداة ليزيل كافة التأثيرات فوراً ويعيد الصفحة لحالتها الطبيعية.
    if (!cfg.enabled) {
      // يفرغ قواعد الفلتر من وسم أنماط الصفحة.
      styleDoc.textContent = "";
      // يجعل طبقة التعتيم شفافة بالكامل.
      q("dim").style.background = "transparent";
      // يجعل طبقة اللون شفافة بالكامل.
      q("tint").style.background = "transparent";
      // يعرض كلمة OFF على الزر العائم المصغر للدلالة على التوقف.
      q("fabStat").textContent = "OFF";
      // ينهي الدالة بعد إيقاف كافة المؤثرات.
      return;
      // يغلق شرط الإيقاف المؤقت.
    }

    // يبدأ بناء مصفوفة فلاتر CSS انطلاقاً من نسبة السطوع المختارة مقسومة على 100.
    const f = [`brightness(${(cfg.brightness / 100).toFixed(2)})`];
    // يضيف فلتر العكس الذكي وتدوير الطيف عند اختيار الوضع الداكن الذكي.
    if (cfg.darkMode === "smart") f.push("invert(0.92) hue-rotate(180deg)");
    // يضيف فلتر العكس الدافئ مع لمسة Sepia عند اختيار الوضع الداكن الدافئ للقراءة.
    if (cfg.darkMode === "warm") f.push("invert(0.88) hue-rotate(180deg) sepia(0.18)");
    // يضيف فلتر الوضع الداكن المتزن للتباين عند اختيار وضع مستندات PDF.
    if (cfg.darkMode === "pdf") f.push("invert(0.90) hue-rotate(180deg) contrast(0.95)");

    // يركّب قاعدة CSS الرئيسية التي تطبق الفلاتر المجتمعة على جذر الصفحة (html).
    let css = `html { filter: ${f.join(" ")} !important; }`;
    // يتحقق من تفعيل أي نمط من أنماط الوضع الداكن لحماية الصور والواجهة العائمة من انعكاس الألوان.
    if (cfg.darkMode !== "off") {
      // يضيف عكساً مضاداً لعنصر استضافة الأداة وللصور والفيديوهات لتبقى بألوانها الحقيقية السليمة.
      css += `
        #${HOST_ID} { filter: invert(1) hue-rotate(180deg) !important; }
        ${cfg.darkMode !== "pdf" ? "html img, html video, html canvas { filter: invert(1) hue-rotate(180deg) !important; }" : ""}
      `;
      // يغلق شرط العكس المضاد للوسائط في الوضع الداكن.
    }
    // يضيف استهدافاً مباشراً لعناصر عرض الـ PDF المدمجة لضمان استجابتها للسطوع والوضع الداكن في المتصفحات.
    css += `embed[type="application/pdf"], object[type="application/pdf"] { filter: ${f.join(" ")} !important; }`;
    // يحقن نص أنماط CSS النهائي داخل وسم styleDoc الملحق برأس الصفحة.
    styleDoc.textContent = css;

    // يحدّث شفافية طبقة التعتيم السوداء العلوية بناءً على قيمة cfg.overlay.
    q("dim").style.background = `rgba(0,0,0,${(cfg.overlay / 100).toFixed(3)})`;
    // يحدّث لون وشفافية طبقة تلوين HEX عند تفعيلها أو يخفيها عند تعطيلها.
    q("tint").style.background = cfg.tintEnabled
      // يستدعي دالة hexToRgba لحساب اللون الشفاف الدقيق.
      ? hexToRgba(cfg.tintColor, cfg.tintOpacity / 100)
      // يعيد الشفافية الكاملة عند إيقاف التلوين.
      : "transparent";
    // يحدّث شارة الزر العائم لتعرض كلمة "داكن" أو نسبة السطوع المئوية الحالية.
    q("fabStat").textContent = cfg.darkMode !== "off" ? "داكن" : cfg.brightness + "%";

    // يحسب الزمن الفعلي المستغرق في المعالجة بالمللي ثانية بطرح t0 من اللحظة الحالية.
    const dt = Math.max(0.08, performance.now() - t0);
    // يعرض زمن المعالجة الفعلي داخل شريط القياس في اللوحة العائمة.
    q("msStat").textContent = dt.toFixed(2) + "ms";
    // يحسب الحجم الفعلي لاستهلاك عناصر الأداة وأنماطها بالكيلوبايت داخل الصفحة.
    const kb = Math.max(12, Math.round((styleDoc.textContent.length + shadow.innerHTML.length) / 1024) + 8);
    // يعرض رقم استهلاك الذاكرة المحدث داخل شريط القياس.
    q("memStat").textContent = kb + " KB";
    // يحفظ الإعدادات الجديدة في localStorage لتبقى ثابتة عند تحديث الصفحة.
    save();
    // يغلق دالة العرض والقياس render.
  }

  // يربط النقر على الزر العائم المصغر (#fab) بإظهار أو إخفاء لوحة التحكم الرئيسية.
  q("fab").onclick = () => {
    // يبدّل خاصية display للوحة بين الإخفاء والظهور.
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    // يغلق معالج نقر الزر العائم.
  };
  // يربط تغيير مربع التفعيل بتحديث cfg.enabled وإعادة الرسم فوراً.
  q("enChk").onchange = (e) => { cfg.enabled = e.target.checked; render(); };
  // يربط تحريك شريط السطوع بتحديث cfg.brightness وتطبيق الإضاءة لحظياً.
  q("bRng").oninput = (e) => { cfg.brightness = Number(e.target.value); render(); };
  // يربط تحريك شريط طبقة التعتيم بتحديث cfg.overlay وتعديل شفافية الطبقة فوراً.
  q("oRng").oninput = (e) => { cfg.overlay = Number(e.target.value); render(); };
  // يربط تغيير قائمة الوضع الداكن بتحديث cfg.darkMode وتطبيق النمط المختار.
  q("dmSel").onchange = (e) => { cfg.darkMode = e.target.value; render(); };
  // يربط مربع تفعيل لون HEX بتحديث cfg.tintEnabled وإعادة الرسم.
  q("tChk").onchange = (e) => { cfg.tintEnabled = e.target.checked; render(); };
  // يربط شريط شدة اللون بتحديث الشفافية وتفعيل طبقة اللون تلقائياً.
  q("tRng").oninput = (e) => { cfg.tintOpacity = Number(e.target.value); cfg.tintEnabled = true; render(); };
  // يربط منتقي الألوان المرئي بتحديث كود اللون السداسي بأحرف كبيرة وتفعيله مباشرة.
  q("colPick").oninput = (e) => { cfg.tintColor = e.target.value.toUpperCase(); cfg.tintEnabled = true; render(); };
  // يربط الكتابة المباشرة في حقل كود HEX بفحص الصيغة وتطبيق اللون فور اكتمال 6 خانات صحيحة.
  q("hexIn").oninput = (e) => {
    // يتحقق بالتعبير النمطي من صحة كود اللون السداسي المدخل يدويّاً.
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value.trim())) {
      // يحفظ الكود المعتمد بأحرف كبيرة في الإعدادات.
      cfg.tintColor = e.target.value.trim().toUpperCase();
      // يفعّل طبقة اللون تلقائياً ليظهر أثر الكود المكتوب فوراً.
      cfg.tintEnabled = true;
      // يستدعي دالة الرسم لتحديث الشاشة.
      render();
      // يغلق شرط صحة كود HEX.
    }
    // يغلق معالج حقل إدخال HEX النصي.
  };
  // يمر على جميع أزرار الألوان الجاهزة الستة لربط النقر عليها بتطبيق لونها السداسي فوراً.
  shadow.querySelectorAll(".sw").forEach((b) => {
    // يسجل حدث النقر لكل مربع لوني جاهز.
    b.onclick = () => {
      // يقرأ كود اللون المخزن في السمة data-hex للزر المنقور.
      cfg.tintColor = b.getAttribute("data-hex");
      // يفعّل طبقة التلوين لعرض اللون المختار على الشاشة.
      cfg.tintEnabled = true;
      // يعيد رسم الطبقات والواجهة.
      render();
      // يغلق معالج النقر على اللون الجاهز.
    };
    // يغلق حلقة ربط الألوان الجاهزة.
  });
  // يربط زر الإبلاغ ببناء وفتح تذكرة مشكلة جديدة على مستودع GitHub محمّلة برابط الصفحة وإعداداتها.
  q("ghBtn").onclick = () => {
    // يجهز معاملات الاستعلام القياسية لصفحة إنشاء Issue في GitHub.
    const params = new URLSearchParams({
      // يضع عنواناً تلقائياً يضم اسم نطاق الموقع الحالي.
      title: `[بلاغ إضافة الويب] ${location.hostname || "موقع"}`,
      // يصنف البلاغ بوسوم المواقع غير المتوافقة وإضافة الويب.
      labels: "incompatible-site,web-addon",
      // يملأ نص البلاغ تلقائياً برابط الصفحة وقيم السطوع والطبقة والوضع الداكن لتسهيل التشخيص.
      body: `### رابط الصفحة\n\`${location.href}\`\n\n### الإعدادات الحالية\n- السطوع: ${cfg.brightness}% | طبقة التعتيم: ${cfg.overlay}% | الوضع الداكن: ${cfg.darkMode}\n\n### وصف المشكلة\n`
      // يغلق كائن معاملات رابط GitHub.
    });
    // يفتح صفحة البلاغ المجهزة في تبويب جديد آمن نحو مستودع Mohamed7AbdELhalim/Mustaqbalat.
    window.open(`https://github.com/${cfg.repo}/issues/new?${params.toString()}`, "_blank", "noopener");
    // يغلق معالج نقر زر بلاغات GitHub.
  };

  // ينفذ الرسم والتطبيق الأولي فور حقن الأداة في الصفحة لتعمل مباشرة منذ اللحظة الأولى.
  render();
  // يغلق الدالة الفورية المعزولة لمشغّل إضافة الويب وينفذها.
})();
