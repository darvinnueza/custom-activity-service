# Custom Activity Service

Servicio backend responsable de recibir eventos de ejecución desde Salesforce Marketing Cloud (Journey Builder – Custom Activity) y orquestar operaciones outbound contra Genesys Cloud, actuando como capa intermediaria entre ambas plataformas.

El servicio:
- Expone APIs REST propias
- Documenta el contrato mediante OpenAPI 3.0 (Swagger)
- Permite visualizar el contrato vía Swagger UI
- Está diseñado para desplegarse en Vercel

## Arquitectura General
```
Salesforce Marketing Cloud (Journey Builder)
              |
              |  POST /execute
              v
     Custom Activity Service
              |
              |  APIs internas
              v
        Genesys Cloud (Outbound)
```
## Estructura del Proyecto
```
custom-activity-service/
├── api/
│   └── index.js          # Entry point (Vercel Serverless Function). Expone APIs y Swagger UI.
├── docs/
│   └── README.md         # Documentación interna del proyecto (paso a paso / notas técnicas).
├── swagger.yml           # Contrato OpenAPI 3.0 (fuente de verdad del API).
├── package.json          # Dependencias y metadata del proyecto.
├── vercel.json           # Configuración de rutas y runtime para Vercel.
└── .gitignore            # Archivos a ignorar en el repositorio.
```
Justificación:
- api/: requerido por Vercel para exponer APIs como Serverless Functions.
- swagger.yml: contrato desacoplado del código.
- docs/: documentación técnica separada del código.
- vercel.json: control explícito de rutas y runtime.
## Inicialización del proyecto Node.js
El proyecto se inicializó como una aplicación Node.js estándar, utilizando Express como framework HTTP.
Dependencias utilizadas
- express: servidor HTTP ligero.
- swagger-ui-express: visualización del contrato OpenAPI.
- yamljs: carga del archivo swagger.yml.
### package.json
El archivo package.json quedó definido de la siguiente manera:
```
{
  "name": "custom-activity-service",
  "version": "1.0.0",
  "description": "",
  "main": "api/index.js",
  "directories": {
    "doc": "docs"
  },
  "scripts": {
    "dev": "node api/index.js",
    "start": "node api/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.19.2",
    "swagger-ui-express": "^5.0.1",
    "yamljs": "^0.3.0"
  }
}
```
### Notas:
- Se utiliza Express 4 por estabilidad.
- El entry point apunta a api/index.js, compatible con Vercel.
- Los scripts permiten ejecución local y en producción.
# CUSTOM-ACTIVITY-SERVICE
cd custom-activity-service
docker run --rm -p 8080:8080 -e SWAGGER_JSON=/foo/swagger.yml -v "$(pwd)/swagger.yml:/foo/swagger.yml" swaggerapi/swagger-ui

 http://localhost:8080