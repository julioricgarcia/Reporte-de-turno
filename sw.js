
const CACHE_NAME = "reporte-turno-v2";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png"
];

// Instalar la nueva versión
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS))
            .then(() => self.skipWaiting())
    );
});

// Activar y eliminar cachés anteriores
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key =>
                        key.startsWith("reporte-turno-") &&
                        key !== CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// Priorizar siempre la versión online
self.addEventListener("fetch", event => {

    const request = event.request;

    if (
        request.method !== "GET" ||
        new URL(request.url).origin !== self.location.origin
    ) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {

                if (response && response.ok) {
                    const copia = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(request, copia));
                }

                return response;
            })
            .catch(async () => {

                const guardado = await caches.match(request);

                if (guardado) {
                    return guardado;
                }

                if (request.mode === "navigate") {
                    return caches.match("./index.html");
                }

                return new Response(
                    "Sin conexión a Internet",
                    { status: 503 }
                );

            })
    );

});
