# MD Feed — Generador Markdown para IA

Editor Markdown ligero, offline-first, optimizado para alimentar a agentes de IA. PWA instalable en Android/iOS.

## Estructura

```
md-generator/
├── index.html      App completa (HTML + CSS + JS en un solo archivo)
├── manifest.json   Manifest PWA
├── sw.js           Service Worker (caché offline)
├── icon-192.png    Icono 192×192
└── icon-512.png    Icono 512×512
```

## Cómo servir por HTTPS

La PWA requiere HTTPS para que `navigator.clipboard` funcione y Chrome ofrezca "Instalar app".

### Opción rápida: Python

```bash
# Python 3.7+
cd md-generator
python -m http.server 8080
# → http://localhost:8080

# Con HTTPS (requiere certificado):
pip install pyopenssl
python -m http.server 8080 --bind 0.0.0.0 \
  --certfile cert.pem --keyfile key.pem
```

### Opción rápida: Node

```bash
npx serve ./md-generator -l 8080
# npx serve ya usa HTTPS con certificado auto-firmado
```

### Opción rápida: PHP

```bash
php -S localhost:8080 -t md-generator
```

### Desde la red local (para probar en el S23)

1. Asegúrate de que el PC y el S23 estén en la misma red WiFi.
2. Obtén la IP del PC: `ipconfig` (busca IPv4, ej. `192.168.1.50`).
3. Sirve con HTTPS en `0.0.0.0`:
   ```bash
   npx serve ./md-generator -l 8080 --listen 0.0.0.0
   ```
4. En el S23, abre Chrome y ve a `https://192.168.1.50:8080`.
5. Acepta el certificado auto-firmado (Avanzado → Continuar).

## Instalar en Samsung Galaxy S23

### Método 1: Chrome "Instalar app"
1. Abre la URL de la PWA en Chrome del S23.
2. Toca el menú (⋮) → **Instalar app** / **Añadir a pantalla de inicio**.
3. Confirma. La app aparece en el cajón de apps.

### Método 2: Añadir a pantalla de inicio
1. En Chrome, toca ⋮ → **Agregar a pantalla de inicio**.
2. Ponle un nombre (ej. "MD Feed") y confirma.

### Verificar que funciona offline
1. Abre la PWA y espera a que cargue completamente.
2. Activa modo avión.
3. Cierra y vuelve a abrir la app.
4. Debe cargar sin conexión y permitir escribir + descargar .md.

## Funcionalidades

- **Front-matter YAML** con toggle (título, tags, fuente, fecha automática).
- **Toolbar de formato**: H1, H2, H3, negrita, cursiva, código inline, bloque de código, listas, blockquote, enlace, tabla, separador.
- **Contador de palabras** en tiempo real.
- **Copiar** al portapapeles (con fallback `execCommand`).
- **Descargar .md** vía Blob URL.
- **Offline-first** tras la primera carga.
- **Respecta safe-area-inset** en dispositivos con notch/barra de navegación.
- **Layout estable** al abrir/cerrar el teclado (Visual Viewport API + dvh).

## Edición sin build

Todo está en un solo `index.html`. No hay dependencias externas, bundler ni build step. Edita directamente y recarga.
