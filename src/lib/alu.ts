// Convierte un número decimal a binario de 8 bits (ej. 5 -> "00000101")
export const toBinary = (num: number, bits: number = 8): string => {
  return Math.abs(Math.floor(num)).toString(2).padStart(bits, '0');
};

// Simula el proceso de la ALU (Unidad Aritmético Lógica) paso a paso
export const simularMultiplicacionALU = (litros: number, precio: number) => {
  const binLitros = toBinary(litros);
  const binPrecio = toBinary(precio);
  const totalDecimal = litros * precio;
  const totalBinario = toBinary(totalDecimal, 16);

  // Generamos los pasos de la suma parcial para mostrar en la UI
  const pasos = [];
  let acumulador = 0;

  for (let i = binPrecio.length - 1, j = 0; i >= 0; i--, j++) {
    const bit = parseInt(binPrecio[i]);
    if (bit === 1) {
      const desplazamiento = litros << j;
      acumulador += desplazamiento;
      pasos.push({
        paso: j + 1,
        operacion: `${binLitros} desplazado ${j} bits`,
        resultado_parcial: toBinary(desplazamiento, 16),
        acumulador: toBinary(acumulador, 16)
      });
    }
  }

  return {
    binLitros,
    binPrecio,
    totalDecimal,
    totalBinario,
    pasos
  };
};