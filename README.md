# UADE Map

Mapa interactivo de materias y **correlativas** según [WebCampus UADE](https://www.webcampus.uade.edu.ar/) (plan Ingeniería en Informática, resolución 2021 / IdCarrera 1621). En UADE no hay créditos curriculares: el avance se muestra por **cantidad de materias** aprobadas por bloque (obligatorias, electivas, cierre de carrera).

Basado en el fork de [FIUBA Map](https://fede.dm/FIUBA-Map/).

<a href='https://imgur.com/QkXbwFc'><img src='public/fmap.png'></a>

- Datos de correlativas: exportar la página de correlativas del plan en formato `.mht` y regenerar el JSON con  
  `node scripts/parse-uade-mht.mjs ruta/al/archivo.mht src/data/informatica-uade-2021.json`
- Se pueden marcar materias aprobadas / en final / cursando y guardarlas (misma idea de padron que el proyecto original; la API local puede requerir clave).

---

## Desarrollo

`npm install` y `npm start`. La app corre en `http://localhost:3000/`.

Para compilar: `npm run build`.
