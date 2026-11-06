"""
PulsoMX · Robot de noticias

Lee los RSS de medios mexicanos, toma el texto público de cada nota y le pide
a la IA (Groq) un RESUMEN hecho solo con esos datos. Guarda todo en
data/noticias.json, que es lo que muestran las páginas del sitio.

Lo corre GitHub Actions cada hora (.github/workflows/noticias.yml).
Necesita el secreto GROQ_API_KEY en el repositorio.
"""
import hashlib
import json
import os
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# ⚙️ CONFIGURACIÓN
NOTICIAS_POR_CORRIDA = 4          # notas nuevas cada vez que corre
POR_MEDIO = 1                     # máximo por medio en cada corrida (variedad)
MAXIMO_GUARDADAS = 100            # el archivo guarda solo las últimas 100
MIN_PALABRAS_FUENTE = 80          # si la nota original trae menos texto, no se publica

# Revisados en noviembre de 2026. Si un medio cambia su RSS, el robot lo
# salta y sigue con los demás; solo hay que corregir la dirección aquí.
RSS_FEEDS = [
    ("El Universal", "https://www.eluniversal.com.mx/arc/outboundfeeds/rss/?outputType=xml"),
    ("Infobae México", "https://www.infobae.com/arc/outboundfeeds/rss/category/mexico/?outputType=xml"),
    ("El Financiero", "https://www.elfinanciero.com.mx/arc/outboundfeeds/rss/?outputType=xml"),
    ("El Economista", "https://www.eleconomista.com.mx/rss/ultimas-noticias"),
    ("Expansión", "https://expansion.mx/rss"),
    ("La Jornada", "https://www.jornada.com.mx/rss/edicion.xml?v=1"),
]

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(RAIZ, "data", "noticias.json")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# Si Groq retira este modelo, cambia GROQ_MODEL en el workflow (no hace falta tocar este archivo).
GROQ_MODEL = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"
HORA_MX = timezone(timedelta(hours=-6))

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9",
})


def cargar_noticias():
    if not os.path.exists(JSON_PATH):
        return []
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            datos = json.load(f)
            return datos if isinstance(datos, list) else []
    except Exception:
        return []


def guardar_noticias(noticias):
    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(noticias, f, ensure_ascii=False, indent=2)


def id_de(titulo_original, enlace):
    # Identificador estable: la misma nota siempre tiene el mismo id, y nunca
    # choca con los ids viejos (que eran números).
    return "n-" + hashlib.sha1((titulo_original + "|" + enlace).encode("utf-8")).hexdigest()[:12]


def limpiar(texto, maximo=None):
    texto = re.sub(r"\s+", " ", texto or "").strip()
    return texto[:maximo] if maximo else texto


def leer_articulo(url):
    """Devuelve (imagen, texto) de la nota original."""
    if not url:
        return None, ""
    try:
        r = session.get(url, timeout=15, allow_redirects=True)
        if r.status_code != 200:
            return None, ""
        soup = BeautifulSoup(r.text, "html.parser")

        imagen = None
        for sel in ({"property": "og:image"}, {"name": "twitter:image"}, {"property": "og:image:url"}):
            meta = soup.find("meta", attrs=sel)
            src = meta.get("content") if meta else None
            if src and src.startswith("http") and "logo" not in src.lower():
                imagen = urljoin(url, src)
                break

        for basura in soup(["script", "style", "nav", "header", "footer", "aside", "form", "figure"]):
            basura.decompose()
        cuerpo = soup.find("article") or soup.body or soup
        parrafos = [limpiar(p.get_text(" ")) for p in cuerpo.find_all("p")]
        parrafos = [p for p in parrafos if len(p.split()) >= 8]
        texto = "\n".join(parrafos)
        if len(texto.split()) < MIN_PALABRAS_FUENTE:
            meta = soup.find("meta", attrs={"property": "og:description"}) or soup.find("meta", attrs={"name": "description"})
            if meta and meta.get("content"):
                texto = (texto + "\n" + limpiar(meta["content"])).strip()
        return imagen, texto[:6000]
    except Exception as e:
        print(f"   ⚠️ No se pudo leer la nota: {e}")
        return None, ""


def resumir_con_ia(titulo, texto_fuente, medio):
    """Resumen basado SOLO en el texto de la fuente. Si algo falla, devuelve None
    (la nota no se publica: nunca se publica texto inventado)."""
    if not GROQ_API_KEY:
        print("   ⚠️ Falta GROQ_API_KEY")
        return None

    instrucciones = (
        "Eres editor de un sitio de resúmenes de noticias en México. Con el TEXTO DE LA FUENTE que te dan, "
        "escribe un resumen fiel en español. Reglas obligatorias:\n"
        "- Usa SOLO datos que aparezcan en el texto de la fuente. No inventes cifras, fechas, nombres ni declaraciones.\n"
        "- Solo puedes poner una cita textual si aparece tal cual en la fuente.\n"
        "- Si algo no está en la fuente, no lo menciones.\n"
        "- Tono informativo y neutral, sin opiniones propias.\n"
        "Responde ÚNICAMENTE con un objeto JSON con las claves: titulo, resumen, contenido."
    )
    pedido = (
        f"MEDIO: {medio}\nTITULAR ORIGINAL: {titulo}\n\nTEXTO DE LA FUENTE:\n{texto_fuente}\n\n"
        "Devuelve:\n"
        '- "titulo": titular claro, máximo 90 caracteres, sin exagerar.\n'
        '- "resumen": 2 o 3 oraciones con lo esencial.\n'
        '- "contenido": entre 180 y 400 palabras, en párrafos separados por una línea en blanco. '
        "Si la fuente es corta, el contenido también puede serlo."
    )

    for intento in range(2):
        try:
            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "system", "content": instrucciones}, {"role": "user", "content": pedido}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3,
                    "max_tokens": 1200,
                },
                timeout=60,
            )
            res = r.json()
            if "choices" not in res:
                print(f"   ⚠️ Groq respondió: {res.get('error', {}).get('message', r.status_code)}")
                time.sleep(8)
                continue
            crudo = res["choices"][0]["message"]["content"].strip()
            crudo = re.sub(r"^```(?:json)?\s*|\s*```$", "", crudo)
            data = json.loads(crudo)
            titulo_ia = limpiar(str(data.get("titulo", "")), 140)
            resumen = str(data.get("resumen", "")).strip()
            contenido = str(data.get("contenido", "")).strip()
            if not titulo_ia or len(resumen.split()) < 10 or len(contenido.split()) < 60:
                print("   ⚠️ Respuesta muy corta, se descarta")
                return None
            return titulo_ia, resumen, contenido
        except Exception as e:
            print(f"   ⚠️ Error IA (intento {intento + 1}): {e}")
            time.sleep(5)
    return None


def imagen_publica(imagen, titulo):
    if imagen:
        # wsrv.nl sirve la imagen desde su propio servidor (algunos medios bloquean el enlace directo).
        return "https://wsrv.nl/?w=900&url=" + urllib.parse.quote(imagen, safe="")
    semilla = int(hashlib.md5(titulo.encode("utf-8")).hexdigest()[:6], 16)
    return f"https://picsum.photos/seed/{semilla}/800/500"


def _texto_xml(bloque, etiqueta):
    m = re.search(rf"<{etiqueta}[^>]*>(.*?)</{etiqueta}>", bloque, re.S | re.I)
    if not m:
        return ""
    t = re.sub(r"^\s*<!\[CDATA\[(.*)\]\]>\s*$", r"\1", m.group(1), flags=re.S)
    return BeautifulSoup(t, "html.parser").get_text(" ").strip()


def leer_feed(url):
    """Devuelve una lista de (titulo, enlace). Tolera RSS con XML imperfecto."""
    try:
        res = session.get(url, timeout=15)
        if res.status_code != 200:
            print(f"❌ {url} respondió {res.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error leyendo feed {url}: {e}")
        return []
    try:
        items = ET.fromstring(res.content).findall(".//item")
        salida = []
        for it in items:
            enlace = (it.findtext("link") or "").strip() or (it.findtext("guid") or "").strip()
            salida.append((it.findtext("title") or "", enlace))
        return salida
    except ET.ParseError:
        # XML mal formado: se sacan los datos "a mano".
        texto = res.content.decode("utf-8", errors="replace")
        return [(_texto_xml(b, "title"), _texto_xml(b, "link") or _texto_xml(b, "guid"))
                for b in re.findall(r"<item[\s>].*?</item>", texto, re.S | re.I)]


def ejecutar():
    guardadas = cargar_noticias()
    ya = {n.get("id") for n in guardadas} | {n.get("titulo_original") for n in guardadas}
    nuevas = 0

    for medio, feed in RSS_FEEDS:
        if nuevas >= NOTICIAS_POR_CORRIDA:
            break
        print(f"\n📡 {medio}: {feed}")
        de_este_medio = 0
        for titulo, enlace in leer_feed(feed):
            if nuevas >= NOTICIAS_POR_CORRIDA or de_este_medio >= POR_MEDIO:
                break
            titulo = limpiar(titulo, 200)
            enlace = (enlace or "").strip()
            if len(titulo.split()) < 4 or not enlace.startswith("http"):
                continue
            nid = id_de(titulo, enlace)
            if nid in ya or titulo in ya:
                continue

            print(f"\n🔄 {titulo[:70]}")
            imagen, texto = leer_articulo(enlace)
            if len(texto.split()) < MIN_PALABRAS_FUENTE:
                print("   ⏭️ La fuente no trae suficiente texto, se omite")
                ya.add(nid)
                continue

            resultado = resumir_con_ia(titulo, texto, medio)
            if not resultado:
                continue
            titulo_ia, resumen, contenido = resultado

            guardadas.append({
                "id": nid,
                "titulo_original": titulo,
                "titulo": titulo_ia,
                "resumen": resumen,
                "contenido": contenido,
                "imagen": imagen_publica(imagen, titulo),
                "fecha": datetime.now(HORA_MX).strftime("%Y-%m-%d"),
                "medio": medio,
                "url_origen": enlace,
            })
            ya.add(nid)
            nuevas += 1
            de_este_medio += 1
            print(f"✅ Guardada: {titulo_ia[:60]} ({len(contenido.split())} palabras)")
            time.sleep(10)  # evita el límite de peticiones de Groq

    if nuevas:
        guardar_noticias(guardadas[-MAXIMO_GUARDADAS:])
        print(f"\n💾 {nuevas} noticias nuevas guardadas.")
    else:
        print("\nℹ️ No hay noticias nuevas.")


if __name__ == "__main__":
    ejecutar()
