var _ = require("lodash");

function getInvoiceID(string) {
  const regexV4V = /(v4v-.....)/gm;
  const regexKCS = /kcs-[^\s]*/gm;
  let v4v = null;
  let kcs = null;
  let m;
  while ((m = regexV4V.exec(string)) !== null) {
    if (m.index === regexV4V.lastIndex) {
      regexV4V.lastIndex++;
    }
    m.forEach((match, groupIndex) => {
      v4v = match;
    });
  }
  while ((n = regexKCS.exec(string)) !== null) {
    if (n.index === regexKCS.lastIndex) {
      regexKCS.lastIndex++;
    }
    n.forEach((match, groupIndex) => {
      kcs = match;
    });
  }
  kcs = _.trim(kcs, '(')
  kcs = _.trim(kcs, ')')
  return v4v !== null ? v4v : kcs !== null ? kcs : null;
}

exports.getInvoiceID = getInvoiceID;

// function main() {
//   // const string = "You claimed back 50.00 % of payment (kcs-yGfG-yyG2-LysR Pollo a la broster y bebidas ) & adding review of a Oliva's Self Service - https://peakd.com/@edtest/ymcshzpx"
//   const string = `Invoice: kcs-yGfG-yyG2-LysR Pollo a la broster y
// bebidas`;
//   console.log(getInvoiceID(string))
// }
// main();