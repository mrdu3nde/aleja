/**
 * Copy text to the clipboard, including on insecure origins.
 *
 * `navigator.clipboard` only exists in a secure context — HTTPS or localhost.
 * Opening the studio from a phone over the LAN (http://192.168.x.x:3000) is not
 * secure, so the modern API is simply undefined there and any call throws.
 * The execCommand path is deprecated but still works on plain HTTP, which is
 * exactly the case it covers here.
 *
 * Returns false when both paths fail, so the caller can tell the user to copy
 * by hand instead of failing silently.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    // keep it off-screen but still focusable — display:none would not select
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);

    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS ignores select() alone

    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
