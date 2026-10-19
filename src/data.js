export const seedProducts = [
  {
    id: "p1",
    name: "Heineken Lager 350ml",
    description: "Cerveja puro malte, leve e refrescante. Lata gelada.",
    category: "Cervejas",
    price: 5.49,
    stock: 48,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=900&q=85",
    badge: "Mais pedida",
  },
  {
    id: "p2",
    name: "Budweiser 350ml",
    description: "American lager de sabor marcante e final suave.",
    category: "Cervejas",
    price: 4.79,
    stock: 36,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1543308922-6b60a73f48a1?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p3",
    name: "Corona Extra 330ml",
    description: "Uma cerveja leve, perfeita com limão e bons momentos.",
    category: "Cervejas",
    price: 7.49,
    stock: 24,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=900&q=85",
    badge: "Premium",
  },
  {
    id: "p4",
    name: "Original 600ml",
    description: "O sabor clássico do boteco brasileiro, para compartilhar.",
    category: "Cervejas",
    price: 10.9,
    stock: 18,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p5",
    name: "Gin Tanqueray 750ml",
    description: "London Dry clássico, com notas de zimbro e cítricos.",
    category: "Destilados",
    price: 119.9,
    stock: 9,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=85",
    badge: "Favorito",
  },
  {
    id: "p6",
    name: "Vodka Absolut 1L",
    description: "Vodka sueca premium, ideal para drinks e celebrações.",
    category: "Destilados",
    price: 99.9,
    stock: 12,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p7",
    name: "Coca-Cola 2L",
    description: "Acompanhamento indispensável para qualquer ocasião.",
    category: "Refrigerantes",
    price: 11.99,
    stock: 30,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p8",
    name: "Combo Noite Boa",
    description: "12 Heineken 350ml + 1 saco de gelo de 3kg. Tudo gelado!",
    category: "Combos/Gelo",
    price: 69.9,
    stock: 15,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85",
    badge: "Combo especial",
  },
  {
    id: "p9",
    name: "Gelo em cubos 3kg",
    description: "Gelo filtrado, pacote de 3kg. Pronto para gelar.",
    category: "Combos/Gelo",
    price: 12.0,
    stock: 40,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1778393719113-a2d80861e63a?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p10",
    name: "Vinho Casillero del Diablo",
    description: "Cabernet Sauvignon chileno, encorpado e elegante.",
    category: "Vinhos",
    price: 72.9,
    stock: 8,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p11",
    name: "Red Bull 250ml",
    description: "Bebida energética gelada para manter o ritmo.",
    category: "Não Alcoólicos",
    price: 10.9,
    stock: 22,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "p12",
    name: "Espumante Chandon Brut",
    description: "Brut brasileiro, fresco e vibrante para brindar.",
    category: "Vinhos",
    price: 89.9,
    stock: 6,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1581775120934-9851ea6cf3e4?auto=format&fit=crop&w=900&q=85",
    badge: "Para brindar",
  },
];

export const categories = [
  "Todas",
  "Cervejas",
  "Destilados",
  "Vinhos",
  "Refrigerantes",
  "Não Alcoólicos",
  "Combos/Gelo",
];
export const brl = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(n) || 0,
  );
