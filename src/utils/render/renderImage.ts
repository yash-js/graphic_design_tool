import type { ImageObject } from '~/config/types';

export default function renderImage({
  context,
  x,
  y,
  width,
  height,
  opacity,
  imageElement,
}: {
  context: CanvasRenderingContext2D;
} & Omit<ImageObject, 'type'>): void {
  context.globalAlpha = opacity / 100;

  if (imageElement) {
    console.log('imageegeege', context, x, y, width, height, opacity, imageElement);
    console.log('x, y', x, y, width, height, opacity, imageElement);
    console.log('width', width, height, opacity, imageElement);
    console.log('imageElement', height, opacity, imageElement);
    context.drawImage(imageElement, x, y, width, height);
  }

  context.globalAlpha = 1;
}
