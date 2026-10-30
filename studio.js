/**
 * Mustaqbalat — Live Studio & Zero-Space Web Add-on Converter Controller
 */
// يفتح دالة فورية التنفيذ (IIFE) لعزل منطق المنصة التفاعلية (index.html) ومنع تصادم المتغيرات مع المحرك الأساسي.
(function () {
  // يفعّل الوضع الصارم لضمان خلو الشفرة من الأخطاء الصامتة وحماية المتغيرات العامة.
  "use strict";

  // ينشئ دالة مساعدة مختصرة للوصول السريع إلى عناصر DOM في صفحة index.html عبر معرّفها.
  const $ = (id) => document.getElementById(id);
  // يعرّف متغيراً لحفظ آخر نسخة مولّدة من إضافات الويب (Bookmarklet وUserscript) لاستخدامها عند النسخ أو التنزيل.
  let latestAddons = null;

  // Listen for live updates from the embedded Extension Popup Simulator
  // يسجل مستمعاً لرسائل postMessage القادمة من إطار محاكي الإضافة المدمج (#popupSimulatorIframe).
  window.addEventListener("message", (event) => {
    // يستخرج حمولة البيانات المرسلة من نافذة popup.js داخل الحدث الوارد.
    const data = event.data;
    // يتحقق من أن الرسالة تخص مزامنة منصة مستقبلات دون غيرها من رسائل المتصفح.
    if (!data || data.type !== "MUSTAQBALAT_STUDIO_SYNC") return;
    // يفحص تطابق مفتاح الإعدادات مع وجود المحرك الأساسي MustaqbalatEngine في الصفحة الأم.
    if (data.key === "mustaqbalat_settings_v1" && window.MustaqbalatEngine) {
      // يمرر التعديلات فوراً إلى المحرك الأساسي لتطبيق السطوع والطبقات والوضع الداكن وألوان HEX على الصفحة أمام المستخدم.
      window.MustaqbalatEngine.updateSettings(data.value || {});
      // يغلق شرط مزامنة إعدادات المحرك الحي.
    }
    // يغلق معالج رسائل التزامن بين الإطار المدمج والصفحة الرئيسية.
  });

  // Switch between Live Webpage Demo and Inline PDF Demo
  // يجلب أزرار التبديل بين معاينة صفحة الويب ومعاينة مستند الـ PDF في قسم الاختبار الحي.
  document.querySelectorAll(".sb-tab").forEach((btn) => {
    // يربط حدث النقر بكل زر تبويب لتبديل مساحة المعاينة النشطة.
    btn.addEventListener("click", () => {
      // يزيل فئة التفعيل البصري "active" من كافة أزرار التبويب تمهيداً لتفعيل الزر المنقور.
      document.querySelectorAll(".sb-tab").forEach((b) => b.classList.remove("active"));
      // يضيف فئة التفعيل "active" للزر الذي نقر عليه المستخدم حالياً.
      btn.classList.add("active");
      // يقرأ نوع المسرح المطلوب ("web" أو "pdf") من السمة data-stage للزر المنقور.
      const mode = btn.dataset.stage;
      // يُظهر نموذج صفحة الويب الساطعة إذا كان الوضع "web" أو يخفيه خلاف ذلك.
      $("stageWeb").style.display = mode === "web" ? "block" : "none";
      // يُظهر نموذج مستند الـ PDF التجريبي إذا كان الوضع "pdf" بالتبادل مع السطر السابق.
      $("stagePdf").style.display = mode === "pdf" ? "block" : "none";
      // يغلق معالج نقر زر تبديل مسرح المعاينة.
    });
    // يغلق حلقة ربط أزرار التبديل في منطقة الاختبار.
  });

  // يعرّف دالة تجمع الإعدادات المسبقة التي اختارها المستخدم في قسم "محوّل إضافة الويب" قبل التوليد.
  function getConverterPreset() {
    // يقرأ كود اللون السداسي المدخل في حقل convHexColor ويزيل المسافات المحيطة به.
    const hexRaw = ($("convHexColor").value || "#F59E0B").trim();
    // يتحقق من مطابقة اللون لصيغة HEX القياسية المكونة من 6 خانات أو يعود للعنبر الافتراضي.
    const hex = /^#[0-9a-fA-F]{6}$/.test(hexRaw) ? hexRaw.toUpperCase() : "#F59E0B";
    // يبدأ إرجاع كائن الإعدادات الجاهز للحقن داخل الـ Bookmarklet والـ Userscript وحزمة الـ ZIP.
    return {
      // يضمن تفعيل الأداة تلقائياً فور تشغيلها لدى المستخدم.
      enabled: true,
      // يقيّد قيمة السطوع الافتراضي المختارة بين 20% و150% لحماية الشاشة من القيم الشاذة.
      brightness: Math.min(150, Math.max(20, Number($("convBrightness").value) || 86)),
      // يقيّد كثافة طبقة التعتيم العلوية الافتراضية بين 0% و85%.
      overlay: Math.min(85, Math.max(0, Number($("convOverlay").value) || 15)),
      // يقرأ خيار الوضع الداكن الافتراضي من القائمة المنسدلة convDarkMode.
      darkMode: $("convDarkMode").value || "off",
      // يفعّل طبقة اللون تلقائياً إذا قام المستخدم بتخصيص لون مختلف عن القيمة المبدئية.
      tintEnabled: hex !== "#F59E0B",
      // يسند كود اللون المعتمد بالسطور السابقة إلى إعدادات التوليد.
      tintColor: hex,
      // يحدد الشفافية المبدئية المتوازنة لطبقة التلوين بنسبة 18%.
      tintOpacity: 18
      // يغلق كائن الإعدادات المسبقة المُرجع من الدالة.
    };
    // يغلق دالة قراءة إعدادات المحوّل getConverterPreset.
  }

  // يعرّف دالة غير متزامنة لإعادة توليد كود الـ Bookmarklet والـ Userscript فورياً عند أي تعديل في الحقول.
  async function refreshWebAddons() {
    // يتأكد من جاهزية محرك التحويل MustaqbalatConverter المحمّل من converter/web-addon-converter.js.
    if (!window.MustaqbalatConverter) return;
    // يفتح كتلة محاولة آمنة لتوليد الشفرات وتحديث عناصر الواجهة.
    try {
      // يجلب الإعدادات المخصصة الحالية عبر استدعاء دالة getConverterPreset المعرّفة أعلاه.
      const preset = getConverterPreset();
      // يولّد كلاً من رابط الـ Bookmarklet ونص الـ Userscript في الذاكرة عبر استدعاء generateWebAddons.
      latestAddons = await window.MustaqbalatConverter.generateWebAddons(preset);
      // يحدّث رابط زر السحب والإفلات (#bookmarkletLink) بالكود الفوري الجاهز لإفلاته في شريط الإشارات.
      $("bookmarkletLink").href = latestAddons.bookmarkletHref;
      // يعرض نص الكود المولّد داخل مربع المعاينة (#bookmarkletCodeBox) ليتمكن مستخدمو الهواتف من نسخه.
      $("bookmarkletCodeBox").value = latestAddons.bookmarkletHref;
      // يحسب ويعرض الحجم الدقيق لملف الـ Userscript بالكيلوبايت في شارة الحجم (#userscriptSizeBadge).
      $("userscriptSizeBadge").textContent = `حجم السكربت: ${(latestAddons.userscriptBytes / 1024).toFixed(1)} كيلوبايت فقط`;
      // يلتقط أي خطأ محتمل أثناء قراءة ملف المشغّل أو ضغطه.
    } catch (err) {
      // يعرض سبب الخطأ بوضوح داخل مربع الكود لتنبيه المستخدم أو المطور.
      $("bookmarkletCodeBox").value = "تعذر توليد الكود: " + err.message;
      // يغلق كتلة معالجة أخطاء التوليد.
    }
    // يغلق دالة التحديث الفوري لإضافات الويب refreshWebAddons.
  }

  // يمر عبر حقول تخصيص الإعدادات الأربعة لربطها بإعادة التوليد اللحظي عند أي كتابة أو اختيار.
  ["convBrightness", "convOverlay", "convDarkMode", "convHexColor"].forEach((id) => {
    // يربط حدث الإدخال المباشر بدالة refreshWebAddons لتحديث الـ Bookmarklet مع كل رقم يكتبه المستخدم.
    $(id).addEventListener("input", refreshWebAddons);
    // يربط حدث التغيير النهائي بنفس الدالة لضمان تحديث القوائم المنسدلة.
    $(id).addEventListener("change", refreshWebAddons);
    // يغلق دالة ربط الأحداث لكل حقل تخصيص.
  });

  // Prevent accidental click on Bookmarklet link on the Studio page; instead run the live widget demo!
  // يعترض النقر العادي على زر السحب (#bookmarkletLink) داخل صفحة المنصة لتشغيل معاينة الأداة المصغرة بدلاً من مغادرة الصفحة.
  $("bookmarkletLink").addEventListener("click", (e) => {
    // يمنع التنفيذ المباشر للرابط عند النقر الخاطئ (بينما يظل السحب لشريط الإشارات يعمل بكفاءة كاملة).
    e.preventDefault();
    // يشغّل العرض الحي للأداة العائمة المصغرة مباشرة على الصفحة ليراها المستخدم كما ستظهر في المواقع الأخرى.
    launchStandaloneWebWidgetDemo();
    // يغلق معالج النقر على رابط الـ Bookmarklet.
  });

  // يربط زر نسخ كود الـ Bookmarklet لتسهيل تثبيته يدوياً في متصفحات الهواتف المحمولة بدون سحب وإفلات.
  $("copyBookmarkletBtn").addEventListener("click", async (e) => {
    // يضمن توليد الكود أولاً إذا لم يكن محفوظاً بعد في المتغير latestAddons.
    if (!latestAddons) await refreshWebAddons();
    // يتوقف بأمان في حال تعذر توفر الكود المولّد.
    if (!latestAddons) return;
    // يحاول نسخ الكود باستخدام واجهة الحافظة الحديثة (Clipboard API).
    try {
      // يكتب نص رابط الـ Bookmarklet الكامل داخل حافظة النظام.
      await navigator.clipboard.writeText(latestAddons.bookmarkletHref);
      // يحتفظ بالنص الأصلي للزر لإعادته بعد عرض رسالة التأكيد المؤقتة.
      const orig = e.currentTarget.textContent;
      // يغيّر نص الزر لإشعار المستخدم بنجاح النسخ فوراً.
      e.currentTarget.textContent = "✓ تم نسخ الكود للحافظة!";
      // يعيد النص الأصلي للزر بعد مرور ثانيتين (2000 مللي ثانية).
      setTimeout(() => { e.currentTarget.textContent = orig; }, 2000);
      // يتعامل مع المتصفحات أو البيئات التي تقيد واجهة الحافظة الحديثة عبر البديل الكلاسيكي.
    } catch (_) {
      // يظلل النص داخل مربع الكود (#bookmarkletCodeBox) بالكامل.
      $("bookmarkletCodeBox").select();
      // ينفذ أمر النسخ التقليدي للنص المظلل بالسطر السابق.
      document.execCommand("copy");
      // يغلق كتلة النسخ الاحتياطية.
    }
    // يغلق معالج زر نسخ الـ Bookmarklet.
  });

  // يعرّف دالة تشغيل وتجربة أداة الويب المصغرة (0KB Widget) حياً داخل الصفحة الحالية.
  function launchStandaloneWebWidgetDemo() {
    // يحقن الإعدادات المخصصة الحالية في المتغير العام الذي يقرؤه ملف web-widget-runtime.js عند إقلاعه.
    window.__MUSTAQBALAT_PRESET__ = getConverterPreset();
    // يتحقق مما إذا كان سكربت الأداة المصغرة قد تم حقنه مسبقاً في الصفحة لمنع التكرار.
    const existingScript = document.getElementById("mq-live-widget-script");
    // إذا كان محقوناً بالفعل، يكتفي بإظهار أو إخفاء لوحته العائمة داخل Shadow DOM.
    if (existingScript) {
      // يجلب عنصر الاستضافة المعزول للأداة العائمة من شجرة الصفحة.
      const host = document.getElementById("mustaqbalat-web-addon-host");
      // يتحقق من وجود العنصر وجذر الـ Shadow DOM الخاص به.
      if (host && host.shadowRoot) {
        // يجلب اللوحة الرئيسية للأداة المصغرة من داخل Shadow DOM.
        const panel = host.shadowRoot.getElementById("mqw-panel");
        // يبدّل حالة ظهور اللوحة بين الإخفاء والإظهار استجابةً لنقرة المستخدم.
        if (panel) panel.style.display = panel.style.display === "none" ? "block" : "none";
        // يغلق شرط فحص جذر الـ Shadow DOM.
      }
      // ينهي الدالة لعدم الحاجة لإعادة تحميل ملف السكربت مرة ثانية.
      return;
      // يغلق شرط التحقق من وجود السكربت المحقون سابقاً.
    }
    // ينشئ عنصر script جديداً لتحميل مشغّل الأداة المصغرة للمرة الأولى.
    const s = document.createElement("script");
    // يعطيه معرّفاً فريداً ليتعرف عليه الشرط السابق في النقرات اللاحقة.
    s.id = "mq-live-widget-script";
    // يحدد المسار النسبي لملف المشغّل المستقل داخل مجلد converter/.
    s.src = "./converter/web-widget-runtime.js";
    // يلحق السكربت بجسم الصفحة ليبدأ تنفيذه وعرض الأداة العائمة فوراً.
    document.body.appendChild(s);
    // يغلق دالة تشغيل المعاينة الحية للأداة المصغرة.
  }

  // يربط زر "تجربة الأداة المصغّرة هنا" بدالة launchStandaloneWebWidgetDemo المعرّفة أعلاه.
  $("testWebWidgetNowBtn").addEventListener("click", launchStandaloneWebWidgetDemo);

  // يربط زر توليد وتثبيت ملف الـ Userscript (.user.js) ليعمل تلقائياً في مديري السكربتات الخفيفة.
  $("installUserscriptBtn").addEventListener("click", async () => {
    // يتأكد من تحديث وتوليد أحدث نسخة من السكربت بناءً على الإعدادات الحالية.
    if (!latestAddons) await refreshWebAddons();
    // يخرج بأمان إن لم تتوفر بيانات التوليد.
    if (!latestAddons) return;
    // يحوّل نص الـ Userscript في ذاكرة المتصفح المؤقتة (RAM) إلى كائن Blob بصيغة جافاسكربت قياسية.
    const blob = new Blob([latestAddons.userscriptText], { type: "text/javascript;charset=utf-8" });
    // ينشئ رابط ذاكرة محلياً مؤقتاً للكائن الناتج في السطر السابق.
    const url = URL.createObjectURL(blob);
    // ينشئ عنصر رابط خفياً لإطلاق عملية التثبيت/التنزيل لملف .user.js.
    const a = document.createElement("a");
    // يسند رابط الذاكرة المؤقت إلى عنصر الرابط.
    a.href = url;
    // يسمي الملف بامتداد .user.js القياسي لكي يتعرف عليه Tampermonkey / Violentmonkey / Stay تلقائياً كإضافة ويب.
    a.download = "mustaqbalat.user.js";
    // يطلق النقرة البرمجية لبدء فتح/تثبيت السكربت لدى المستخدم.
    a.click();
    // يحرر رابط الذاكرة المؤقت بعد 5 ثوانٍ للحفاظ على نظافة ذاكرة المتصفح (0 تسرب ذاكرة).
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    // يغلق معالج زر تثبيت الـ Userscript.
  });

  // يربط زر نسخ نص الـ Userscript كاملاً للحافظة لمن يفضل لصقه يدوياً بدون تنزيل أي ملف.
  $("copyUserscriptBtn").addEventListener("click", async (e) => {
    // يتحقق من توفر السكربت المولّد أو يعيد توليده أولاً.
    if (!latestAddons) await refreshWebAddons();
    // ينهي التنفيذ إن لم تتوفر البيانات.
    if (!latestAddons) return;
    // يفتح محاولة النسخ المباشر للحافظة.
    try {
      // ينسخ الشفرة الكاملة لملف الـ Userscript إلى حافظة الجهاز.
      await navigator.clipboard.writeText(latestAddons.userscriptText);
      // يحفظ النص الأصلي للزر قبل تغييره مؤقتاً.
      const orig = e.currentTarget.textContent;
      // يعرض رسالة تأكيد النسخ على الزر نفسه.
      e.currentTarget.textContent = "✓ تم النسخ!";
      // يستعيد نص الزر الأصلي بعد ثانيتين.
      setTimeout(() => { e.currentTarget.textContent = orig; }, 2000);
      // يتجاهل الخطأ بصمت في البيئات غير الداعمة للحافظة.
    } catch (_) {}
    // يغلق معالج نسخ الـ Userscript.
  });

  // يعرّف دالة تجميع وحزم ملفات إضافة المتصفح كاملة بصيغة ZIP داخل الذاكرة العشوائية (RAM) لكروميوم أو فايرفوكس.
  async function triggerZipBuild(targetBrowser) {
    // يجلب صندوق عرض قائمة الملفات المحزومة في واجهة المحوّل.
    const listBox = $("packageFilesList");
    // يعرض رسالة حالة فورية للمستخدم أثناء قراءة وتجميع الـ 15 ملفاً في الذاكرة.
    listBox.textContent = "جاري تجميع وضغط ملفات الإضافة داخل الذاكرة المؤقتة (RAM)...";
    // يفتح كتلة التنفيذ الآمن لعملية الحزم الثنائي.
    try {
      // يجلب الإعدادات الافتراضية التي خصصها المستخدم لحقنها داخل ملفات الإضافة المحزومة.
      const preset = getConverterPreset();
      // يستدعي دالة buildExtensionPackage من محرك التحويل لتوليد ملف الـ ZIP ثنائياً في المتصفح.
      const result = await window.MustaqbalatConverter.buildExtensionPackage({
        // يحدد المتصفح المستهدف ("chromium" أو "firefox") لضبط توافق manifest.json تلقائياً.
        targetBrowser,
        // يمرر الإعدادات المخصصة ليتم تضمينها كقيم افتراضية داخل الحزمة الناتجة.
        customDefaults: preset
        // يغلق معاملات استدعاء بناء الحزمة.
      });
      // يحول الحجم الإجمالي للحزمة الناتجة من بايت إلى كيلوبايت مقرباً لخانة عشرية واحدة.
      const kb = (result.sizeBytes / 1024).toFixed(1);
      // يحدّث شارة الحجم بالحجم الحقيقي الدقيق للحزمة وعدد ملفاتها لإثبات خفتها الفائقة للمستخدم.
      $("zipSizeBadge").textContent = `الحجم الفعلي للحزمة الكاملة: ${kb} كيلوبايت (${result.fileCount} ملف)`;
      // يبني قائمة مرئية بأسماء جميع الملفات الداخلة في الحزمة وحجم كل ملف بالكيلوبايت.
      listBox.innerHTML = result.entries
        // يحوّل كل مدخل ملف إلى سطر HTML منسق يعرض المسار على اليسار والحجم على اليمين.
        .map((e) => `<div dir="ltr" style="display:flex;justify-content:space-between;"><span>${e.name}</span><b>${(e.bytes / 1024).toFixed(1)} KB</b></div>`)
        // يدمج الأسطر الناتجة في سلسلة نصية واحدة لعرضها داخل الصندوق.
        .join("");

      // ينشئ رابط ذاكرة مؤقتاً لملف الـ ZIP الثنائي المتولد في result.blob.
      const url = URL.createObjectURL(result.blob);
      // ينشئ عنصر رابط لتسليم الحزمة الجاهزة للمستخدم.
      const a = document.createElement("a");
      // يسند رابط الذاكرة المؤقت للحزمة إلى عنصر التنزيل.
      a.href = url;
      // يختار اسم الملف المناسب بناءً على المتصفح المستهدف (فايرفوكس أو عائلة كروميوم).
      a.download =
        // يفحص ما إذا كان الهدف هو متصفح فايرفوكس.
        targetBrowser === "firefox"
          // يخصص اسم حزمة فايرفوكس المتوافقة مع Manifest V3.
          ? "mustaqbalat-firefox-mv3.zip"
          // يخصص اسم حزمة كروم وإيدج وبريف المتوافقة مع Manifest V3.
          : "mustaqbalat-chromium-mv3.zip";
      // يبدأ تنزيل الحزمة خفيفة الحجم بضغطة واحدة.
      a.click();
      // يحرر الذاكرة المحجوزة لرابط الـ Blob بعد 5 ثوانٍ من بدء التسليم.
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      // يلتقط أي خطأ في جلب الملفات أو تكوين الأرشيف.
    } catch (err) {
      // يعرض رسالة الخطأ التفصيلية داخل صندوق حالة الملفات.
      listBox.textContent = "حدث خطأ أثناء التوليد: " + err.message;
      // يغلق كتلة معالجة أخطاء بناء الـ ZIP.
    }
    // يغلق دالة تجميع حزمة الإضافة triggerZipBuild.
  }

  // يربط زر التحويل لمتصفحات Chrome / Edge / Brave باستدعاء دالة triggerZipBuild بالمعامل "chromium".
  $("buildChromeZipBtn").addEventListener("click", () => triggerZipBuild("chromium"));
  // يربط زر التحويل لمتصفح Firefox باستدعاء دالة triggerZipBuild بالمعامل "firefox".
  $("buildFirefoxZipBtn").addEventListener("click", () => triggerZipBuild("firefox"));

  // يولّد أكواد الـ Bookmarklet والـ Userscript تلقائياً فور فتح الصفحة لتكون جاهزة للسحب أو النسخ مباشرة.
  refreshWebAddons();
  // يغلق الدالة الفورية المعزولة لمتحكم المنصة وينفذها.
})();
