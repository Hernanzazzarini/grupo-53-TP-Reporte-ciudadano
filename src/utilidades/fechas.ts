export const hace = (iso: string): string => {
  const entonces = new Date(iso).getTime();
  const ahora = Date.now();
  const segundos = Math.floor((ahora - entonces) / 1000);

  if (Number.isNaN(segundos)) return '';
  if (segundos < 0) return formatearFecha(iso);

  if (segundos < 60) return 'recién';

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;

  const semanas = Math.floor(dias / 7);
  if (semanas === 1) return 'hace 1 semana';
  if (semanas < 5) return `hace ${semanas} semanas`;

  const meses = Math.floor(dias / 30);
  if (meses === 1) return 'hace 1 mes';
  if (meses < 12) return `hace ${meses} meses`;

  return formatearFecha(iso);
};

export const formatearFecha = (iso: string): string => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
};

export const formatearFechaHora = (iso: string): string => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';

  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${formatearFecha(iso)} ${hora}:${minutos}`;
};
