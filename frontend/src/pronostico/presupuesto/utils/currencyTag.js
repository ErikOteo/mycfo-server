export const CURRENCY_OPTIONS = ["ARS", "USD"];

const TAG_REGEX = /^\s*\[(ARS|USD)\]\s*/i;

export const stripCurrencyTag = (name = "") =>
  String(name || "").replace(TAG_REGEX, "").trim();

export const currencyTag = (currency = "ARS") =>
  currency === "USD" ? "[USD]" : "[ARS]";

export const withCurrencyTag = (name = "", currency = "ARS") => {
  const clean = stripCurrencyTag(name);
  const tag = currencyTag(currency);
  return clean ? `${tag} ${clean}` : tag;
};

export const detectCurrencyFromName = (name = "") => {
  const m = String(name || "").match(/^\s*\[(ARS|USD)\]/i);
  return m ? m[1].toUpperCase() : "ARS";
};

// ARS incluye legacy sin prefijo
export const matchesCurrencyFilter = (name = "", currency = "ARS") => {
  const raw = String(name || "");
  const hasTag = /^\s*\[(ARS|USD)\]/i.test(raw);
  const detected = detectCurrencyFromName(raw);
  if (currency === "USD") return detected === "USD";
  if (!hasTag) return true;
  return detected === "ARS";
};
