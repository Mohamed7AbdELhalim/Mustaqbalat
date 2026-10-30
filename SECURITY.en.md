> **تنبيه النسخة العربية:** تتوفر النسخة العربية الأصلية المطابقة تماماً لسياسة الأمان والخصوصية في **[`SECURITY.md`](./SECURITY.md)**. | **[الصفحة الرئيسية بالعربية](./README.md)**

# Security & Privacy Policy

This document specifies the security architecture, data-privacy guarantees, and responsible vulnerability disclosure process for **Mustaqbalat**.

---

## 1. Privacy & Security Architecture

Mustaqbalat operates under a strict **100% Client-Side Execution** model:
1. **Zero External Telemetry:** The extension and web add-on never transmit browsing history, visited URLs, user settings, or resource analytics to any external server.
2. **Local-Only Persistence:** All visual settings and multi-week resource logs reside strictly inside local browser storage on the user's device (`chrome.storage.local` or `localStorage`).
3. **In-RAM PDF Processing:** The built-in PDF dimmer/reader (`pdf-viewer.html`) renders user-selected PDF files strictly in browser RAM via `URL.createObjectURL` with zero network uploads.
4. **Explicit Opt-In GitHub Submission Only:** Network requests occur solely when the user explicitly clicks **Submit to GitHub Issues** in Tab 4. Supplying a `GitHub Personal Access Token` is strictly optional and is never persisted to disk storage.
5. **Manifest V3 & Shadow DOM Isolation:** All extension scripts comply with strict `Manifest V3` Content Security Policy rules—zero `eval()` and zero remote code execution.

---

## 2. Supported Versions

| Version | Security Support Status |
| :--- | :--- |
| `1.0.x` (Current) | Actively supported with security updates |

---

## 3. Reporting a Vulnerability

If you discover a potential security vulnerability in the extension or web converter codebase:
1. **Do not open a public GitHub Issue** containing exploit details prior to remediation.
2. Send a concise technical report including reproduction steps and affected file paths directly to the official maintainer email:
   - **Email:** [`algorithm-platforms.figment413@passinbox.com`](mailto:algorithm-platforms.figment413@passinbox.com)
3. Reports are reviewed promptly, patched on the active branch, and documented in `CHANGELOG.en.md` upon release.
