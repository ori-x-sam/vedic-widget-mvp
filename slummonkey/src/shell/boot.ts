// Boot: read look/*.css into tokens (and inject it), parse content/*.kdl, create the shared services.
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource/yatra-one/400.css";
import { kdlFiles, cssFiles, svgFiles } from "../core/sources";
import { Tokens } from "../core/tokens";
import { loadContent, Content } from "../core/content";

export interface Boot { tokens: Tokens; content: Content; svgs: Record<string, string> }

export function boot(): Boot {
  // inject every look/*.css (variables + HUD/controls/banners styles)
  for (const [name, css] of Object.entries(cssFiles)) {
    const s = document.createElement("style");
    s.dataset.file = name;
    s.textContent = css;
    document.head.appendChild(s);
  }
  const tokens = Tokens.fromCss(...Object.values(cssFiles));
  const content = loadContent(kdlFiles);
  if (content.errors.length) console.warn("[content]", content.errors);
  return { tokens, content, svgs: svgFiles };
}
