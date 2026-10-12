/**
 * Sanitizes math expressions: converts written words to proper math symbols,
 * wraps mathematical equations in LaTeX notation ($...$ and $$...$$),
 * and converts Arabic/Eastern digits in math contexts to Western digits.
 */
export function sanitizeMathText(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Math words to symbols (in mathematical context)
  res = res.replace(/أكبر من أو يساوي/g, '≥');
  res = res.replace(/أصغر من أو يساوي/g, '≤');
  res = res.replace(/أكبر من/g, '>');
  res = res.replace(/أصغر من/g, '<');
  res = res.replace(/لا يساوي/g, '≠');
  res = res.replace(/موجب أو سالب/g, '±');
  res = res.replace(/يساوي أو يكافئ/g, '=');

  // English counterparts if written as words
  res = res.replace(/\bgreater than or equal to\b/gi, '≥');
  res = res.replace(/\bless than or equal to\b/gi, '≤');
  res = res.replace(/\bgreater than\b/gi, '>');
  res = res.replace(/\bless than\b/gi, '<');
  res = res.replace(/\bnot equal to\b/gi, '≠');
  res = res.replace(/\bplus or minus\b/gi, '±');

  // 2. Convert eastern digits inside math blocks $...$ or $$...$$ to western digits
  res = res.replace(/\$([^\$]+)\$/g, (_match, formula) => {
    const westernFormula = formula.replace(/[٠-٩]/g, (d: string) => 
      String.fromCharCode(d.charCodeAt(0) - 1632 + 48)
    );
    return `$${westernFormula}$`;
  });

  return res;
}
