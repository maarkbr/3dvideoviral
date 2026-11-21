window.CENA = {
 "dur": 14.6,
 "lugares": {
  "southampton": [-1.40, 50.90, "Southampton"],
  "naufragio": [-49.95, 41.73, "Atlântico Norte"],
  "novayork": [-74.0, 40.71, "Nova York"]
 },
 "objetos": [
  { "id": "ano1912", "tipo": "ano", "texto": "1912", "lugar": "southampton", "dx": 0, "dy": -70, "tempos": [0.0, 0.52, 1.34, 1.52] },
  { "id": "titanic", "tipo": "foto", "img": "titanic", "lugar": "southampton", "dy": 40, "t": 2.34 },
  { "id": "iceberg", "tipo": "foto", "img": "iceberg", "lugar": "naufragio", "t": 5.94,
    "circulo": { "x": 0.505, "y": 0.415, "r": 0.25, "achatado": 0.42, "t": 7.86, "zoom": 1.6 } },
  { "id": "nyt", "tipo": "recorte", "lugar": "novayork", "t": 10.34,
    "jornal": "The New York Times",
    "manchete": ["TITANIC AFUNDA", "QUATRO HORAS", "DEPOIS DE BATER", "EM ICEBERG"],
    "frase": ["866 resgatados pelo Carpathia;", "provavelmente 1.250 mortos."],
    "carimbo": { "texto": "AFUNDOU", "t": 12.80 } }
 ],
 "tipos": {},
 "fio": true,
 "final": null
};
