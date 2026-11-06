// PulsoMX · código compartido por todas las páginas.
(function () {
    'use strict';

    var FUNCIONES = 'https://meiwuluwrdjszxeyoqtt.supabase.co/functions/v1/';
    var CLAVE_PASE = 'pulso_pase';

    // ---------- Texto seguro ----------
    function esc(t) {
        return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    // Quita etiquetas sin ejecutar nada (DOMParser no carga imágenes ni scripts).
    function soloTexto(html) {
        try { return new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent || ''; }
        catch (e) { return String(html || ''); }
    }
    // Solo enlaces/imágenes http(s).
    function urlSegura(u) {
        try { var x = new URL(String(u || ''), location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; }
        catch (e) { return ''; }
    }
    function idValido(id) { return /^n-[0-9a-f]{12}$/.test(String(id || '')); }
    function fechaBonita(f) {
        var d = new Date(String(f || '') + 'T12:00:00');
        if (isNaN(d)) return esc(f);
        return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // ---------- Pase de NetGamer ----------
    // NetGamer abre PulsoMX con #pase=... ; se guarda aquí y se quita de la barra
    // de direcciones (así no queda en el historial ni se comparte por error).
    (function tomarPaseDeLaUrl() {
        var m = location.hash.match(/(?:^#|&)pase=([^&]+)/);
        if (!m) return;
        try { localStorage.setItem(CLAVE_PASE, decodeURIComponent(m[1])); } catch (e) {}
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    })();
    function pase() {
        var p = null;
        try { p = localStorage.getItem(CLAVE_PASE); } catch (e) {}
        if (!p) return null;
        try { // Si ya venció, se borra.
            var datos = JSON.parse(atob(p.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
            if (!datos.e || datos.e * 1000 < Date.now()) { localStorage.removeItem(CLAVE_PASE); return null; }
        } catch (e) { return null; }
        return p;
    }
    function llamarRecompensa(accion, newsId) {
        return fetch(FUNCIONES + 'recompensar-noticia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: accion, pase: pase(), newsId: newsId })
        }).then(function (r) { return r.json(); });
    }

    // ---------- Noticias ----------
    function cargarNoticias() {
        return fetch('data/noticias.json?v=' + Math.floor(Date.now() / 300000))
            .then(function (r) { if (!r.ok) throw new Error('sin noticias'); return r.json(); })
            .then(function (lista) { return (Array.isArray(lista) ? lista : []).filter(function (n) { return n && idValido(n.id) && n.titulo; }); });
    }
    function imagenDe(n) { return urlSegura(n.imagen) || 'https://picsum.photos/seed/pulsomx/800/500'; }
    // Las noticias viejas no traen sección: eran todas de México.
    function seccionDe(n) { return n.seccion === 'mundo' ? 'mundo' : 'mexico'; }
    function etiquetaDe(n) {
        var r = String(n.region || '').trim();
        if (r) return r;
        return seccionDe(n) === 'mundo' ? 'Mundo' : 'México';
    }

    // ---------- Anuncios ----------
    // Cada anuncio va en su propio marco. Adsterra necesita cookies y
    // almacenamiento para servir anuncios, y eso solo funciona con
    // allow-same-origin. El marco sigue evitando que el anuncio escriba
    // sobre la página o la mande a otro sitio sin que el lector haga clic.
    // (Lo más que podría leer es el pase de NetGamer, que solo acredita
    // NetCoins a su propio dueño.)
    var SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation';
    function marcoAnuncio(html, css) {
        var f = document.createElement('iframe');
        f.title = 'Publicidad';
        f.setAttribute('sandbox', SANDBOX);
        f.setAttribute('scrolling', 'no');
        f.setAttribute('loading', 'lazy');
        f.style.cssText = 'border:none;' + css;
        f.srcdoc = html;
        return f;
    }
    // Códigos de la cuenta de Adsterra de PulsoMX (noviembre 2026).
    var ADSTERRA = 'https://bicea.org/';
    var BANNERS = {
        '728': { clave: '44e137e6d33aa4280151f43fd00f1752', ancho: 728, alto: 90 },
        '320': { clave: 'def4ddf591b20ecedd81f6c879ee3af9', ancho: 320, alto: 50 },
        '300': { clave: 'a9224cfe05c2fd433ca41cf91284b6e0', ancho: 300, alto: 250 }
    };
    var NATIVO = '218cf3d0291e7fe915744383c963ba2f';
    var SOCIAL_BAR = '4812bf929af118cdeb835f7c0e523b6b';

    function banner(b) {
        return marcoAnuncio(
            "<html><body style='margin:0;overflow:hidden;'><script>atOptions={'key':'" + b.clave + "','format':'iframe','height':" + b.alto + ",'width':" + b.ancho + ",'params':{}};<\/script><script src='" + ADSTERRA + "22/" + b.clave + "'><\/script></body></html>",
            'width:' + b.ancho + 'px;height:' + b.alto + 'px;max-width:100%;');
    }
    function ponerAnuncios() {
        document.querySelectorAll('[data-anuncio]').forEach(function (slot) {
            var tipo = slot.getAttribute('data-anuncio');
            if (BANNERS[tipo]) slot.appendChild(banner(BANNERS[tipo]));
            else if (tipo === 'nativo') slot.appendChild(marcoAnuncio(
                "<html><body style='margin:0;'><script async data-cfasync='false' src='" + ADSTERRA + "21/" + NATIVO + "'><\/script><div id='container-" + NATIVO + "'></div></body></html>",
                'width:100%;height:260px;'));
        });
        // Social Bar: solo en las páginas que lo piden (<body data-social-bar>).
        // Necesita estar en la página misma (no en un marco) para poder mostrarse.
        if (document.body.hasAttribute('data-social-bar')) {
            var s = document.createElement('script');
            s.src = ADSTERRA + '14/' + SOCIAL_BAR;
            s.setAttribute('data-cfasync', 'false');
            s.async = true;
            document.body.appendChild(s);
        }
    }

    // ---------- Bloqueador de anuncios / VPN ----------
    // Solo se revisa la VPN a quien viene de NetGamer (es quien cobra NC).
    function avisoBloqueo(tipo) {
        var caja = document.getElementById('bloqueo');
        if (!caja) return;
        var adb = tipo === 'adblock';
        caja.querySelector('.bq-icono').textContent = adb ? '🚫' : '🔒';
        caja.querySelector('.bq-titulo').textContent = adb ? 'Bloqueador de anuncios detectado' : 'VPN o proxy detectado';
        caja.querySelector('.bq-texto').textContent = adb
            ? 'PulsoMX se mantiene gracias a los anuncios. Desactiva tu bloqueador para este sitio y vuelve a intentar.'
            : 'Para proteger las recompensas de NetGamer no se permite usar VPN, proxy o Tor. Desconéctalo y vuelve a intentar.';
        caja.classList.add('activo');
        document.body.style.overflow = 'hidden';
    }
    // Señal 1: un "cebo" con clases de anuncio que los bloqueadores esconden.
    function ceboEscondido() {
        return new Promise(function (resolve) {
            var cebo = document.createElement('div');
            cebo.className = 'adsbox ad ad-banner ads advertisement pub_300x250 textads';
            cebo.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;';
            cebo.innerHTML = '&nbsp;';
            document.body.appendChild(cebo);
            setTimeout(function () {
                var oculto = cebo.offsetHeight === 0 || getComputedStyle(cebo).display === 'none' || getComputedStyle(cebo).visibility === 'hidden';
                cebo.remove();
                resolve(oculto);
            }, 600);
        });
    }
    // Señal 2: el navegador corta la descarga de un anuncio (Malwarebytes,
    // Brave, uBlock...). Un error inmediato = bloqueado; si solo tarda, no cuenta.
    function descargaBloqueada(url) {
        return new Promise(function (resolve) {
            var listo = false;
            var fin = function (v) { if (!listo) { listo = true; resolve(v); } };
            setTimeout(function () { fin(false); }, 4000);
            fetch(url, { mode: 'no-cors', cache: 'no-store' })
                .then(function () { fin(false); })
                .catch(function () { fin(navigator.onLine !== false); });
        });
    }
    function hayAdblock() {
        return Promise.all([
            ceboEscondido(),
            descargaBloqueada(ADSTERRA + '22/' + BANNERS['728'].clave),
            descargaBloqueada('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2125166334282472')
        ]).then(function (s) { return s[0] || s[1] || s[2]; });
    }
    // La VPN la revisa el servidor de NetGamer con la IP real (no se puede
    // saltar bloqueando una petición). Solo aplica a quien viene de NetGamer.
    function hayVpn() {
        return fetch(FUNCIONES + 'recompensar-noticia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'conexion', pase: pase() })
        }).then(function (r) { return r.json(); })
          .then(function (d) { return d.vpn === true; })
          .catch(function () { return false; });
    }
    function revisarBloqueos() {
        return hayAdblock().then(function (adb) {
            if (adb) { avisoBloqueo('adblock'); return false; }
            if (!pase()) return true;
            return hayVpn().then(function (vpn) { if (vpn) { avisoBloqueo('vpn'); return false; } return true; });
        });
    }
    var verificacion = null;

    window.Pulso = {
        esc: esc, soloTexto: soloTexto, urlSegura: urlSegura, idValido: idValido, fechaBonita: fechaBonita,
        pase: pase, llamarRecompensa: llamarRecompensa, cargarNoticias: cargarNoticias, imagenDe: imagenDe,
        seccionDe: seccionDe, etiquetaDe: etiquetaDe,
        ponerAnuncios: ponerAnuncios, revisarBloqueos: revisarBloqueos,
        // Promesa: true si no hay bloqueador ni VPN (la recompensa espera esto).
        verificado: function () { return verificacion || Promise.resolve(true); }
    };

    document.addEventListener('DOMContentLoaded', function () {
        var a = document.getElementById('anio');
        if (a) a.textContent = new Date().getFullYear();
        ponerAnuncios();
        verificacion = revisarBloqueos();
    });
})();
