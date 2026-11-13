// Product-specific artwork served by this site. These IDs belong only to PetFlow.
const images: Record<string, string> = {
  "4be61856-8bfe-4733-af82-6080f033414d": "/images/protocolo-obstetrico-pequeno-porte.png",
  "75817cc0-6b40-45e5-bed8-92147ee08845": "/images/endoscopia-veterinaria-mvi-amigos.png",
  "267aae1e-e9de-4813-b0de-d90e8b714132": "/images/consulta-clinica-geral-pequeno-porte-trio.png",
  "2f3f0e00-b114-4d90-aa76-3f5201909611": "/images/consulta-clinica-geral-grande-porte.png",
  "983127cf-10cc-4cf9-9989-f3c0171afc11": "/images/oleo-ozonizado-mvi-elixir.png",
  "36a1d06a-ab42-4d2d-83e1-0216f52376de": "/images/vacina-antirrabica-companhia.png",
  "1842cb42-4688-401a-b35e-b85de25bb201": "/images/vacina-multiviral-felinos-gatos.png",
  "890db64e-17ed-41c5-9c0d-79fe0e030a7b": "/images/vacina-multiviral-caninos-destaque.png",
  "ce98a171-e3ab-419a-9c4e-1093557fc04c": "/images/consultoria-mvi-grande-porte.png",
  "7ced2f24-173f-4725-a741-0cb92b0f044f": "/images/consultoria-mvi-pequeno-porte-v2.webp",
  "2f9f167c-78ef-4a1a-bc2f-e8f4e8f7ddd3": "/images/consulta-especialista-mvi-grande-porte-v2.webp",
  "10fdc1d6-5c06-4418-bcf2-bf6aac46ac2c": "/images/consulta-especialista-mvi-pequeno-porte-v2.webp",
};

export function serviceImageForProduct(productId: string): string {
  return images[productId] ?? "";
}
