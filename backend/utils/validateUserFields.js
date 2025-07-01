// Validiert Username, E-Mail und Passwort nach den gewünschten Regeln
export function validateUserFields(
  { username, email, password },
  { checkPassword = true } = {}
) {
  if (!username || !email || (checkPassword && !password)) {
    return { valid: false, message: "Bitte füllen Sie alle Felder aus." };
  }

  // Passwort-Validierung nur, wenn gewünscht (z.B. bei Update optional)
  if (checkPassword && password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return {
        valid: false,
        message:
          "Das Passwort muss mindestens 8 Zeichen lang sein und Großbuchstaben, Kleinbuchstaben, eine Zahl sowie ein Sonderzeichen enthalten.",
      };
    }
  }

  return { valid: true };
}
