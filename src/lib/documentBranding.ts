const defaultTitle = "SchoolManager";
const defaultIcon = "/school-icon.svg";

function faviconElement() {
  let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }

  return icon;
}

export function setDocumentBranding(title?: string | null, iconUrl?: string | null) {
  document.title = title?.trim() || defaultTitle;
  const icon = faviconElement();
  icon.href = iconUrl?.trim() || defaultIcon;
}

export function resetDocumentBranding() {
  setDocumentBranding(defaultTitle, defaultIcon);
}
