export type NormalizeMode = "text" | "email";

export function normalizeValue(
  value: unknown = "",
  mode: NormalizeMode = "text"
): string {
  const str = String(value ?? "");

  if (mode === "text") {
    // remove acentos, deixa maiúsculo, somente letras e espaço
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z\s]/g, ""); // aceita QUALQUER whitespace

  }

  if (mode === "email") {
    // remove acentos e qualquer char inválido para email
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9@._-]/g, "") // mantém apenas caracteres válidos
      .toLowerCase()
      .trim();
  }

  return str;
}
