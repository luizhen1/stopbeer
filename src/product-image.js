import { seedProducts } from "./data";

export function fallbackProductImage(product) {
  const matchingSeed = seedProducts.find(
    (seed) => seed.id === product.id || seed.name === product.name,
  );
  const matchingCategory = seedProducts.find(
    (seed) => seed.category === product.category,
  );

  return (
    matchingSeed?.imageUrl ||
    matchingCategory?.imageUrl ||
    seedProducts[0].imageUrl
  );
}

export function handleProductImageError(event, product) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;

  image.dataset.fallbackApplied = "true";
  image.src = fallbackProductImage(product);
}
