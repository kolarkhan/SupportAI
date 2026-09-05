(function () {
  "use strict";

  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var agentId = currentScript.getAttribute("data-agent-id");
  if (!agentId) {
    console.error("[SupportAI Widget] Missing required data-agent-id attribute on the script tag.");
    return;
  }

  var position = currentScript.getAttribute("data-position") || "bottom-right";
  var color = currentScript.getAttribute("data-color") || "#6366f1";
  var origin = new URL(currentScript.src).origin;

  var isLeft = position === "bottom-left";
  var open = false;

  // ── Launcher button ───────────────────────────────────────────────────
  var launcher = document.createElement("button");
  launcher.setAttribute("aria-label", "Open support chat");
  launcher.innerHTML = bubbleIcon();
  Object.assign(launcher.style, {
    position: "fixed",
    bottom: "20px",
    [isLeft ? "left" : "right"]: "20px",
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    border: "none",
    background: color,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    zIndex: "2147483000",
    transition: "transform 0.15s ease",
  });
  launcher.onmouseenter = function () { launcher.style.transform = "scale(1.06)"; };
  launcher.onmouseleave = function () { launcher.style.transform = "scale(1)"; };

  // ── Chat panel (iframe) ──────────────────────────────────────────────
  var panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "fixed",
    bottom: "90px",
    [isLeft ? "left" : "right"]: "20px",
    width: "380px",
    maxWidth: "calc(100vw - 32px)",
    height: "600px",
    maxHeight: "calc(100vh - 140px)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
    zIndex: "2147483000",
    display: "none",
    background: "#fff",
    transformOrigin: isLeft ? "bottom left" : "bottom right",
  });

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/chat/" + encodeURIComponent(agentId) + "?embed=1";
  iframe.title = "Support chat";
  Object.assign(iframe.style, { width: "100%", height: "100%", border: "none" });
  panel.appendChild(iframe);

  function toggle() {
    open = !open;
    if (open) {
      panel.style.display = "block";
      panel.animate(
        [{ opacity: 0, transform: "scale(0.96) translateY(8px)" }, { opacity: 1, transform: "scale(1) translateY(0)" }],
        { duration: 160, easing: "ease-out" }
      );
      launcher.innerHTML = closeIcon();
    } else {
      panel.style.display = "none";
      launcher.innerHTML = bubbleIcon();
    }
  }

  launcher.addEventListener("click", toggle);

  function bubbleIcon() {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  }
  function closeIcon() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  }

  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(launcher);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  // Minimal public API in case a host page wants to open the widget programmatically.
  window.SupportAIWidget = {
    open: function () { if (!open) toggle(); },
    close: function () { if (open) toggle(); },
    toggle: toggle,
  };
})();
