const ALPHA_PLACEHOLDER = /[a-zA-Z]/;
const NON_DIGIT = /\D/g;

function toCanonicalPhone(phone) {
  if (phone === null || phone === undefined) {
    return null;
  }
  const text = String(phone).trim();
  if (!text) {
    return null;
  }
  if (ALPHA_PLACEHOLDER.test(text)) {
    return null;
  }
  const digits = text.replace(NON_DIGIT, '');
  if (!digits) {
    return null;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('84')) {
    return '0' + digits.slice(2);
  }
  if (digits.length === 12 && digits.startsWith('84')) {
    return digits.slice(2);
  }
  return null;
}

module.exports = { toCanonicalPhone };
