import { AnyKindOfDictionary } from 'lodash';
import getDimensionsFromImage from './getDimensionsFromImage';
import getImageElementFromUrl from './getImageElementFromUrl';

export const exportToJson = async (elem: any, canvasWorkingSize: any, contextRef: any, canvasObjects: any) => {
  try {
    const commonPushImageObject = async (url: any) => {
      const imageElement = await getImageElementFromUrl(url);
      const dimensions = await getDimensionsFromImage({
        context: contextRef?.current,
        imageObject: { x: canvasObjects?.x, y: canvasObjects?.y, imageElement },
      });
      return dimensions;
    };

    const ctx = elem.getContext('2d');
    const dataURL = elem.toDataURL('image/*', 1.0); // JPEG format with full quality (adjust as needed)

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = dataURL;

    img.onload = async () => {
      ctx.drawImage(img, 0, 0, elem.width, elem.height);

      const texts = [
        {
          content: 'Happy 1st Birthday!',
          x: elem.width / 2,
          y: elem.height / 2,
          font: '20px Arial',
          color: 'white',
          align: 'center',
        },
        // Add more text objects as needed
      ];

      texts.forEach((textObj: any) => {
        ctx.font = textObj.font;
        ctx.fillStyle = textObj.color;
        ctx.textAlign = textObj.align;

        const textWidth = ctx.measureText(textObj.content).width;
        ctx.fillText(textObj.content, textObj.x - (textObj.align === 'center' ? textWidth / 2 : 0), textObj.y);

        textObj.width = textWidth;
        textObj.height = parseInt(textObj.font);
      });

      const ImgObj = await commonPushImageObject(dataURL);

      const jsonContent = {
        canvas: {
          width: elem.width,
          height: elem.height,
        },
        image: {
          url: 'https://images.unsplash.com/photo-1701220293175-5c17f172b77a?q=80&w=1915&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          position: {
            x: ImgObj.x,
            y: ImgObj.y,
          },
          dimensions: {
            width: ImgObj.width,
            height: ImgObj.height,
          },
        },
        texts: texts,
      };

      const jsonString = JSON.stringify(canvasObjects);
      console.log('jsonString', jsonString);

      // Here you can perform further actions like sending the JSON data to a server or saving it as a file
    };
  } catch (error) {
    console.error('Error exporting to JSON:', error);
  }
};
