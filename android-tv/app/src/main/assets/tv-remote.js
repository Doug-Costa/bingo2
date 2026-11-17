/*
 * Navegação por controle remoto, injetada pelo app em todas as páginas.
 *
 * O site não tem navegação espacial própria, então este script:
 *  - move o foco com as setas para o elemento clicável mais próximo;
 *  - transforma OK em clique e abre o teclado da TV nos campos de texto;
 *  - liga as teclas numéricas do controle ao teclado virtual do PIN;
 *  - envia o sinal de vida que o app usa para detectar página travada.
 */
(function () {
  if (window.__tvRemote) return;
  window.__tvRemote = true;

  var DIRS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    Up: 'up', Down: 'down', Left: 'left', Right: 'right' };
  // WebViews antigas podem mandar key vazio/Unidentified: cai no keyCode.
  var DIR_CODES = { 38: 'up', 40: 'down', 37: 'left', 39: 'right', 19: 'up', 20: 'down', 21: 'left', 22: 'right' };
  var OK_CODES = { 13: 1, 23: 1, 66: 1 };
  var RING_IDLE_MS = 10000;

  var current = null;
  var lastRect = null;
  var propsKey = null;
  var idleTimer = null;
  var styled = false;

  function ensureStyle() {
    // Só depois da primeira interação: mexer no <head> antes da hidratação do
    // React pode gerar erro de hydration.
    if (styled) return;
    styled = true;
    var s = document.createElement('style');
    s.textContent = '[data-tv-focus]{outline:4px solid #FFD84A !important;outline-offset:2px !important;' +
      'box-shadow:0 0 0 4px #FFD84A,0 0 22px 8px rgba(255,216,74,.65) !important;}';
    document.head.appendChild(s);
  }

  function reactProps(el) {
    if (propsKey) return el[propsKey] || null;
    for (var k in el) {
      if (k.indexOf('__reactProps$') === 0) {
        propsKey = k;
        return el[k];
      }
    }
    return null;
  }

  function isTextField(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    return el.tagName === 'INPUT' && !/^(button|submit|checkbox|radio|hidden|range|color|file)$/i.test(el.type);
  }

  function isInteractive(el) {
    var tag = el.tagName;
    if (el.disabled) return false;
    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
    if (tag === 'INPUT') return el.type !== 'hidden';
    if (tag === 'A' && el.hasAttribute('href')) return true;
    if (el.getAttribute('role') === 'button') return true;
    var ti = el.getAttribute('tabindex');
    if (ti !== null && parseInt(ti, 10) >= 0) return true;
    var p = reactProps(el);
    return !!(p && typeof p.onClick === 'function');
  }

  function hasScrollableAncestor(el) {
    for (var n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      if (n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1) {
        var o = getComputedStyle(n);
        if (/(auto|scroll)/.test(o.overflowY + o.overflowX)) return true;
      }
    }
    return false;
  }

  function isUsable(el) {
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var tag = el.tagName;
    // Fundo de modal clicável ocupa a tela toda: não é um alvo de navegação.
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && r.width * r.height > vw * vh * 0.6) return false;

    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.pointerEvents === 'none') return false;
    // Mostrador dos dígitos do PIN só devolve o foco ao input oculto.
    if (cs.cursor === 'text' && !isTextField(el)) return false;
    for (var n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (parseFloat(getComputedStyle(n).opacity) < 0.02) return false;
    }

    var outside = r.right <= 0 || r.bottom <= 0 || r.left >= vw || r.top >= vh;
    if (outside) return hasScrollableAncestor(el);

    // Descarta o que está coberto por modal/overlay.
    var cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2));
    var cy = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
    var stack = document.elementsFromPoint(cx, cy);
    for (var i = 0; i < stack.length; i++) {
      var hit = stack[i];
      if (hit === el || el.contains(hit) || hit.contains(el)) return true;
      if (!isEmptyLayer(hit)) return false;
    }
    return true;
  }

  // Camada vazia e transparente não cobre nada visualmente, mesmo acima do alvo
  // (a tela de sorteio tem uma assim sobre o botão de som).
  function isEmptyLayer(el) {
    if (el.children.length || el.textContent) return false;
    var c = getComputedStyle(el);
    return c.backgroundImage === 'none' && /(transparent|, 0\))$/.test(c.backgroundColor);
  }

  function candidates() {
    var all = document.querySelectorAll('*');
    var found = [];
    var i;
    for (i = 0; i < all.length; i++) {
      if (isInteractive(all[i]) && isUsable(all[i])) found.push(all[i]);
    }
    // Wrapper clicável em volta de um botão: fica só o botão.
    return found.filter(function (el) {
      return !found.some(function (other) {
        return other !== el && el.contains(other);
      });
    });
  }

  function currentValid() {
    return current && document.contains(current) && !current.disabled && isUsable(current) ? current : null;
  }

  function clearRing() {
    var marked = document.querySelectorAll('[data-tv-focus]');
    for (var i = 0; i < marked.length; i++) marked[i].removeAttribute('data-tv-focus');
  }

  function setFocus(el) {
    ensureStyle();
    clearRing();
    current = el;
    el.setAttribute('data-tv-focus', '');
    if (!el.hasAttribute('tabindex') && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(el.tagName)) {
      el.setAttribute('tabindex', '-1');
    }
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      el.focus();
    }
    try {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } catch (e) {
      el.scrollIntoView(false);
    }
    lastRect = el.getBoundingClientRect();
    armIdle();
  }

  // Na tela do jogo o anel de foco não pode ficar parado sobre a transmissão.
  function armIdle() {
    clearTimeout(idleTimer);
    if (/^\/(config|pin)/.test(location.pathname)) return;
    idleTimer = setTimeout(function () {
      clearRing();
      if (current && current.blur) current.blur();
      current = null;
    }, RING_IDLE_MS);
  }

  function score(from, to, dir) {
    var fcx = from.left + from.width / 2;
    var fcy = from.top + from.height / 2;
    var tcx = to.left + to.width / 2;
    var tcy = to.top + to.height / 2;
    var primary;
    var orthGap;
    var orthCenter;
    if (dir === 'left' || dir === 'right') {
      if (dir === 'right' ? tcx <= fcx : tcx >= fcx) return null;
      primary = dir === 'right' ? to.left - from.right : from.left - to.right;
      orthGap = Math.max(0, to.top - from.bottom, from.top - to.bottom);
      orthCenter = Math.abs(tcy - fcy);
    } else {
      if (dir === 'down' ? tcy <= fcy : tcy >= fcy) return null;
      primary = dir === 'down' ? to.top - from.bottom : from.top - to.bottom;
      orthGap = Math.max(0, to.left - from.right, from.left - to.right);
      orthCenter = Math.abs(tcx - fcx);
    }
    return Math.max(0, primary) + orthGap * 4 + orthCenter * 0.3;
  }

  function nearestTo(rect, list) {
    var best = null;
    var bestD = Infinity;
    list.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var dx = r.left + r.width / 2 - (rect.left + rect.width / 2);
      var dy = r.top + r.height / 2 - (rect.top + rect.height / 2);
      var d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = el;
      }
    });
    return best;
  }

  /** Coloca o foco num ponto de partida: o atual, o mais próximo do último, ou o 1º botão. */
  function restore() {
    if (currentValid()) {
      setFocus(current);
      return true;
    }
    var list = candidates();
    if (!list.length) return false;
    // Respeita o foco automático que a própria página já colocou.
    if (list.indexOf(document.activeElement) !== -1) {
      setFocus(document.activeElement);
      return true;
    }
    var firstButton = list.filter(function (el) {
      return el.tagName === 'BUTTON';
    })[0];
    setFocus((lastRect && nearestTo(lastRect, list)) || firstButton || list[0]);
    return true;
  }

  function scrollBy(dir) {
    if (!current || (dir !== 'up' && dir !== 'down')) return;
    for (var n = current.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      if (n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) {
        n.scrollTop += dir === 'down' ? 160 : -160;
        return;
      }
    }
  }

  function move(dir) {
    var cur = currentValid();
    if (!cur) {
      // Na 1ª tecla a tela pode ainda estar revelando o seletor de idioma.
      if (!restore()) {
        setTimeout(restore, 120);
      }
      return;
    }
    var from = cur.getBoundingClientRect();
    var best = null;
    var bestScore = Infinity;
    candidates().forEach(function (el) {
      if (el === cur) return;
      var s = score(from, el.getBoundingClientRect(), dir);
      if (s !== null && s < bestScore) {
        bestScore = s;
        best = el;
      }
    });
    if (best) setFocus(best);
    else scrollBy(dir);
    armIdle();
  }

  function pressVirtualKey(label) {
    var buttons = document.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (!b.disabled && b.textContent.trim() === label && isUsable(b)) {
        b.click();
        return;
      }
    }
  }

  function digitFrom(e) {
    if (e.key && e.key.length === 1 && e.key >= '0' && e.key <= '9') return e.key;
    var c = e.keyCode;
    if (c >= 48 && c <= 57) return String(c - 48);
    if (c >= 96 && c <= 105) return String(c - 96);
    return null;
  }

  function isHidden(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    return !isUsable(el);
  }

  function onKeyDown(e) {
    var unknown = !e.key || e.key === 'Unidentified';
    var dir = DIRS[e.key] || (unknown ? DIR_CODES[e.keyCode] : null);
    var ok = e.key === 'Enter' || (unknown && OK_CODES[e.keyCode]);
    var editing = isTextField(current) && document.activeElement === current;

    // Foco preso num input invisível (input do PIN): a página não pode reagir.
    if ((dir || ok) && isHidden(e.target) && isTextField(e.target)) e.stopPropagation();

    if (dir) {
      // Dentro de um texto, esquerda/direita andam com o cursor até a borda.
      if (editing && (dir === 'left' || dir === 'right')) {
        var atStart = current.selectionStart === 0;
        var atEnd = current.selectionEnd === current.value.length;
        if (dir === 'left' ? !atStart : !atEnd) return;
      }
      e.preventDefault();
      move(dir);
      return;
    }

    if (ok) {
      var el = currentValid();
      if (!el) {
        e.preventDefault();
        if (!restore()) setTimeout(restore, 120);
        return;
      }
      armIdle();
      if (isTextField(el)) {
        // OK do controle abre o teclado da TV. O "concluir" do próprio teclado
        // (showKeyboard devolve false) segue para a página e envia o formulário.
        if (window.TvBridge && window.TvBridge.showKeyboard()) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      var props = reactProps(el);
      // Elemento custom que já trata Enter: não clicar duas vezes.
      if (el.tagName !== 'BUTTON' && props && typeof props.onKeyDown === 'function') return;
      e.preventDefault();
      if (!e.repeat) el.click();
      return;
    }

    if (editing) return;

    var digit = digitFrom(e);
    if (digit !== null) {
      e.preventDefault();
      pressVirtualKey(digit);
    } else if (e.key === 'Backspace' || e.keyCode === 8) {
      e.preventDefault();
      pressVirtualKey('⌫');
    }
  }

  function onFocusIn(e) {
    var t = e.target;
    if (t === current) return;
    if (isHidden(t)) {
      // A tela do PIN devolve o foco ao input oculto, que o controle não enxerga.
      setTimeout(function () {
        if (document.activeElement === t) restore();
      }, 0);
    } else if (isInteractive(t)) {
      setFocus(t);
    }
  }

  window.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('focusin', onFocusIn, true);

  // Na tela do PIN o foco precisa estar sempre visível: o palco nasce oculto até
  // medir a tela, e um botão focado pode ficar desabilitado (Limpar, ⌫).
  setInterval(function () {
    if (/^\/(config|pin)/.test(location.pathname) && !currentValid()) restore();
  }, 400);

  function beat() {
    if (window.TvBridge) window.TvBridge.beat();
  }
  beat();
  setInterval(beat, 10000);
})();
