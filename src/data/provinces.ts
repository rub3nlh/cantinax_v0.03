export interface Province {
  id: string;
  name: string;
  municipalities: string[];
}

export const provinces: Province[] = [
  {
    id: 'habana',
    name: 'La Habana',
    municipalities: [
      'Playa',
      'Plaza de la Revolución',
      'Centro Habana',
      'Habana Vieja',
      'Regla',
      'Habana del Este',
      'Guanabacoa',
      'San Miguel del Padrón',
      'Diez de Octubre',
      'Cerro',
      'Marianao',
      'La Lisa',
      'Boyeros',
      'Arroyo Naranjo',
      'Cotorro'
    ]
  },
  {
    id: 'mayabeque',
    name: 'Mayabeque',
    municipalities: [
      'San José de las Lajas',
      'Bejucal'
    ]
  },
  {
    id: 'artemisa',
    name: 'Artemisa',
    municipalities: [
      'Bauta',
      'Güira de Melena',
      'Caimito',
      'San Antonio de los Baños'
    ]
  }
];

/*
- Mayabeque: Bejucal y San José de las Lajas
- Artemisa: Güira de melena, San Antonio, Bauta y Caimito
*/