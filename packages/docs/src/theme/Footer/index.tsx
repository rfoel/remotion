import { useThemeConfig } from "@docusaurus/theme-common";
import React from "react";
import FooterLayout from "./Layout";
import FooterLinks from "./Links";

const Footer = () => {
  const { footer } = useThemeConfig();

  if (!footer) {
    return null;
  }

  const { links, style } = footer;
  return (
    <FooterLayout
      style={style}
      links={links && links.length > 0 && <FooterLinks links={links} />}
    />
  );
};

export default React.memo(Footer);

// Right-click on the Remotion logo to get brand

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document
      .querySelector(".navbar__logo")
      .addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.open("https://remotion.dev/brand", "_blank");
      });
  }, 200);
});
