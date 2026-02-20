'use strict';

class Calculator {
  constructor() {
    this.current    = '0';   // string shown on display
    this.previous   = '';    // left operand (string)
    this.operator   = null;  // pending operator key
    this.resetNext  = false; // next digit press replaces display
    this.justCalc   = false; // just pressed =

    this.$cur  = document.getElementById('current-operand');
    this.$expr = document.getElementById('expression-line');
    this.$clr  = document.getElementById('btn-clear');

    this._bindButtons();
    this._bindKeyboard();
    this._render();
  }

  /* ── INPUT ──────────────────────────────── */

  digit(d) {
    if (d === '.' && this.current.includes('.')) return;

    if (this.resetNext) {
      this.current  = d === '.' ? '0.' : d;
      this.resetNext = false;
      this.justCalc  = false;
    } else {
      // Count only numeric chars (ignore sign & decimal) for cap
      const sigDigits = this.current.replace(/[^0-9]/g, '');
      if (sigDigits.length >= 12 && d !== '.') return;

      if (this.current === '0' && d !== '.') this.current = d;
      else this.current += d;
      this.justCalc = false;
    }

    this._updateClearBtn();
    this._render();
  }

  setOperator(op) {
    // Chain without losing pending operation
    if (this.operator && !this.resetNext) this._compute(true);

    this.operator  = op;
    this.previous  = this.current;
    this.resetNext = true;
    this.justCalc  = false;

    this._highlightOp(op);
    this._updateClearBtn();
    this._render();
  }

  calculate() {
    if (!this.operator || this.previous === '') return;
    const snap = `${this._display(this.previous)} ${this._sym(this.operator)} ${this._display(this.current)} =`;
    this._compute(false);
    // Write completed expression to context line
    this.$expr.textContent = snap;
  }

  negate() {
    if (this.current === '0' || this.current === 'Error') return;
    this.current   = this.current.startsWith('-') ? this.current.slice(1) : '-' + this.current;
    // User actively edited the value — don't wipe on next digit
    this.resetNext = false;
    this.justCalc  = false;
    this._render();
  }

  percent() {
    const n = parseFloat(this.current);
    if (isNaN(n)) return;

    let result;
    if (this.operator && this.previous !== '') {
      // percentage-of: 200 × 15% → 30
      result = parseFloat(this.previous) * n / 100;
      // Show expression context before committing
      this.$expr.textContent = `${this._display(this.previous)} ${this._sym(this.operator)} ${this._display(this.current)} %`;
    } else {
      // solo: 5% → 0.05
      result = n / 100;
      this.$expr.textContent = `${this._display(this.current)} % =`;
    }

    this.current   = String(this._fmt(result));
    this.resetNext = false;
    this.justCalc  = false;
    this._render();
  }

  clear() {
    const isClean = this.current === '0' && !this.operator && this.previous === '';

    if (isClean || this.$clr.classList.contains('is-ac')) {
      // AC — full reset
      this.current   = '0';
      this.previous  = '';
      this.operator  = null;
      this.resetNext = false;
      this.justCalc  = false;
      this._clearHighlights();
      this.$expr.textContent = '\u00a0';
    } else if (this.current === '0' && this.operator) {
      // C while current is 0 but op pending → full reset
      this.current   = '0';
      this.previous  = '';
      this.operator  = null;
      this.resetNext = false;
      this.justCalc  = false;
      this._clearHighlights();
      this.$expr.textContent = '\u00a0';
    } else {
      // C — clear current entry only
      this.current   = '0';
      this.resetNext = false;
    }

    this._updateClearBtn();
    this._render();
  }

  delete() {
    // Allow DEL even after = — clears justCalc flag
    if (this.justCalc) {
      this.justCalc  = false;
      this.resetNext = false;
    }
    if (this.resetNext) return;

    if (this.current === 'Error') { this.current = '0'; }
    else if (this.current.length <= 1 || (this.current.length === 2 && this.current.startsWith('-'))) {
      this.current = '0';
    } else {
      this.current = this.current.slice(0, -1);
    }

    this._updateClearBtn();
    this._render();
  }

  /* ── COMPUTE ────────────────────────────── */

  _compute(chaining) {
    const a = parseFloat(this.previous);
    const b = parseFloat(this.current);
    if (isNaN(a) || isNaN(b)) return;

    let result;
    switch (this.operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/':
        if (b === 0) {
          this.current = 'Error'; this.previous = ''; this.operator = null;
          this.resetNext = true; this._clearHighlights(); this._render(); return;
        }
        result = a / b; break;
      case '%': result = a % b; break;
      default: return;
    }

    const formatted = String(this._fmt(result));

    if (!chaining) {
      this.operator  = null;
      this.previous  = '';
      this.justCalc  = true;
      this.resetNext = true;
      this._clearHighlights();
      this._animatePop();
    } else {
      this.previous = formatted;
    }

    this.current = formatted;
    this._updateClearBtn();
    this._render();
  }

  /* ── FORMAT ─────────────────────────────── */

  _fmt(n) {
    if (!isFinite(n)) return 'Error';
    const r = parseFloat(n.toPrecision(12));
    if (Math.abs(r) >= 1e13 || (r !== 0 && Math.abs(r) < 1e-7)) {
      return r.toExponential(5).replace(/\.?0+e/, 'e');
    }
    return Number.isInteger(r) ? r : r;
  }

  // Format a raw number string for display with thousands separators
  _display(raw) {
    if (raw === 'Error' || raw === '') return raw;
    const n = parseFloat(raw);
    if (isNaN(n)) return raw;
    // Use locale formatting but strip trailing zeros after decimal
    try {
      return n.toLocaleString('en-US', { maximumFractionDigits: 10 });
    } catch { return raw; }
  }

  /* ── RENDER ─────────────────────────────── */

  _render() {
    const raw = this.current;
    const isError = raw === 'Error';

    // Display with thousands separator
    const formatted = isError ? raw : this._display(raw);

    // Font tier by character count
    const len = formatted.replace(/[^0-9.Ee+\-]/g, '').length + (formatted.match(/,/g)||[]).length;
    this.$cur.className = 'current-operand';
    if (isError)       this.$cur.classList.add('error');
    else if (len > 17) this.$cur.classList.add('sz-2xs');
    else if (len > 14) this.$cur.classList.add('sz-xs');
    else if (len > 11) this.$cur.classList.add('sz-sm');
    else if (len > 8)  this.$cur.classList.add('sz-md');

    this.$cur.textContent = formatted;

    // Expression line — show pending op context only (not a transformed current)
    if (this.operator && this.previous && !this.justCalc) {
      this.$expr.textContent = `${this._display(this.previous)} ${this._sym(this.operator)}`;
    } else if (!this.justCalc) {
      this.$expr.textContent = '\u00a0';
    }
    // If justCalc, expression line was already written by calculate() / compute()
  }

  _animatePop() {
    this.$cur.classList.remove('popping');
    void this.$cur.offsetWidth;
    this.$cur.classList.add('popping');
    this.$cur.addEventListener('animationend', () => this.$cur.classList.remove('popping'), { once: true });
  }

  _sym(op) {
    return { '+': '+', '-': '−', '*': '×', '/': '÷', '%': '%' }[op] || op;
  }

  _highlightOp(op) {
    this._clearHighlights();
    document.querySelectorAll('.btn-op').forEach(b => {
      if (b.dataset.key === op) b.classList.add('active');
    });
  }

  _clearHighlights() {
    document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active'));
  }

  // C when clean state = AC, otherwise C
  _updateClearBtn() {
    const clean = this.current === '0' && !this.operator && this.previous === '';
    this.$clr.textContent = clean ? 'AC' : 'C';
    this.$clr.classList.toggle('is-ac', clean);
  }

  /* ── EVENTS ─────────────────────────────── */

  _bindButtons() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this._ripple(btn, e);
        const { key, action } = btn.dataset;
        if (key !== undefined) {
          if ('0123456789.'.includes(key)) this.digit(key);
          else this.setOperator(key);
        } else {
          switch (action) {
            case 'clear':     this.clear();     break;
            case 'delete':    this.delete();    break;
            case 'calculate': this.calculate(); break;
            case 'negate':    this.negate();    break;
            case 'percent':   this.percent();   break;
          }
        }
      });
    });
  }

  _bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ('0123456789.'.includes(e.key))        this.digit(e.key);
      else if (['+','-','*','/','%'].includes(e.key)) this.setOperator(e.key);
      else if (e.key === 'Enter' || e.key === '=')    this.calculate();
      else if (e.key === 'Backspace')                  this.delete();
      else if (e.key === 'Escape')                     this.clear();
    });
  }

  _ripple(btn, e) {
    const r    = document.createElement('span');
    r.classList.add('ripple');
    const rect = btn.getBoundingClientRect();
    const sz   = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-rect.left-sz/2}px;top:${e.clientY-rect.top-sz/2}px`;
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }
}

document.addEventListener('DOMContentLoaded', () => new Calculator());
