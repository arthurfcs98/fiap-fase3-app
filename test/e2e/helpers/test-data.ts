function calculateCpfDigit(cpfPartial: number[]): number {
  const weights =
    cpfPartial.length === 9
      ? [10, 9, 8, 7, 6, 5, 4, 3, 2]
      : [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  const sum = cpfPartial.reduce(
    (acc, digit, index) => acc + digit * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function generateValidCpf(): string {
  const base = Array(9)
    .fill(null)
    .map(() => Math.floor(Math.random() * 10));

  const digit1 = calculateCpfDigit(base);
  const digit2 = calculateCpfDigit([...base, digit1]);

  return [...base, digit1, digit2].join('');
}

function calculateCnpjDigit(cnpjPartial: number[]): number {
  const weights =
    cnpjPartial.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const sum = cnpjPartial.reduce(
    (acc, digit, index) => acc + digit * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function generateValidCnpj(): string {
  const base = Array(8)
    .fill(null)
    .map(() => Math.floor(Math.random() * 10));
  const branch = [0, 0, 0, 1]; // Branch number "0001"
  const cnpjBase = [...base, ...branch];

  const digit1 = calculateCnpjDigit(cnpjBase);
  const digit2 = calculateCnpjDigit([...cnpjBase, digit1]);

  return [...cnpjBase, digit1, digit2].join('');
}

export const TestData = {
  admin: {
    email: 'admin@oficina.com',
    password: 'admin123',
  },

  customer: {
    document: '52998224725',
    name: 'João Silva',
    email: 'joao.silva@example.com',
    phone: '11999999999',
  },

  customer2: {
    document: '11144477735',
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    phone: '11988888888',
  },

  companyCustomer: {
    document: '11222333000181',
    name: 'Auto Peças LTDA',
    email: 'contato@autopecas.com',
    phone: '1133334444',
  },

  vehicle: {
    licensePlate: 'ABC1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    color: 'Prata',
  },

  vehicle2: {
    licensePlate: 'XYZ9876',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    color: 'Preto',
  },

  service: {
    code: 'SRV001',
    name: 'Troca de Óleo',
    description: 'Troca completa de óleo com filtro',
    basePrice: 150.0,
    estimatedMinutes: 60,
  },

  service2: {
    code: 'SRV002',
    name: 'Alinhamento e Balanceamento',
    description: 'Alinhamento e balanceamento das 4 rodas',
    basePrice: 120.0,
    estimatedMinutes: 45,
  },

  part: {
    code: 'PRT001',
    name: 'Filtro de Óleo',
    unitPrice: 35.0,
    stockQuantity: 100,
    minimumStock: 10,
  },

  part2: {
    code: 'PRT002',
    name: 'Óleo Motor 5W30',
    unitPrice: 45.0,
    stockQuantity: 50,
    minimumStock: 20,
  },

  partLowStock: {
    code: 'PRT003',
    name: 'Pastilha de Freio',
    unitPrice: 120.0,
    stockQuantity: 5,
    minimumStock: 10,
  },

  generateUniqueCpf(): string {
    return generateValidCpf();
  },

  generateUniqueCnpj(): string {
    return generateValidCnpj();
  },

  generateUniquePlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetters = Array(3)
      .fill(null)
      .map(() => letters[Math.floor(Math.random() * letters.length)])
      .join('');
    const randomNumbers = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${randomLetters}${randomNumbers}`;
  },

  generateUniqueCode(prefix: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  },

  generateUniqueEmail(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}${timestamp}${random}@test.com`;
  },
};
