# PulsoMX — cómo ponerlo en línea

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Portada con la lista de noticias |
| `noticia.html` | Página de cada noticia (+ barra de NetCoins para quien viene de NetGamer) |
| `clima.html` | Clima de 12 ciudades (Open-Meteo, sin clave) |
| `acerca.html`, `contacto.html`, `privacidad.html`, `terminos.html` | Páginas legales |
| `assets/` | Estilos y código compartido |
| `data/noticias.json` | Las noticias (empieza vacío; lo llena el robot) |
| `scripts/botnoticias.py` | El robot que busca y resume noticias |
| `requirements.txt` | Lo que necesita el robot |
| `.github/workflows/noticias.yml` | Corre el robot cada hora |
| `.nojekyll` | Le dice a GitHub Pages que publique los archivos tal cual |
| `servidor/` | **No se sube a GitHub.** Son las funciones de Supabase (las publica Claude). |

## Pasos

1. **Crea el repositorio** en GitHub con el nombre `PulsoMX`, público.
2. **Sube todo** el contenido de esta carpeta **excepto `servidor/`**. Las carpetas `.github` y `data` sí van (en Windows `.github` puede verse oculta).
3. **Activa GitHub Pages**: Settings → Pages → *Deploy from a branch* → `main` / `(root)` → Save.
4. **Pon tu clave de Groq**: Settings → Secrets and variables → Actions → *New repository secret* → nombre `GROQ_API_KEY`, valor = tu clave de https://console.groq.com
5. **Permite que el robot guarde**: Settings → Actions → General → *Workflow permissions* → **Read and write permissions** → Save.
6. **Primera corrida**: pestaña Actions → "Actualizar noticias" → *Run workflow*. En 2–3 minutos aparecen las primeras 4 noticias; después agrega hasta 4 cada hora.
7. **Cambia el correo** de `contacto.html` (`CORREO-DE-CONTACTO@ejemplo.com`) por el tuyo.
8. La dirección del sitio es `https://pulsomx11.github.io/Pulsomx/` (ya está conectada con NetGamer).

## Si algo falla

- **No salen noticias**: revisa en Actions el último "Actualizar noticias". Si dice que falta `GROQ_API_KEY` o que el modelo no existe, corrige el secreto o cambia `GROQ_MODEL` en `.github/workflows/noticias.yml`.
- **Un medio dejó de funcionar**: el robot lo salta solo. Para cambiarlo, edita la lista `RSS_FEEDS` en `scripts/botnoticias.py`.
- GitHub pausa los robots programados de repositorios sin actividad por 60 días; como el robot guarda noticias cada hora, eso no debería pasar.
