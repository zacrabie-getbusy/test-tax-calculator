function fmt(n) {
  return '$' + Math.round(n).toLocaleString('en-AU');
}

function calcIncomeTax(income) {
  if (income <= 18200) return 0;
  if (income <= 45000) return (income - 18200) * 0.19;
  if (income <= 120000) return 5092 + (income - 45000) * 0.325;
  if (income <= 180000) return 29467 + (income - 120000) * 0.37;
  return 51667 + (income - 180000) * 0.45;
}

function getLITO(income) {
  if (income <= 37500) return 700;
  if (income <= 45000) return 700 - (income - 37500) * 0.05;
  if (income <= 66667) return 325 - (income - 45000) * 0.015;
  return 0;
}

function getMedicare(income) {
  if (income < 26000) return 0;
  if (income < 32500) return (income - 26000) * 0.1;
  return income * 0.02;
}

function update() {
  const income = parseFloat(document.getElementById('income').value);
  const withheld = parseFloat(document.getElementById('withheld').value) || 0;

  if (!income || income < 0) {
    document.getElementById('results').style.display = 'none';
    return;
  }

  const rawTax = calcIncomeTax(income);
  const lito = getLITO(income);
  const incomeTax = Math.max(0, rawTax - lito);
  const medicare = getMedicare(income);
  const total = incomeTax + medicare;
  const rate = ((total / income) * 100).toFixed(1);
  const takeHome = income - total;

  document.getElementById('tax-out').textContent = fmt(incomeTax);
  document.getElementById('medicare-out').textContent = fmt(medicare);
  document.getElementById('total-out').textContent = fmt(total);
  document.getElementById('rate-out').textContent = rate + '%';

  const card = document.getElementById('refund-card');
  const lbl = document.getElementById('refund-label');
  const val = document.getElementById('refund-value');
  const note = document.getElementById('refund-note');

  card.className = 'refund-card';

  if (withheld > 0) {
    const diff = withheld - total;
    if (diff >= 0) {
      card.classList.add('positive');
      lbl.textContent = 'Estimated refund';
      val.textContent = fmt(diff);
      note.textContent = 'You overpaid PAYG — you should get this back at tax time.';
    } else {
      card.classList.add('negative');
      lbl.textContent = 'Estimated tax owing';
      val.textContent = fmt(Math.abs(diff));
      note.textContent = 'You underpaid PAYG — you may owe this at tax time.';
    }
  } else {
    lbl.textContent = 'Take-home pay';
    val.textContent = fmt(takeHome);
    note.textContent = 'Add PAYG withheld above to see your refund or bill estimate.';
  }

  const brackets = [
    { label: '$0 – $18,200', rate: '0%', min: 0, max: 18200, r: 0 },
    { label: '$18,201 – $45,000', rate: '19%', min: 18201, max: 45000, r: 0.19 },
    { label: '$45,001 – $120,000', rate: '32.5%', min: 45001, max: 120000, r: 0.325 },
    { label: '$120,001 – $180,000', rate: '37%', min: 120001, max: 180000, r: 0.37 },
    { label: '$180,001+', rate: '45%', min: 180001, max: Infinity, r: 0.45 },
  ];

  const active = brackets.filter(b => income >= b.min);
  const maxTaxInBracket = Math.max(...active.map(b => {
    const top = b.max === Infinity ? income : Math.min(income, b.max);
    return Math.max(0, (top - b.min + 1) * b.r);
  }));

  const html = active.map(b => {
    const top = b.max === Infinity ? income : Math.min(income, b.max);
    const taxable = top - b.min + (b.min > 0 ? 1 : 0);
    const taxHere = Math.max(0, taxable * b.r);
    const pct = maxTaxInBracket > 0 ? (taxHere / maxTaxInBracket * 100).toFixed(1) : 0;
    return `<div class="bracket-row">
      <div>
        <span class="bracket-range">${b.label} · ${b.rate}</span>
        <div class="bar-wrap"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="bracket-tax">${fmt(taxHere)}</span>
    </div>`;
  }).join('');

  document.getElementById('bracket-breakdown').innerHTML = html;
  document.getElementById('results').style.display = 'block';
}

document.getElementById('income').addEventListener('input', update);
document.getElementById('withheld').addEventListener('input', update);
