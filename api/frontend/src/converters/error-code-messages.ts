const ERROR_CODE_MESSAGES: Record<string, string> = {
  EMPTY_INPUT: 'Le texte source est vide.',
  INVALID_INPUT: "Le contenu source n'est pas valide pour cette conversion.",
  CONVERSION_FAILED: 'La conversion a échoué.',
  OUTPUT_NOT_CREATED: "Le résultat de conversion n'a pas pu être généré.",
  OUTPUT_INVALID: 'Le résultat de conversion est invalide.',
  OUTPUT_IS_INPUT: "Le résultat de conversion est identique à l'entrée.",
  INTERNAL_ERROR: 'Une erreur interne est survenue pendant la conversion.',
};

export function getErrorMessageForCode(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  return ERROR_CODE_MESSAGES[code] ?? fallback;
}
