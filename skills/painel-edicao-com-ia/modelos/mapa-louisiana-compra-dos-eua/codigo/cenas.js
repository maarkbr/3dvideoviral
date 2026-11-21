// Cena própria deste vídeo: o território da Compra da Louisiana, aproximado por 4 pedaços dos EUA
// (planícies do norte, centro, Oklahoma e Arkansas, Louisiana), sem Texas e sem o oeste das Rochosas.
window.CENAS_EXTRA = (api) => {
  const { CENA } = api;
  const PARTES = [
    { latN: 49.0, latS: 40.5, lonW: -111.5, lonE: -91.3 },
    { latN: 40.5, latS: 36.5, lonW: -105.0, lonE: -90.2 },
    { latN: 36.5, latS: 33.0, lonW: -100.0, lonE: -89.7 },
    { latN: 33.0, latS: 28.8, lonW: -94.1, lonE: -88.9 },
  ];
  CENA.louisiana = (c, i, t0, t1) => {
    const camera = c.camera || { lon: -97, lat: 39.5, zoom: 1900 };
    PARTES.forEach((p, k) => CENA.faixa({ ...c, ...p, camera, tipo: "faixa", pais: "United States of America", itens: k ? [] : (c.itens || []) }, i, t0, t1));
  };
};
