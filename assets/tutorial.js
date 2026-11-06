// PulsoMX · Tutorial "Cómo ganar NetCoins leyendo noticias".
// Solo aparece a quien llega desde NetGamer (tiene pase) y solo la primera vez
// en cada página. Se puede repetir con el botón "¿Cómo gano NetCoins?".
(function () {
    'use strict';

    var CLAVES = { portada: 'pulso_tuto_portada_v1', noticia: 'pulso_tuto_noticia_v1' };
    function visto(k) { try { return localStorage.getItem(CLAVES[k]) === '1'; } catch (e) { return false; } }
    function marcar(k) { try { localStorage.setItem(CLAVES[k], '1'); } catch (e) {} }

    // ---------- Estilos ----------
    var css = '' +
        '.tt-velo{position:fixed;background:rgba(2,6,23,.78);z-index:2147483600;transition:all .35s ease;}' +
        '.tt-velo.completo{inset:0;}' +
        '.tt-anillo{position:fixed;z-index:2147483601;border:3px solid #f5b800;border-radius:14px;pointer-events:none;' +
            'box-shadow:0 0 0 4px rgba(245,184,0,.25),0 0 24px rgba(245,184,0,.55);transition:all .35s ease;animation:tt-latido 1.6s ease-in-out infinite;}' +
        '@keyframes tt-latido{0%,100%{box-shadow:0 0 0 4px rgba(245,184,0,.25),0 0 18px rgba(245,184,0,.45);}50%{box-shadow:0 0 0 10px rgba(245,184,0,.08),0 0 34px rgba(245,184,0,.75);}}' +
        '.tt-mano{position:fixed;z-index:2147483602;font-size:38px;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5));animation:tt-toque 1.1s ease-in-out infinite;}' +
        '@keyframes tt-toque{0%,100%{transform:translate(-50%,0) scale(1);}50%{transform:translate(-50%,-10px) scale(1.08);}}' +
        '.tt-caja{position:fixed;z-index:2147483603;width:min(370px,calc(100vw - 24px));background:#fff;color:#1a1a2e;border-radius:16px;' +
            'box-shadow:0 24px 60px rgba(0,0,0,.45);font-family:"Source Sans 3",system-ui,sans-serif;overflow:visible;transition:top .35s ease,left .35s ease,opacity .25s;}' +
        '.tt-caja.centro{left:50%!important;top:50%!important;transform:translate(-50%,-50%);width:min(440px,calc(100vw - 24px));}' +
        '.tt-flecha{position:absolute;width:16px;height:16px;background:#fff;transform:rotate(45deg);}' +
        '.tt-cabeza{background:linear-gradient(135deg,#6d28d9,#9333ea);color:#fff;padding:12px 18px;border-radius:16px 16px 0 0;display:flex;align-items:center;justify-content:space-between;gap:8px;}' +
        '.tt-marca{font-size:.72rem;font-weight:700;letter-spacing:.6px;text-transform:uppercase;opacity:.95;display:flex;align-items:center;gap:6px;}' +
        '.tt-paso{font-size:.72rem;font-weight:700;background:rgba(255,255,255,.18);padding:2px 9px;border-radius:20px;white-space:nowrap;}' +
        '.tt-cuerpo{padding:16px 18px 6px;}' +
        '.tt-icono{font-size:2rem;line-height:1;margin-bottom:8px;}' +
        '.tt-titulo{font-family:"Playfair Display",Georgia,serif;font-size:1.18rem;font-weight:900;line-height:1.25;margin:0 0 8px;}' +
        '.tt-texto{font-size:.92rem;line-height:1.55;color:#374151;margin:0;}' +
        '.tt-texto b{color:#1a1a2e;}' +
        '.tt-datos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 4px;}' +
        '.tt-dato{background:#f5f3ff;border:1px solid #ede9fe;border-radius:12px;padding:10px 6px;text-align:center;}' +
        '.tt-dato b{display:block;font-size:1.15rem;color:#6d28d9;}' +
        '.tt-dato span{font-size:.7rem;color:#6b7280;font-weight:600;}' +
        '.tt-lista{list-style:none;padding:0;margin:12px 0 4px;display:grid;gap:8px;}' +
        '.tt-lista li{display:flex;gap:10px;align-items:flex-start;font-size:.86rem;line-height:1.45;color:#374151;background:#f9fafb;border-radius:10px;padding:8px 10px;}' +
        '.tt-lista li i{font-style:normal;font-size:1.05rem;line-height:1.3;}' +
        '.tt-pie{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 18px 16px;}' +
        '.tt-puntos{display:flex;gap:5px;}' +
        '.tt-puntos span{width:7px;height:7px;border-radius:50%;background:#e5e7eb;transition:all .25s;}' +
        '.tt-puntos span.on{background:#9333ea;width:20px;border-radius:4px;}' +
        '.tt-izq{display:flex;gap:10px;align-items:center;}' +
        '.tt-botones{display:flex;gap:8px;align-items:center;margin-left:auto;}' +
        '.tt-btn{font:inherit;font-weight:700;font-size:.86rem;border:none;border-radius:10px;padding:9px 14px;cursor:pointer;white-space:nowrap;}' +
        '.tt-btn.primario{background:#9333ea;color:#fff;box-shadow:0 4px 14px rgba(147,51,234,.35);}' +
        '.tt-btn.primario:hover{background:#7e22ce;}' +
        '.tt-btn.secundario{background:#f3f4f6;color:#374151;}' +
        '.tt-saltar{font:inherit;background:none;border:none;color:#9ca3af;font-size:.8rem;font-weight:600;cursor:pointer;padding:4px;white-space:nowrap;}' +
        '.tt-saltar:hover{color:#6b7280;text-decoration:underline;}' +
        '.tt-ayuda{position:fixed;left:14px;bottom:14px;z-index:9998;display:flex;align-items:center;gap:7px;background:#6d28d9;color:#fff;border:none;' +
            'border-radius:24px;padding:9px 14px;font:700 .8rem "Source Sans 3",system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 22px rgba(109,40,217,.45);}' +
        '.tt-ayuda:hover{background:#5b21b6;}' +
        '@media (max-width:480px){.tt-titulo{font-size:1.05rem;}.tt-texto{font-size:.86rem;}.tt-cuerpo{padding:14px 14px 4px;}.tt-pie{padding:10px 14px 14px;}.tt-cabeza{padding:10px 14px;}.tt-btn{padding:8px 12px;}.tt-ayuda span{display:none;}}';

    function ponerEstilos() {
        if (document.getElementById('tt-estilos')) return;
        var s = document.createElement('style');
        s.id = 'tt-estilos';
        s.textContent = css;
        document.head.appendChild(s);
    }

    function el(tag, clase, html) {
        var e = document.createElement(tag);
        if (clase) e.className = clase;
        if (html != null) e.innerHTML = html;
        return e;
    }

    // ---------- Motor ----------
    // Cada paso: { foco: () => elemento | null, icono, titulo, texto (HTML fijo), mano, alEntrar(), alSalir() }
    function iniciar(pasos, opciones) {
        ponerEstilos();
        var i = 0;
        var velos = [0, 1, 2, 3].map(function () { return el('div', 'tt-velo'); });
        var veloCompleto = el('div', 'tt-velo completo');
        var anillo = el('div', 'tt-anillo');
        var mano = el('div', 'tt-mano', '👆');
        var caja = el('div', 'tt-caja');
        caja.setAttribute('role', 'dialog');
        caja.setAttribute('aria-modal', 'true');
        var flecha = el('div', 'tt-flecha');
        var actual = null;
        var raf = 0;
        var overflowAntes = document.documentElement.style.overflow;

        velos.forEach(function (v) { document.body.appendChild(v); });
        document.body.appendChild(veloCompleto);
        document.body.appendChild(anillo);
        document.body.appendChild(mano);
        document.body.appendChild(caja);
        // El velo de fuera bloquea clics; el hueco deja tocar el elemento señalado.
        velos.concat([veloCompleto]).forEach(function (v) { v.addEventListener('click', function (e) { e.stopPropagation(); }); });

        function terminar(completo) {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', programar);
            window.removeEventListener('scroll', programar, true);
            document.removeEventListener('keydown', teclas, true);
            if (actual && actual.alSalir) actual.alSalir();
            [veloCompleto, anillo, mano, caja].concat(velos).forEach(function (n) { n.remove(); });
            document.documentElement.style.overflow = overflowAntes;
            if (opciones.alTerminar) opciones.alTerminar(!!completo);
        }

        function teclas(e) {
            if (e.key === 'Escape') { e.preventDefault(); terminar(false); }
            else if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); ir(i + 1); }
            else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); ir(i - 1); }
        }

        function pintarCaja() {
            var p = pasos[i];
            var ultimo = i === pasos.length - 1;
            caja.innerHTML = '';
            var cabeza = el('div', 'tt-cabeza');
            cabeza.appendChild(el('div', 'tt-marca', '🪙 Gana NetCoins leyendo'));
            cabeza.appendChild(el('div', 'tt-paso', 'Paso ' + (i + 1) + ' de ' + pasos.length));
            var cuerpo = el('div', 'tt-cuerpo');
            if (p.icono) cuerpo.appendChild(el('div', 'tt-icono', p.icono));
            var h = el('h3', 'tt-titulo');
            h.textContent = p.titulo;
            cuerpo.appendChild(h);
            cuerpo.appendChild(el('div', 'tt-texto', p.texto));
            var pie = el('div', 'tt-pie');
            var izquierda = el('div', 'tt-izq');
            var saltar = el('button', 'tt-saltar', ultimo ? '' : 'Saltar tutorial');
            saltar.type = 'button';
            saltar.onclick = function () { terminar(false); };
            if (!ultimo) izquierda.appendChild(saltar);
            var puntos = el('div', 'tt-puntos');
            pasos.forEach(function (_, k) { puntos.appendChild(el('span', k === i ? 'on' : '')); });
            izquierda.appendChild(puntos);
            var botones = el('div', 'tt-botones');
            if (i > 0) {
                var atras = el('button', 'tt-btn secundario', 'Atrás');
                atras.type = 'button';
                atras.onclick = function () { ir(i - 1); };
                botones.appendChild(atras);
            }
            var sig = el('button', 'tt-btn primario', p.boton || (ultimo ? '¡Entendido!' : 'Siguiente →'));
            sig.type = 'button';
            sig.onclick = function () { if (p.alBoton) p.alBoton(); else ir(i + 1); };
            botones.appendChild(sig);
            pie.appendChild(izquierda);
            pie.appendChild(botones);
            caja.appendChild(flecha);
            caja.appendChild(cabeza);
            caja.appendChild(cuerpo);
            caja.appendChild(pie);
            setTimeout(function () { try { sig.focus({ preventScroll: true }); } catch (e) {} }, 50);
        }

        function colocar() {
            var p = pasos[i];
            var objetivo = p.foco ? p.foco() : null;
            var vw = window.innerWidth, vh = window.innerHeight;
            if (!objetivo || !objetivo.getClientRects().length) {
                // Paso centrado, sin foco.
                velos.forEach(function (v) { v.style.display = 'none'; });
                veloCompleto.style.display = 'block';
                anillo.style.display = 'none';
                mano.style.display = 'none';
                flecha.style.display = 'none';
                caja.classList.add('centro');
                caja.style.left = ''; caja.style.top = '';
                return;
            }
            caja.classList.remove('centro');
            veloCompleto.style.display = 'none';
            var r = objetivo.getBoundingClientRect();
            var m = 8;
            var x1 = Math.max(0, r.left - m), y1 = Math.max(0, r.top - m);
            var x2 = Math.min(vw, r.right + m), y2 = Math.min(vh, r.bottom + m);
            // Cuatro velos alrededor del hueco.
            var cuadros = [
                [0, 0, vw, y1],
                [0, y2, vw, vh - y2],
                [0, y1, x1, y2 - y1],
                [x2, y1, vw - x2, y2 - y1]
            ];
            velos.forEach(function (v, k) {
                var c = cuadros[k];
                v.style.display = 'block';
                v.style.left = c[0] + 'px'; v.style.top = c[1] + 'px';
                v.style.width = Math.max(0, c[2]) + 'px'; v.style.height = Math.max(0, c[3]) + 'px';
            });
            anillo.style.display = 'block';
            anillo.style.left = x1 + 'px'; anillo.style.top = y1 + 'px';
            anillo.style.width = (x2 - x1) + 'px'; anillo.style.height = (y2 - y1) + 'px';

            // Caja: abajo del foco si cabe; si no, arriba; si tampoco, pegada abajo de la pantalla.
            var ancho = caja.offsetWidth, alto = caja.offsetHeight;
            var izq = Math.min(Math.max(12, (x1 + x2) / 2 - ancho / 2), vw - ancho - 12);
            var arriba;
            var lado;
            if (y2 + 14 + alto <= vh - 8) { arriba = y2 + 14; lado = 'abajo'; }
            else if (y1 - 14 - alto >= 8) { arriba = y1 - 14 - alto; lado = 'arriba'; }
            else { arriba = Math.max(8, vh - alto - 10); lado = 'ninguno'; }
            caja.style.left = izq + 'px';
            caja.style.top = arriba + 'px';

            // Mano que "toca": sobre el elemento, sin quedar debajo de la caja.
            if (p.mano) {
                var limite = lado === 'abajo' ? y2 : (lado === 'arriba' ? vh : arriba);
                var manoY = Math.min(y2 - 44, limite - 50);
                manoY = Math.max(y1 + 6, manoY);
                mano.style.display = 'block';
                mano.style.left = ((x1 + x2) / 2) + 'px';
                mano.style.top = manoY + 'px';
            } else {
                mano.style.display = 'none';
            }
            if (lado === 'ninguno') { flecha.style.display = 'none'; }
            else {
                flecha.style.display = 'block';
                var fx = Math.min(Math.max(18, (x1 + x2) / 2 - izq - 8), ancho - 34);
                flecha.style.left = fx + 'px';
                if (lado === 'abajo') { flecha.style.top = '-7px'; flecha.style.bottom = ''; flecha.style.background = '#7c3aed'; }
                else { flecha.style.bottom = '-7px'; flecha.style.top = ''; flecha.style.background = '#fff'; }
            }
        }

        function programar() {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(colocar);
        }

        function ir(n) {
            if (n >= pasos.length) { terminar(true); return; }
            if (n < 0) n = 0;
            if (actual && actual.alSalir) actual.alSalir();
            i = n;
            actual = pasos[i];
            if (actual.alEntrar) actual.alEntrar();
            pintarCaja();
            var objetivo = actual.foco ? actual.foco() : null;
            document.documentElement.style.overflow = '';
            if (objetivo && objetivo.scrollIntoView) {
                var r = objetivo.getBoundingClientRect();
                var fuera = r.top < 70 || r.bottom > window.innerHeight - 200;
                if (fuera) objetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                colocar();
                setTimeout(function () { colocar(); document.documentElement.style.overflow = 'hidden'; }, fuera ? 550 : 30);
            } else {
                colocar();
                document.documentElement.style.overflow = 'hidden';
            }
        }

        window.addEventListener('resize', programar);
        window.addEventListener('scroll', programar, true);
        document.addEventListener('keydown', teclas, true);
        ir(0);
        return { terminar: terminar, ir: function (n) { ir(n); } };
    }

    // ---------- Botón para repetir el tutorial ----------
    function botonAyuda(accion) {
        if (document.querySelector('.tt-ayuda')) return;
        ponerEstilos();
        var b = el('button', 'tt-ayuda', '🪙 <span>¿Cómo gano NetCoins?</span>');
        b.type = 'button';
        b.title = 'Ver el tutorial de NetCoins';
        b.onclick = accion;
        document.body.appendChild(b);
    }

    var DATOS = function (nc) {
        return '<div class="tt-datos">' +
            '<div class="tt-dato"><b>' + nc + '</b><span>NetCoins por noticia</span></div>' +
            '<div class="tt-dato"><b>30 s</b><span>de lectura</span></div>' +
            '<div class="tt-dato"><b>100</b><span>noticias al día</span></div></div>';
    };

    // ---------- Portada ----------
    function portada(forzar) {
        if (!forzar && visto('portada')) return;
        var destacada = function () { return document.querySelector('#destacada .hero-card'); };
        if (!destacada()) return;
        iniciar([
            {
                icono: '👋',
                titulo: '¡Bienvenido a PulsoMX!',
                texto: 'Aquí ganas <b>NetCoins para tu cuenta de NetGamer</b> solo por leer noticias. ' +
                    'Te mostramos en menos de un minuto cómo funciona.' + DATOS(250)
            },
            {
                foco: function () { return document.querySelector('.pestanas'); },
                icono: '🗂️',
                titulo: 'Elige qué quieres leer',
                texto: 'Usa estas pestañas para ver <b>todas las noticias</b>, solo las de <b>México</b> o las del <b>Mundo</b>. ' +
                    'Todas las secciones dan la misma recompensa.'
            },
            {
                foco: function () { return document.querySelector('#lista .news-card') || document.getElementById('lista'); },
                icono: '📰',
                titulo: 'Cada noticia es una recompensa',
                texto: 'Cada noticia que leas te da NetCoins <b>una sola vez</b>. ' +
                    'Mientras más noticias distintas leas, más ganas: el robot publica <b>noticias nuevas cada hora</b>.'
            },
            {
                foco: destacada,
                mano: true,
                icono: '👆',
                titulo: 'Toca una noticia para empezar',
                texto: 'Para ganar, <b>abre cualquier noticia</b> tocándola. Empieza con esta: al entrar te explicamos ' +
                    'cómo se llena tu barra de NetCoins.',
                boton: 'Abrir esta noticia',
                alBoton: function () { marcar('portada'); location.href = destacada().href; }
            }
        ], { alTerminar: function () { marcar('portada'); } });
        // Si toca la noticia señalada, el tutorial de la portada cuenta como visto.
        var d = destacada();
        if (d) d.addEventListener('click', function () { marcar('portada'); }, { once: true });
    }

    // ---------- Noticia ----------
    // La barra de verdad arranca hasta que termina el tutorial (así el tiempo
    // de lectura no corre mientras se explica). Mientras, se muestra de ejemplo.
    function noticia(forzar, alTerminar) {
        var premio = document.getElementById('premio');
        var barra = document.getElementById('premio-barra');
        var texto = document.getElementById('premio-texto');
        var real = premio && premio.style.display === 'block';
        if (!forzar && visto('noticia')) { if (alTerminar) alTerminar(); return; }
        var guardado = null;
        function mostrarEjemplo(porcentaje, mensaje, color) {
            if (real || !premio) return;
            if (!guardado) guardado = { display: premio.style.display, texto: texto.innerHTML, ancho: barra.style.width, fondo: barra.style.background };
            premio.style.display = 'block';
            premio.style.opacity = '1';
            texto.innerHTML = mensaje;
            barra.style.background = color || '';
            barra.style.width = porcentaje + '%';
        }
        function quitarEjemplo() {
            if (real || !guardado) return;
            premio.style.display = guardado.display;
            texto.innerHTML = guardado.texto;
            barra.style.width = guardado.ancho;
            barra.style.background = guardado.fondo;
            guardado = null;
        }
        iniciar([
            {
                foco: function () { return document.getElementById('titulo'); },
                icono: '📖',
                titulo: 'Lee la noticia',
                texto: 'Este es el artículo. Léelo con calma: <b>el tiempo de lectura es lo que te da tus NetCoins</b>. ' +
                    'Puedes bajar para ver el texto completo y la fuente original.'
            },
            {
                foco: function () { return premio; },
                icono: '⏳',
                titulo: 'Tu barra de recompensa',
                texto: 'Esta barra de abajo <b>se llena sola en 30 segundos</b> mientras lees. ' +
                    '<b>Mantén esta pestaña abierta y a la vista</b>: si cambias de pestaña o de app, la barra se pausa y continúa al volver.',
                alEntrar: function () { mostrarEjemplo(45, '<i class="fa-solid fa-book-open" style="color:#f5b800;margin-right:6px;"></i>Leyendo para ganar 250 NetCoins'); },
                alSalir: quitarEjemplo
            },
            {
                foco: function () { return premio; },
                icono: '✅',
                titulo: 'Las NetCoins se suman solas',
                texto: 'Cuando la barra se llena verás <b>"¡+250 NetCoins acreditadas!"</b>. ' +
                    'Se suman automáticamente a tu saldo de NetGamer y aparecen en tu historial. <b>No tienes que hacer nada más.</b>',
                alEntrar: function () { mostrarEjemplo(100, '<i class="fa-solid fa-circle-check" style="color:#10b981;margin-right:6px;"></i>¡+250 NetCoins acreditadas en tu cuenta de NetGamer!', '#10b981'); },
                alSalir: quitarEjemplo
            },
            {
                foco: function () { return document.querySelector('#relacionadas .related-card') || document.getElementById('relacionadas'); },
                icono: '🔁',
                titulo: 'Sigue ganando',
                texto: 'Al terminar, <b>abre otra noticia</b> desde aquí o desde la portada. ' +
                    'Cada noticia nueva es otra recompensa, hasta 100 al día.'
            },
            {
                icono: '📋',
                titulo: 'Reglas para que tus NetCoins cuenten',
                texto: '<ul class="tt-lista">' +
                    '<li><i>☝️</i><span>Cada noticia se cobra <b>una sola vez</b> por cuenta.</span></li>' +
                    '<li><i>📅</i><span>Máximo <b>100 noticias al día</b>. El contador se reinicia a medianoche (hora de México).</span></li>' +
                    '<li><i>🚫</i><span><b>Sin VPN, proxy ni bloqueador de anuncios</b>: si los usas, la recompensa no se activa.</span></li>' +
                    '<li><i>🔗</i><span>Entra siempre <b>desde el botón Noticias de NetGamer</b>. Tu acceso dura 12 horas; si vence, vuelve a entrar desde ahí.</span></li>' +
                    '</ul>',
                boton: '¡Listo, a ganar!'
            }
        ], {
            alTerminar: function () {
                marcar('noticia');
                quitarEjemplo();
                if (alTerminar) alTerminar();
            }
        });
    }

    window.PulsoTutorial = { portada: portada, noticia: noticia, botonAyuda: botonAyuda };
})();
