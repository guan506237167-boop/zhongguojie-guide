import { readFile } from "node:fs/promises";

const home = await readFile("dist/index.html", "utf8");
const tutorial = await readFile("dist/chinese-knot-tutorial/index.html", "utf8");
const meaning = await readFile("dist/chinese-knot-meaning/index.html", "utf8");
const types = await readFile("dist/types-of-chinese-knots/index.html", "utf8");

assert(home.includes("Chinese Knot Guide"), "Home should contain site brand");
assert(home.includes("Find your first Chinese knot path"), "Home should contain tutorial finder");
assert(tutorial.includes("Chinese Knot Tutorial"), "Tutorial page should render");
assert(meaning.includes("Chinese Knot Meaning"), "Meaning page should render");
assert(types.includes("Chinese knot type table"), "Types page should contain the comparison table");

assert(searchTarget("how to tie chinese knot") === "/chinese-knot-tutorial/", "Tutorial search should route correctly");
assert(searchTarget("endless knot meaning") === "/endless-knot-meaning/", "Endless knot search should route correctly");
assert(searchTarget("pan chang knot") === "/pan-chang-knot/", "Pan Chang search should route correctly");
assert(searchTarget("chinese knot cord") === "/chinese-knot-cord/", "Cord search should route correctly");
assert(searchTarget("chinese knot bracelet") === "/chinese-knot-bracelet/", "Bracelet search should route correctly");

console.log("Chinese knot tool logic tests passed.");

function searchTarget(raw) {
  const q = String(raw || "").trim().toLowerCase();
  const knots = [
    { slug: "good-luck-knot", name: "good luck knot", keywords: ["chinese lucky knot", "chinese good luck knot", "good luck knot"] },
    { slug: "button-knot", name: "button knot", keywords: ["button knot", "chinese button knot", "chinese button knot tutorial"] },
    { slug: "pan-chang-knot", name: "pan chang knot", keywords: ["pan chang knot", "pan chang knot meaning", "pan chang knot tutorial"] },
    { slug: "double-coin-knot", name: "double coin knot", keywords: ["double coin knot"] },
    { slug: "endless-knot", name: "endless knot", keywords: ["endless knot meaning"] },
    { slug: "bracelet-knot", name: "bracelet knot", keywords: ["chinese knot bracelet", "chinese knot bracelet tutorial"] }
  ];
  const rules = [
    { pattern: /bracelet/, path: "/chinese-knot-bracelet/" },
    { pattern: /keychain/, path: "/chinese-knot-keychain/" },
    { pattern: /cord|string|supply|material/, path: "/chinese-knot-cord/" },
    { pattern: /tutorial|how to|tie|step/, path: "/chinese-knot-tutorial/" },
    { pattern: /endless/, path: "/endless-knot-meaning/" },
    { pattern: /pan chang/, path: "/pan-chang-knot/" },
    { pattern: /button/, path: "/chinese-button-knot/" },
    { pattern: /meaning|symbol|color|luck/, path: "/chinese-knot-meaning/" },
    { pattern: /type|double coin/, path: "/types-of-chinese-knots/" }
  ];
  const hit = rules.find((rule) => rule.pattern.test(q));
  if (hit) return hit.path;
  const found = knots.find((item) => q.includes(item.name) || item.keywords.some((keyword) => q.includes(keyword) || keyword.includes(q)));
  return found ? `/knots/${found.slug}/` : "/guides/";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
