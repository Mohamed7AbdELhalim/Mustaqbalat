/**
 * Mustaqbalat — Zero-Storage In-Memory PDF Reader & Dimmer Controller
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let currentObjectUrl = null;

  if (location.protocol.includes("extension")) {
    const back = $("backHomeBtn");
    if (back) back.style.display = "none";
  }

  function hexToRgba(hex, alpha) {
    const c = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#F59E0B";
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  }

  function applyPdfVisuals() {
    const brightness = Number($("pdfBrightnessRange").value) || 80;
    const layer = Number($("pdfLayerRange").value) || 20;
    const mode = $("pdfDarkSelect").value;
    const hex = $("pdfHexPicker").value || "#F59E0B";
    const tintAlpha = (Number($("pdfTintAlpha").value) || 0) / 100;

    $("pdfBrightnessVal").textContent = `${brightness}%`;
    $("pdfLayerVal").textContent = `${layer}%`;

    const filters = [`brightness(${(brightness / 100).toFixed(3)})`];
    if (mode === "pdf-dark") {
      filters.push("invert(0.91)", "hue-rotate(180deg)", "contrast(0.96)");
    } else if (mode === "sepia") {
      filters.push("sepia(0.38)", "contrast(0.97)");
    }

    const filterCss = filters.join(" ");
    $("samplePdfSheet").style.filter = filterCss;
    $("pdfEmbedFrame").style.filter = filterCss;

    $("pdfOverlayDimmer").style.backgroundColor = `rgba(0, 0, 0, ${(layer / 100).toFixed(3)})`;
    $("pdfOverlayTint").style.backgroundColor = hexToRgba(hex, tintAlpha);
    $("pdfOverlayTint").style.mixBlendMode = "multiply";
  }

  function openPdfBlobOrUrl(src) {
    $("samplePdfSheet").style.display = "none";
    const frame = $("pdfEmbedFrame");
    frame.style.display = "block";
    frame.src = src;
    applyPdfVisuals();
  }

  $("pdfFileInput").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(file);
    openPdfBlobOrUrl(currentObjectUrl);
  });

  $("loadPdfUrlBtn").addEventListener("click", () => {
    const url = ($("pdfUrlInput").value || "").trim();
    if (url) openPdfBlobOrUrl(url);
  });

  // Drag & Drop PDF anywhere on stage
  const stage = $("pdfStage");
  stage.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  stage.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = URL.createObjectURL(file);
      openPdfBlobOrUrl(currentObjectUrl);
    }
  });

  // Check URL query param ?file=...
  const params = new URLSearchParams(location.search);
  if (params.get("src")) {
    $("pdfUrlInput").value = params.get("src");
    openPdfBlobOrUrl(params.get("src"));
  }

  ["pdfBrightnessRange", "pdfLayerRange", "pdfDarkSelect", "pdfHexPicker", "pdfTintAlpha"].forEach(
    (id) => {
      $(id).addEventListener("input", applyPdfVisuals);
      $(id).addEventListener("change", applyPdfVisuals);
    }
  );

  applyPdfVisuals();
})();
