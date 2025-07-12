import { Card } from '../types';

// Baralho de Países
export const paisesCards: Card[] = [
  {
    id: 'brasil',
    name: 'Brasil',
    attributes: {
      'População': 215000000,
      'Área': 8515767,
      'PIB': 2055506,
      'IDH': 765
    },
    description: 'O maior país da América do Sul'
  },
  {
    id: 'china',
    name: 'China',
    attributes: {
      'População': 1439323776,
      'Área': 9596961,
      'PIB': 14342903,
      'IDH': 761
    },
    description: 'O país mais populoso do mundo'
  },
  {
    id: 'eua',
    name: 'Estados Unidos',
    attributes: {
      'População': 331002651,
      'Área': 9833517,
      'PIB': 21427700,
      'IDH': 926
    },
    description: 'A maior economia mundial'
  },
  {
    id: 'russia',
    name: 'Rússia',
    attributes: {
      'População': 145934462,
      'Área': 17098242,
      'PIB': 1829734,
      'IDH': 824
    },
    description: 'O maior país do mundo em área'
  },
  {
    id: 'india',
    name: 'Índia',
    attributes: {
      'População': 1380004385,
      'Área': 3287263,
      'PIB': 3173398,
      'IDH': 645
    },
    description: 'O segundo país mais populoso'
  },
  {
    id: 'alemanha',
    name: 'Alemanha',
    attributes: {
      'População': 83783942,
      'Área': 357114,
      'PIB': 4259935,
      'IDH': 947
    },
    description: 'A maior economia da Europa'
  },
  {
    id: 'japao',
    name: 'Japão',
    attributes: {
      'População': 126476461,
      'Área': 377930,
      'PIB': 4937422,
      'IDH': 919
    },
    description: 'Terra do sol nascente'
  },
  {
    id: 'canada',
    name: 'Canadá',
    attributes: {
      'População': 37742154,
      'Área': 9984670,
      'PIB': 1736426,
      'IDH': 929
    },
    description: 'O segundo maior país do mundo'
  }
];

// Baralho de Capitais
export const capitaisCards: Card[] = [
  {
    id: 'brasilia',
    name: 'Brasília',
    attributes: {
      'População': 3055149,
      'Altitude': 1172,
      'Fundação': 1960,
      'Área Urbana': 5802
    },
    description: 'Capital do Brasil'
  },
  {
    id: 'pequim',
    name: 'Pequim',
    attributes: {
      'População': 21542000,
      'Altitude': 43,
      'Fundação': 1045,
      'Área Urbana': 16411
    },
    description: 'Capital da China'
  },
  {
    id: 'washington',
    name: 'Washington D.C.',
    attributes: {
      'População': 705749,
      'Altitude': 125,
      'Fundação': 1790,
      'Área Urbana': 177
    },
    description: 'Capital dos Estados Unidos'
  },
  {
    id: 'moscou',
    name: 'Moscou',
    attributes: {
      'População': 12506468,
      'Altitude': 156,
      'Fundação': 1147,
      'Área Urbana': 2511
    },
    description: 'Capital da Rússia'
  },
  {
    id: 'nova_delhi',
    name: 'Nova Delhi',
    attributes: {
      'População': 28514000,
      'Altitude': 216,
      'Fundação': 1911,
      'Área Urbana': 1484
    },
    description: 'Capital da Índia'
  },
  {
    id: 'berlim',
    name: 'Berlim',
    attributes: {
      'População': 3669491,
      'Altitude': 34,
      'Fundação': 1237,
      'Área Urbana': 892
    },
    description: 'Capital da Alemanha'
  },
  {
    id: 'toquio',
    name: 'Tóquio',
    attributes: {
      'População': 37400068,
      'Altitude': 40,
      'Fundação': 1457,
      'Área Urbana': 13572
    },
    description: 'Capital do Japão'
  },
  {
    id: 'ottawa',
    name: 'Ottawa',
    attributes: {
      'População': 994837,
      'Altitude': 70,
      'Fundação': 1826,
      'Área Urbana': 2790
    },
    description: 'Capital do Canadá'
  }
];

// Mapeamento dos baralhos
export const DECK_CARDS: { [key: string]: Card[] } = {
  'paises': paisesCards,
  'capitais': capitaisCards,
};

export const getDeckCards = (deckId: string): Card[] => {
  return DECK_CARDS[deckId] || [];
};