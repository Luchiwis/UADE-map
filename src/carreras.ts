import { UserType } from "./types/User";

// Planes de estudio UADE: correlativas según WebCampus (sin sistema de créditos).
// Cada carrera tiene un JSON en src/data/; se puede regenerar con:
//   node scripts/parse-uade-mht.mjs ruta/export.mht src/data/<archivo>.json

export const CARRERAS: UserType.Carrera[] = [
  {
    id: "informatica-uade-2021",
    link: "https://www.webcampus.uade.edu.ar/Contenidos/CorrelativasMaterias.aspx?IdCarrera=1621&IdFacultad=1",
    ano: 2021,
    graph: require("./data/informatica-uade-2021.json"),
  },
];

export const PLANES = [
  {
    nombre: "Ingeniería en Informática",
    nombrecorto: "Informática",
    planes: ["informatica-uade-2021"],
  },
];
