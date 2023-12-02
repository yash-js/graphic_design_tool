export default function fileToBase64(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        resolve(null);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}
export function getBase64ImageUrl(img: any) {
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx: any = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  var dataURL: any = canvas.toDataURL('image/png');
  return dataURL.replace(/^data:image\/?[A-z]*;base64,/);
}
