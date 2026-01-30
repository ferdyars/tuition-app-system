export function censorPhone(phone: string): string {
  if (!phone) return "";

  // remove non-digits but keep +
  const cleaned = phone.replace(/(?!^\+)\D/g, "");

  if (cleaned.length <= 6) return "***";

  const start = cleaned.slice(0, 2);
  const end = cleaned.slice(-2);
  const masked = "*".repeat(cleaned.length - 4);

  return `${start}${masked}${end}`;
}

export function censorName(name: string): string {
  if (!name) return "";

  return name
    .split(" ")
    .map((word) => {
      if (word.length <= 1) return "*";
      return word[0] + "*".repeat(word.length - 1);
    })
    .join(" ");
}

export function censorIdentityNumber(id: string): string {
  if (!id) return "";

  const cleaned = id.replace(/\s|-/g, "");
  const length = cleaned.length;

  if (length <= 6) return "*".repeat(length);

  const start = cleaned.slice(0, 4);
  const end = cleaned.slice(-4);
  const masked = "*".repeat(length - 8);

  return `${start}${masked}${end}`;
}
