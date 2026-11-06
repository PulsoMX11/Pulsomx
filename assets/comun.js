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
    // Cada anuncio va en su propio marco SIN acceso a la página
    // (sin allow-same-origin): no puede leer el pase ni cambiar nada.
    var SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation';
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
    function banner(clave, ancho, alto) {
        return marcoAnuncio(
            "<html><body style='margin:0;overflow:hidden;'><script>atOptions={'key':'" + clave + "','format':'iframe','height':" + alto + ",'width':" + ancho + ",'params':{}};<\/script><script src='https://www.highperformanceformat.com/" + clave + "/invoke.js'><\/script></body></html>",
            'width:' + ancho + 'px;height:' + alto + 'px;max-width:100%;');
    }
    function ponerAnuncios() {
        document.querySelectorAll('[data-anuncio]').forEach(function (slot) {
            var tipo = slot.getAttribute('data-anuncio');
            if (tipo === '728') slot.appendChild(banner('a8e7cb655ddcbb7f2cccc17b6ec2d6d5', 728, 90));
            else if (tipo === '320') slot.appendChild(banner('d81fb80d3a74926f5784b40947a9ab68', 320, 50));
            else if (tipo === 'nativo') slot.appendChild(marcoAnuncio(
                "<html><body style='margin:0;'><div id='container-c242865b5697b34c2e6ac92e118e339e'></div><script async data-cfasync='false' src='https://pl30307316.effectivecpmnetwork.com/c242865b5697b34c2e6ac92e118e339e/invoke.js'><\/script></body></html>",
                'width:100%;height:250px;'));
        });
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
    function hayAdblock() {
        return new Promise(function (resolve) {
            var cebo = document.createElement('div');
            cebo.className = 'adsbox ad ad-banner ads advertisement';
            cebo.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;';
            document.body.appendChild(cebo);
            setTimeout(function () {
                var oculto = cebo.offsetHeight === 0 || getComputedStyle(cebo).display === 'none';
                cebo.remove();
                resolve(oculto);
            }, 500);
        });
    }
    function hayVpn() {
        return fetch('https://api.ipapi.is/', { signal: AbortSignal.timeout(5000) })
            .then(function (r) { return r.json(); })
            .then(function (d) { return !!(d.is_vpn || d.is_proxy || d.is_tor); })
            .catch(function () { return false; });
    }
    function revisarBloqueos() {
        return hayAdblock().then(function (adb) {
            if (adb) { avisoBloqueo('adblock'); return false; }
            if (!pase()) return true;
            return hayVpn().then(function (vpn) { if (vpn) { avisoBloqueo('vpn'); return false; } return true; });
        });
    }

    window.Pulso = {
        esc: esc, soloTexto: soloTexto, urlSegura: urlSegura, idValido: idValido, fechaBonita: fechaBonita,
        pase: pase, llamarRecompensa: llamarRecompensa, cargarNoticias: cargarNoticias, imagenDe: imagenDe,
        seccionDe: seccionDe, etiquetaDe: etiquetaDe,
        ponerAnuncios: ponerAnuncios, revisarBloqueos: revisarBloqueos
    };

    document.addEventListener('DOMContentLoaded', function () {
        var a = document.getElementById('anio');
        if (a) a.textContent = new Date().getFullYear();
        ponerAnuncios();
        revisarBloqueos();
    });
})();
