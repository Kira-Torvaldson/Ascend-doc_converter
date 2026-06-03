const ERROR_CODE_MESSAGES: Record<string, string> = {
  EMPTY_INPUT: 'Le texte source est vide.',
  INVALID_INPUT: "Le contenu source n'est pas valide pour cette conversion.",
  CONVERSION_FAILED: 'La conversion a échoué.',
  CONVERSION_TIMEOUT: 'La conversion a dépassé le délai maximal.',
  OUTPUT_NOT_CREATED: "Le résultat de conversion n'a pas pu être généré.",
  OUTPUT_INVALID: 'Le résultat de conversion est invalide.',
  OUTPUT_IS_INPUT: "Le résultat de conversion est identique à l'entrée.",
  INTERNAL_ERROR: 'Une erreur interne est survenue pendant la conversion.',
  PAYLOAD_TOO_LARGE: 'Le document dépasse la taille maximale autorisée.',
  FORMAT_UNSUPPORTED: 'Cette conversion de formats n’est pas supportée.',
  ENCODING_INVALID: 'L’encodage du fichier source est invalide.',
};

const ERROR_HINTS: Record<string, string> = {
  EMPTY_INPUT: 'Saisissez du contenu dans le panneau source.',
  INVALID_INPUT: 'Vérifiez le format et le contenu du document source.',
  PAYLOAD_TOO_LARGE: 'Réduisez la taille du document ou divisez-le en plusieurs parties.',
  FORMAT_UNSUPPORTED: 'Choisissez un format source et destination supportés par Ascend.',
  ENCODING_INVALID: 'Enregistrez le fichier en UTF-8 puis réessayez.',
  CONVERSION_TIMEOUT: 'Réessayez avec un document plus court ou simplifiez le contenu.',
  CONVERSION_FAILED: 'Modifiez la source et relancez la conversion.',
  OUTPUT_NOT_CREATED: 'Relancez la conversion ; si le problème persiste, consultez les logs.',
  OUTPUT_INVALID: 'Vérifiez la source : le résultat obtenu n’est pas un format valide.',
  OUTPUT_IS_INPUT: 'La conversion n’a pas transformé le document ; ajustez la source.',
  INTERNAL_ERROR: 'Réessayez plus tard ou contactez l’administrateur avec l’identifiant de conversion.',
};

export function getErrorMessageForCode(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  return ERROR_CODE_MESSAGES[code] ?? fallback;
}

export function getHintForCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return ERROR_HINTS[code];
}

/**
 * Message utilisateur : texte principal + indication d’action si disponible.
 * Préfère le hint backend lorsqu’il est fourni et qu’aucun hint local n’existe.
 */
export function formatConversionErrorForUi(
  code: string | undefined,
  fallback: string,
  backendHint?: string | null
): string {
  const message = getErrorMessageForCode(code, fallback);
  const hint = getHintForCode(code) || (backendHint && backendHint.trim()) || undefined;
  if (!hint) return message;
  return `${message} ${hint}`;
}
