/**
 * Mustaqbalat — Zero-Storage In-Memory PDF Reader & Dimmer Controller
 */
// يفتح دالة فورية التنفيذ (IIFE) لعزل متغيرات قارئ الـ PDF عن النطاق العام وحماية الصفحة من أي تداخل برمجي.
(function () {
  // يفعّل الوضع الصارم في جافاسكربت مباشرة داخل الدالة الفورية لمنع المتغيرات غير المعرّفة وضمان دقة التنفيذ.
  "use strict";

  // يعرّف دالة مختصرة لجلب عناصر واجهة pdf-viewer.html بواسطة المعرّف (id) لتسريع الوصول لأدوات شريط التحكم.
  const $ = (id) => document.getElementById(id);
  // ينشئ متغيراً لتتبع رابط الذاكرة المؤقتة (Blob ObjectURL) لملف الـ PDF المفتوح حالياً تمهيداً لتحريره عند فتح ملف جديد.
  let currentObjectUrl = null;

  // يتحقق مما إذا كانت الصفحة مفتوحة كبروتوكول إضافة متصفح (chrome-extension:// أو moz-extension://) لضبط أزرار التنقل.
  if (location.protocol.includes("extension")) {
    // يجلب زر العودة للمنصة الرئيسية استناداً إلى تحقق البروتوكول السابق لأن الإضافة المستقلة لا تحتاج رابط index.html الخارجي.
    const back = $("backHomeBtn");
    // يخفي زر العودة في حال وجوده داخل سياق الإضافة المحزومة منعاً لفتح مسار غير موجود خارج مجلد extension/.
    if (back) back.style.display = "none";
    // يغلق كتلة التحقق من بروتوكول تشغيل الإضافة.
  }

  // يعرّف دالة تحويل كود اللون السداسي (HEX) ودرجة الشفافية (alpha) إلى صيغة rgba لتطبيقها على طبقة تلوين الـ PDF.
  function hexToRgba(hex, alpha) {
    // يتحقق من صحة صيغة كود اللون الممرر للدالة في السطر السابق أو يعود للون العنبر الدافئ الافتراضي (#F59E0B).
    const c = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#F59E0B";
    // يستخرج قيمة القناة الحمراء (Red) من أول خانتين بعد علامة # في السلسلة المعتمدة c ويحولها من النظام السداسي عشري إلى العشري.
    const r = parseInt(c.slice(1, 3), 16);
    // يستخرج قيمة القناة الخضراء (Green) من الخانتين التاليتين استكمالاً لتحليل القنوات اللونية الثلاث.
    const g = parseInt(c.slice(3, 5), 16);
    // يستخرج قيمة القناة الزرقاء (Blue) من آخر خانتين لإتمام بناء مركبات اللون الثلاث (R, G, B).
    const b = parseInt(c.slice(5, 7), 16);
    // يعيد نص اللون النهائي بصيغة rgba جامعاً القنوات الثلاث السابقة مع تقريب الشفافية لثلاث خانات عشرية لطبقة #pdfOverlayTint.
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
    // يغلق دالة تحويل الألوان السداسية hexToRgba.
  }

  // يعرّف الدالة المحورية التي تقرأ قيم شريط أدوات pdf-viewer.html وتطبق فلاتر السطوع والطبقات والوضع الداكن فوراً على المستند.
  function applyPdfVisuals() {
    // يقرأ قيمة شريط سطوع الـ PDF ويحولها لرقم مع اعتماد 80% كقيمة احتياطية عند غياب الإدخال.
    const brightness = Number($("pdfBrightnessRange").value) || 80;
    // يقرأ قيمة شريط طبقة التعتيم العلوية (Overlay) مكمّلاً قراءة السطوع السابقة لتحديد كثافة الطبقة السوداء فوق المستند.
    const layer = Number($("pdfLayerRange").value) || 20;
    // يقرأ وضع القراءة المختار من القائمة المنسدلة (ورقي عادي / وضع داكن للـ PDF / ورق دافئ Sepia).
    const mode = $("pdfDarkSelect").value;
    // يقرأ اللون المختار من منتقي ألوان HEX في شريط الأدوات لتمريره لاحقاً إلى دالة hexToRgba.
    const hex = $("pdfHexPicker").value || "#F59E0B";
    // يقرأ شدة طبقة اللون ويقسمها على 100 لتحويل النسبة المئوية إلى معامل شفافية بين 0 و1 متوافق مع اللون السابق.
    const tintAlpha = (Number($("pdfTintAlpha").value) || 0) / 100;

    // يحدّث النص الرقمي المعروض بجانب شريط السطوع ليعكس للمستخدم قيمة brightness المقروءة أعلاه.
    $("pdfBrightnessVal").textContent = `${brightness}%`;
    // يحدّث النص الرقمي المعروض بجانب شريط طبقة التعتيم ليتطابق بصرياً مع قيمة layer.
    $("pdfLayerVal").textContent = `${layer}%`;

    // ينشئ مصفوفة الفلاتر البصرية بدءاً بفلتر السطوع الأساسي محسوباً من متغير brightness كنسبة عشرية.
    const filters = [`brightness(${(brightness / 100).toFixed(3)})`];
    // يفحص ما إذا كان المستخدم قد اختار الوضع الداكن الكامل لملفات الـ PDF في متغير mode السابق.
    if (mode === "pdf-dark") {
      // يضيف فلاتر عكس الألوان وتدوير الطيف اللوني وضبط التباين إلى مصفوفة filters لتحويل خلفية الـ PDF البيضاء إلى داكنة مريحة.
      filters.push("invert(0.91)", "hue-rotate(180deg)", "contrast(0.96)");
      // يفحص البديل الثاني لمتغير mode وهو وضع الورق الدافئ الكلاسيكي (Sepia).
    } else if (mode === "sepia") {
      // يضيف فلتر الدفء الورقي وتهدئة التباين إلى مصفوفة filters كبديل عن الوضع الداكن.
      filters.push("sepia(0.38)", "contrast(0.97)");
      // يغلق سلسلة شروط فحص وضع قراءة المستند.
    }

    // يدمج عناصر مصفوفة filters المتجمعة من السطور السابقة في سلسلة CSS واحدة جاهزة للتطبيق.
    const filterCss = filters.join(" ");
    // يطبق سلسلة الفلاتر filterCss على ورقة المعاينة المدمجة (samplePdfSheet) المعروضة قبل فتح ملف خارجي.
    $("samplePdfSheet").style.filter = filterCss;
    // يطبق نفس سلسلة الفلاتر filterCss على إطار عرض ملفات الـ PDF الحقيقية (pdfEmbedFrame) لضمان تطابق السلوك البصري.
    $("pdfEmbedFrame").style.filter = filterCss;

    // يضبط شفافية طبقة التعتيم السوداء العلوية (#pdfOverlayDimmer) فوق منطقة العرض بناءً على قيمة layer المقروءة.
    $("pdfOverlayDimmer").style.backgroundColor = `rgba(0, 0, 0, ${(layer / 100).toFixed(3)})`;
    // يضبط لون وشفافية طبقة التلوين العلوية (#pdfOverlayTint) عبر استدعاء hexToRgba بالقيمتين hex وtintAlpha.
    $("pdfOverlayTint").style.backgroundColor = hexToRgba(hex, tintAlpha);
    // يحدد نمط الدمج البصري multiply للطبقة اللونية السابقة لكي تمتزج مع بياض الورقة دون طمس حروف النص الأسود.
    $("pdfOverlayTint").style.mixBlendMode = "multiply";
    // يغلق دالة التحديث البصري الشامل applyPdfVisuals.
  }

  // يعرّف دالة لفتح أي مصدر PDF (سواء رابط ذاكرة مؤقتة Blob أو رابط ويب مباشر) داخل إطار العرض الرئيسي.
  function openPdfBlobOrUrl(src) {
    // يخفي ورقة النموذج التوضيحي الافتراضية لإفساح المجال لعرض ملف الـ PDF الفعلي القادم في المعامل src.
    $("samplePdfSheet").style.display = "none";
    // يجلب عنصر الإطار المدمج (iframe) المخصص لعرض مستند الـ PDF بعد إخفاء النموذج الافتراضي.
    const frame = $("pdfEmbedFrame");
    // يُظهر عنصر الإطار في واجهة الصفحة ليملأ مساحة القراءة بالكامل.
    frame.style.display = "block";
    // يسند رابط الملف src إلى خاصية المصدر للإطار لكي يبدأ المتصفح بعرض صفحات الـ PDF فوراً.
    frame.src = src;
    // يستدعي دالة applyPdfVisuals لضمان تطبيق إعدادات السطوع والطبقات الحالية على المستند المفتوح للتو.
    applyPdfVisuals();
    // يغلق دالة فتح مستند الـ PDF.
  }

  // يربط حدث اختيار ملف من الجهاز بزر الإدخال (#pdfFileInput) لقراءة ملف الـ PDF في الذاكرة العشوائية (0 بايت تخزين دائم).
  $("pdfFileInput").addEventListener("change", (e) => {
    // يستخرج الملف الأول الذي اختاره المستخدم من قائمة ملفات الحدث e.target.files.
    const file = e.target.files && e.target.files[0];
    // ينهي التنفيذ بهدوء إذا ألغى المستخدم نافذة الاختيار ولم يكن هناك ملف في السطر السابق.
    if (!file) return;
    // يتحقق من وجود رابط ذاكرة سابق في currentObjectUrl ليقوم بتحريره من ذاكرة المتصفح (RAM) ومنع تسرب الذاكرة.
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    // ينشئ رابط ذاكرة محلي فوري (blob:...) للملف المختار دون رفعه لأي خادم أو نسخه على القرص.
    currentObjectUrl = URL.createObjectURL(file);
    // يمرر رابط الذاكرة الجديد الناتج عن السطر السابق إلى دالة openPdfBlobOrUrl لعرضه وتعتيمه فوراً.
    openPdfBlobOrUrl(currentObjectUrl);
    // يغلق معالج حدث اختيار الملف المحلي.
  });

  // يربط زر "فتح" بجانب حقل الرابط النصي لتمكين المستخدم من فتح ملفات PDF المنشورة عبر الروابط المباشرة.
  $("loadPdfUrlBtn").addEventListener("click", () => {
    // يقرأ النص المدخل في حقل الرابط (#pdfUrlInput) ويزيل الفراغات الزائدة من أطرافه.
    const url = ($("pdfUrlInput").value || "").trim();
    // يستدعي دالة العرض openPdfBlobOrUrl إذا كان النص المقروء في السطر السابق غير فارغ.
    if (url) openPdfBlobOrUrl(url);
    // يغلق معالج النقر على زر فتح الرابط.
  });

  // Drag & Drop PDF anywhere on stage
  // يجلب حاوية مساحة العرض (#pdfStage) لتفعيل ميزة سحب وإفلات ملفات الـ PDF مباشرة داخل النافذة.
  const stage = $("pdfStage");
  // يستمع لحدث مرور ملف مسحوب فوق مساحة العرض stage لتهيئة المتصفح لقبول الإفلات.
  stage.addEventListener("dragover", (e) => {
    // يمنع السلوك الافتراضي للمتصفح (الذي يغلق الصفحة الحالية ويفتح الملف خاماً بدون طبقات التعتيم).
    e.preventDefault();
    // يغلق معالج حدث السحب dragover.
  });
  // يستمع لحدث إفلات الملف فعلياً فوق مساحة العرض استكمالاً لحدث dragover السابق.
  stage.addEventListener("drop", (e) => {
    // يمنع فتح الملف خارج القارئ المدمج للحفاظ على بقاء طبقات التعتيم والألوان نشطة عليه.
    e.preventDefault();
    // يلتقط الملف الأول المُلقي داخل منطقة العرض من بيانات الحدث dataTransfer.
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    // يتحقق من نجاح التقاط ملف صالح من عملية الإفلات السابقة.
    if (file) {
      // يحرر أي رابط ذاكرة سابق محفوظ في currentObjectUrl للحفاظ على خفة استهلاك الذاكرة.
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      // يولّد رابط ذاكرة مؤقتاً جديداً للملف المُفلت في الذاكرة العشوائية مباشرة.
      currentObjectUrl = URL.createObjectURL(file);
      // يعرض الملف المُفلت ويطبق عليه طبقات التعتيم عبر استدعاء openPdfBlobOrUrl.
      openPdfBlobOrUrl(currentObjectUrl);
      // يغلق شرط التحقق من وجود الملف المُفلت.
    }
    // يغلق معالج حدث الإفلات drop.
  });

  // Check URL query param ?file=...
  // يحلل معاملات الرابط الحالي للصفحة (مثل ?src=...) لدعم التمرير المباشر للروابط من نافذة الإضافة أو المنصة.
  const params = new URLSearchParams(location.search);
  // يفحص وجود المعامل "src" داخل كائن المعاملات المستخرج في السطر السابق.
  if (params.get("src")) {
    // يملأ حقل الرابط في شريط الأدوات بقيمة المعامل src ليراه المستخدم بوضوح.
    $("pdfUrlInput").value = params.get("src");
    // يفتح رابط الـ PDF الممرر تلقائياً فور تحميل القارئ استكمالاً للسطر السابق.
    openPdfBlobOrUrl(params.get("src"));
    // يغلق شرط فحص معامل الرابط التلقائي.
  }

  // ينشئ مصفوفة بمعرّفات جميع عناصر التحكم البصري الخمسة في شريط الأدوات لربطها معاً بدالة التحديث اللحظي.
  ["pdfBrightnessRange", "pdfLayerRange", "pdfDarkSelect", "pdfHexPicker", "pdfTintAlpha"].forEach(
    // يستقبل كل معرّف عنصر (id) من المصفوفة السابقة على حدة لتسجيل مستمعات الأحداث عليه.
    (id) => {
      // يربط حدث السحب المستمر (input) للعنصر بدالة applyPdfVisuals لاستجابة فورية ناعمة أثناء تحريك المؤشر.
      $(id).addEventListener("input", applyPdfVisuals);
      // يربط حدث التغيير النهائي (change) للعنصر بنفس الدالة لضمان التوافق الكامل مع القوائم المنسدلة ومنتقي الألوان.
      $(id).addEventListener("change", applyPdfVisuals);
      // يغلق دالة التكرار لكل عنصر تحكم في الشريط.
    }
    // يغلق استدعاء forEach على مصفوفة عناصر التحكم.
  );

  // ينفذ التحديث البصري الأولي فور تحميل الصفحة لتطبيق القيم الافتراضية المريحة (سطوع 80% وطبقة 20%) منذ اللحظة الأولى.
  applyPdfVisuals();
  // يغلق الدالة الفورية المعزولة (IIFE) وينفذها مباشرة.
})();
