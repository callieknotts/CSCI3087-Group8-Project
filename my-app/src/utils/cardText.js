// What to show for one side of a card. A side has text, an image reference, or both.
// The backend only stores an image KEY (no way to upload or download images exists yet),
// so a side that is only an image shows a short note instead of the picture.
export const IMAGE_NOTE = '(This side is an image. Images cannot be shown yet.)';

export function sideText(side) {
  if (side?.text) return side.text;
  if (side?.image_key) return IMAGE_NOTE;
  return '';
}
