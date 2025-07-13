// src/data/decks.ts

import { Card, Deck } from '../types';

// Baralho de Países - EXPANDIDO PARA 32 CARTAS
export const paisesCards: Card[] = [
  // América do Norte
  {
    id: 'brasil',
    name: 'Brasil',
    image: 'https://flagcdn.com/w320/br.png',
    attributes: {
      'População': 215000000,
      'Área': 8515767,
      'PIB': 2055506,
      'IDH': 765
    },
    description: 'O maior país da América do Sul'
  },
  {
    id: 'eua',
    name: 'Estados Unidos',
    image: 'https://flagcdn.com/w320/us.png',
    attributes: {
      'População': 331002651,
      'Área': 9833517,
      'PIB': 21427700,
      'IDH': 926
    },
    description: 'A maior economia mundial'
  },
  {
    id: 'canada',
    name: 'Canadá',
    image: 'https://flagcdn.com/w320/ca.png',
    attributes: {
      'População': 37742154,
      'Área': 9984670,
      'PIB': 1736426,
      'IDH': 929
    },
    description: 'O segundo maior país do mundo'
  },
  {
    id: 'mexico',
    name: 'México',
    image: 'https://flagcdn.com/w320/mx.png',
    attributes: {
      'População': 128932753,
      'Área': 1964375,
      'PIB': 1289256,
      'IDH': 758
    },
    description: 'Maior país da América Central'
  },

  // América do Sul
  {
    id: 'argentina',
    name: 'Argentina',
    image: 'https://flagcdn.com/w320/ar.png',
    attributes: {
      'População': 45195774,
      'Área': 2780400,
      'PIB': 449663,
      'IDH': 845
    },
    description: 'Terra do tango e do futebol'
  },
  {
    id: 'colombia',
    name: 'Colômbia',
    image: 'https://flagcdn.com/w320/co.png',
    attributes: {
      'População': 50882891,
      'Área': 1141748,
      'PIB': 314464,
      'IDH': 767
    },
    description: 'Portal da América do Sul'
  },
  {
    id: 'peru',
    name: 'Peru',
    image: 'https://flagcdn.com/w320/pe.png',
    attributes: {
      'População': 32971854,
      'Área': 1285216,
      'PIB': 202014,
      'IDH': 777
    },
    description: 'Terra dos Incas'
  },
  {
    id: 'chile',
    name: 'Chile',
    image: 'https://flagcdn.com/w320/cl.png',
    attributes: {
      'População': 19116201,
      'Área': 756096,
      'PIB': 317058,
      'IDH': 851
    },
    description: 'País mais longo do mundo'
  },

  // Europa
  {
    id: 'alemanha',
    name: 'Alemanha',
    image: 'https://flagcdn.com/w320/de.png',
    attributes: {
      'População': 83783942,
      'Área': 357114,
      'PIB': 4259935,
      'IDH': 947
    },
    description: 'A maior economia da Europa'
  },
  {
    id: 'franca',
    name: 'França',
    image: 'https://flagcdn.com/w320/fr.png',
    attributes: {
      'População': 65273511,
      'Área': 643801,
      'PIB': 2937473,
      'IDH': 901
    },
    description: 'Terra da liberdade e cultura'
  },
  // ... (restante das cartas sem URL de imagem por brevidade)
  {
    id: 'reino_unido',
    name: 'Reino Unido',
    attributes: {
      'População': 67886011,
      'Área': 243610,
      'PIB': 3131378,
      'IDH': 932
    },
    description: 'Berço da revolução industrial'
  },
  {
    id: 'italia',
    name: 'Itália',
    attributes: {
      'População': 60461826,
      'Área': 301340,
      'PIB': 2106287,
      'IDH': 892
    },
    description: 'Berço do Império Romano'
  },
  {
    id: 'espanha',
    name: 'Espanha',
    attributes: {
      'População': 46754778,
      'Área': 505370,
      'PIB': 1394116,
      'IDH': 904
    },
    description: 'Terra de Cervantes e Gaudí'
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

  // Ásia
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
    id: 'coreia_sul',
    name: 'Coreia do Sul',
    attributes: {
      'População': 51269185,
      'Área': 100210,
      'PIB': 1810966,
      'IDH': 916
    },
    description: 'Tigre asiático tecnológico'
  },
  {
    id: 'indonesia',
    name: 'Indonésia',
    attributes: {
      'População': 273523615,
      'Área': 1904569,
      'PIB': 1289429,
      'IDH': 718
    },
    description: 'Maior arquipélago do mundo'
  },
  {
    id: 'tailandia',
    name: 'Tailândia',
    attributes: {
      'População': 69799978,
      'Área': 513120,
      'PIB': 543548,
      'IDH': 777
    },
    description: 'Terra dos sorrisos'
  },

  // Oriente Médio
  {
    id: 'arabia_saudita',
    name: 'Arábia Saudita',
    attributes: {
      'População': 34813871,
      'Área': 2149690,
      'PIB': 833541,
      'IDH': 854
    },
    description: 'Berço do Islã e maior produtor de petróleo'
  },
  {
    id: 'turquia',
    name: 'Turquia',
    attributes: {
      'População': 84339067,
      'Área': 783562,
      'PIB': 761425,
      'IDH': 838
    },
    description: 'Ponte entre Europa e Ásia'
  },
  {
    id: 'israel',
    name: 'Israel',
    attributes: {
      'População': 9216900,
      'Área': 20770,
      'PIB': 481591,
      'IDH': 919
    },
    description: 'Nação startup do mundo'
  },

  // África
  {
    id: 'nigeria',
    name: 'Nigéria',
    attributes: {
      'População': 206139589,
      'Área': 923768,
      'PIB': 432294,
      'IDH': 539
    },
    description: 'Gigante da África Ocidental'
  },
  {
    id: 'africa_sul',
    name: 'África do Sul',
    attributes: {
      'População': 59308690,
      'Área': 1221037,
      'PIB': 419015,
      'IDH': 709
    },
    description: 'Nação arco-íris'
  },
  {
    id: 'egito',
    name: 'Egito',
    attributes: {
      'População': 102334404,
      'Área': 1001450,
      'PIB': 469440,
      'IDH': 707
    },
    description: 'Terra dos faraós'
  },
  {
    id: 'marrocos',
    name: 'Marrocos',
    attributes: {
      'População': 36910560,
      'Área': 446550,
      'PIB': 132725,
      'IDH': 686
    },
    description: 'Portal da África'
  },

  // Oceania
  {
    id: 'australia',
    name: 'Austrália',
    attributes: {
      'População': 25499884,
      'Área': 7692024,
      'PIB': 1552667,
      'IDH': 944
    },
    description: 'Continente-país'
  },
  {
    id: 'nova_zelandia',
    name: 'Nova Zelândia',
    attributes: {
      'População': 4822233,
      'Área': 268838,
      'PIB': 249886,
      'IDH': 931
    },
    description: 'Terra dos kiwis'
  },

  // Países Nórdicos
  {
    id: 'noruega',
    name: 'Noruega',
    attributes: {
      'População': 5421241,
      'Área': 323802,
      'PIB': 482443,
      'IDH': 957
    },
    description: 'Terra dos fiordes'
  },
  {
    id: 'suecia',
    name: 'Suécia',
    attributes: {
      'População': 10099265,
      'Área': 450295,
      'PIB': 635664,
      'IDH': 945
    },
    description: 'Reino da inovação'
  },
  {
    id: 'suica',
    name: 'Suíça',
    attributes: {
      'População': 8654622,
      'Área': 41285,
      'PIB': 824734,
      'IDH': 955
    },
    description: 'Coração dos Alpes'
  },
  {
    id: 'singapura',
    name: 'Singapura',
    attributes: {
      'População': 5850342,
      'Área': 719,
      'PIB': 397720,
      'IDH': 938
    },
    description: 'Cidade-estado asiática'
  }
];

// Baralho de Capitais (mantém as 8 cartas originais)
export const capitaisCards: Card[] = [
  // ... (manter as capitais como estão, ou adicionar imagens também)
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