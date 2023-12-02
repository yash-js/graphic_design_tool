import React, { useRef, type PointerEvent, useState, type Touch, type TouchEvent } from 'react';
import { useEffect } from 'react';
import styled from 'styled-components';

import { TRANSPARENT_BACKGROUND_IMAGE } from '~/config/constants';
import { APP_FIXED_MAIN_UNIQUE_ID } from '~/config/globalElementIds';
import { CANVAS_CONTROLS_OVERLAY } from '~/config/globalElementIds';
import type { ActionModeOption } from '~/config/types';
import useCanvasContext from '~/context/useCanvasContext';
import useActionMode from '~/store/useActionMode';
import useActiveObjectId from '~/store/useActiveObjectId';
import useCanvasElem from '~/store/useCanvasElem';
import useCanvasObjects from '~/store/useCanvasObjects';
import useCanvasWorkingSize from '~/store/useCanvasWorkingSize';
import useDefaultParams from '~/store/useDefaultParams';
import useScrollPosition from '~/store/useScrollPosition';
import useUserMode from '~/store/useUserMode';
import useWindowSize from '~/store/useWindowSize';
import useZoom from '~/store/useZoom';
import theme from '~/theme';
import { exportToJson } from '~/utils/exportJson';
import generateUniqueId from '~/utils/generateUniqueId';
import getControlPoints from '~/utils/getControlPoints';
import getCursorFromModes from '~/utils/getCursorFromModes';
import getDimensionsFromFreeDraw from '~/utils/getDimensionsFromFreeDraw';
import getDimensionsFromImage from '~/utils/getDimensionsFromImage';
import getImageElementFromUrl from '~/utils/getImageElementFromUrl';
import getRelativeMousePositionOnCanvas from '~/utils/getRelativeMousePositionOnCanvas';
import isCursorWithinRectangle from '~/utils/isCursorWithinRectangle';
import UnsplashImageButton, { type OptionItem } from './Overlay/OverlaySidebar/controls/TempalteControl/UnsplashImageButton'
const FixedMain = styled.main`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: ${theme.layers.canvasApp};
  user-select: none;
`;

type PointerOrTouchEvent = PointerEvent<HTMLElement> | TouchEvent<HTMLElement>;

export default function Canvas() {
  const { canvasRef, contextRef, drawEverything } = useCanvasContext();
  const previousTouchRef = useRef<Touch | null>(null);
  const distanceBetweenTouchesRef = useRef<number>(0);
  const { canvasElement, setCanvasElement } = useCanvasElem()

  const windowSize = useWindowSize((state) => state.windowSize);

  const activeObjectId = useActiveObjectId((state) => state.activeObjectId);
  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId);

  const canvasObjects = useCanvasObjects((state) => state.canvasObjects);
  const appendRectangleObject = useCanvasObjects((state) => state.appendRectangleObject);
  const appendEllipseObject = useCanvasObjects((state) => state.appendEllipseObject);
  const appendFreeDrawObject = useCanvasObjects((state) => state.appendFreeDrawObject);
  const appendTextObject = useCanvasObjects((state) => state.appendTextObject);
  const updateCanvasObject = useCanvasObjects((state) => state.updateCanvasObject);
  const setCanvasObject = useCanvasObjects((state) => state.setCanvasObject);
  const appendFreeDrawPointToCanvasObject = useCanvasObjects((state) => state.appendFreeDrawPointToCanvasObject);
  const moveCanvasObject = useCanvasObjects((state) => state.moveCanvasObject);
  const resizeCanvasObject = useCanvasObjects((state) => state.resizeCanvasObject);

  const canvasWorkingSize = useCanvasWorkingSize((state) => state.canvasWorkingSize);

  const defaultParams = useDefaultParams((state) => state.defaultParams);

  const incrementZoom = useZoom((state) => state.incrementZoom);
  const decrementZoom = useZoom((state) => state.decrementZoom);

  const scrollPosition = useScrollPosition((state) => state.scrollPosition);
  const updateScrollPosition = useScrollPosition((state) => state.updateScrollPosition);

  const userMode = useUserMode((state) => state.userMode);
  const setUserMode = useUserMode((state) => state.setUserMode);

  const actionMode = useActionMode((state) => state.actionMode);
  const setActionMode = useActionMode((state) => state.setActionMode);

  const zoom = useZoom((state) => state.zoom);

  const initialDrawingPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageUrl, setImageUrl] = useState<string>('');
  const appendImageObject = useCanvasObjects((state) => state.appendImageObject);

  const activeObject = canvasObjects.find((canvasObject) => canvasObject.id === activeObjectId);
  const pushImageObject = async ({ imageUrl, imageElement, dimensions }: OptionItem) => {
    setImageUrl(imageUrl);
    const createdObjectId = generateUniqueId();
    appendImageObject({
      id: createdObjectId,
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height,
      opacity: 100,
      imageUrl,
      imageElement,
    });
    setActiveObjectId(createdObjectId);
    setUserMode('select');
  };
  // console.log('canvasRef', canvasRef)
  // On pointer down
  const commonPushImageObject = async (url: string) => {
    const imageElement = await getImageElementFromUrl(url);
    console.log('IMAGGE', imageElement)
    const dimensions = await getDimensionsFromImage({
      context: contextRef?.current,
      imageObject: { x: 0, y: 0, imageElement },
    });
    console.log('dimensions', dimensions)
    return imageElement

  };
  const onPointerDown = (event: PointerOrTouchEvent) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const clientX = 'clientX' in event ? event.clientX : event.touches[0]?.clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0]?.clientY;

    const relativeMousePosition = getRelativeMousePositionOnCanvas({
      windowMouseX: clientX,
      windowMouseY: clientY,
      canvasWorkingSize,
      scrollPosition,
      zoom,
    });

    initialDrawingPositionRef.current = {
      x: relativeMousePosition.relativeMouseX,
      y: relativeMousePosition.relativeMouseY,
    };
    const createdObjectId = generateUniqueId();

    switch (userMode) {
      case 'icon':
      case 'image':
      case 'select': {
        let isResizing = false;
        // Resize object
        if (activeObject) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { position, ...boxes } = getControlPoints({
            canvasObject: activeObject,
            zoom,
          });
          Object.entries(boxes).forEach(([boxName, box]) => {
            const isWithinBounds = isCursorWithinRectangle({
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              relativeMouseX: initialDrawingPositionRef.current.x,
              relativeMouseY: initialDrawingPositionRef.current.y,
            });
            if (isWithinBounds) {
              isResizing = true;
              setActionMode({
                type: 'isResizing',
                option: boxName.split('Box')[0] as ActionModeOption,
              });
            }
          });
        }
        if (!isResizing) {
          const clickedObjects = canvasObjects.filter((canvasObject) => {
            return isCursorWithinRectangle({
              x: canvasObject.x,
              y: canvasObject.y,
              width: canvasObject.width,
              height: canvasObject.height,
              relativeMouseX: initialDrawingPositionRef.current.x,
              relativeMouseY: initialDrawingPositionRef.current.y,
            });
          });
          const clickedObject = clickedObjects[clickedObjects.length - 1];
          const wasClickInsideWorkingCanvas = isCursorWithinRectangle({
            x: 0,
            y: 0,
            width: canvasWorkingSize.width,
            height: canvasWorkingSize.height,
            relativeMouseX: initialDrawingPositionRef.current.x,
            relativeMouseY: initialDrawingPositionRef.current.y,
          });
          const shouldClearSelection = !wasClickInsideWorkingCanvas && clickedObject?.id !== activeObjectId;
          setActiveObjectId(shouldClearSelection ? null : clickedObject?.id || null);
          if (clickedObject) {
            setUserMode('select');
            setActionMode({ type: 'isMoving' });
          } else {
            setActionMode({ type: 'isPanning' });
          }
        }
        drawEverything();
        break;
      }
      case 'free-draw': {
        appendFreeDrawObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 0,
          height: 0,
          strokeColorHex: defaultParams.strokeColorHex,
          strokeWidth: 1,
          opacity: 100,
          freeDrawPoints: [
            {
              x: initialDrawingPositionRef.current.x,
              y: initialDrawingPositionRef.current.y,
            },
          ],
        });
        setActiveObjectId(createdObjectId);
        setActionMode({ type: 'isDrawing' });
        break;
      }
      case 'rectangle': {
        appendRectangleObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 0,
          height: 0,
          backgroundColorHex: defaultParams.backgroundColorHex,
          strokeColorHex: defaultParams.strokeColorHex,
          strokeWidth: 0,
          opacity: 100,
          borderRadius: 0,
        });
        setActiveObjectId(createdObjectId);
        setActionMode({ type: 'isDrawing' });
        break;
      }
      case 'ellipse': {
        appendEllipseObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 0,
          height: 0,
          backgroundColorHex: defaultParams.backgroundColorHex,
          strokeColorHex: defaultParams.strokeColorHex,
          strokeWidth: 0,
          opacity: 100,
          borderRadius: 0,
        });
        setActiveObjectId(createdObjectId);
        setActionMode({ type: 'isDrawing' });
        break;
      }
      case 'text': {
        appendTextObject({
          id: createdObjectId,
          x: initialDrawingPositionRef.current.x,
          y: initialDrawingPositionRef.current.y,
          width: 200,
          height: 100,
          text: 'Add text',
          textAlignHorizontal: 'center',
          textAlignVertical: 'middle',
          textJustify: false,
          fontColorHex: defaultParams.fontColorHex,
          fontSize: 44,
          fontFamily: 'sans-serif',
          fontStyle: 'normal',
          fontWeight: 'normal',
          fontVariant: 'normal',
          fontLineHeightRatio: 1,
          opacity: 100,
        });
        setActiveObjectId(createdObjectId);
        setUserMode('select');
        setActionMode(null);
        break;
      }
      default:
        break;
    }
  };

  // On pointer move

  const onPointerMove = (event: PointerOrTouchEvent) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context || !actionMode) return;

    const clientX = 'clientX' in event ? event.clientX : event.touches[0]?.clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0]?.clientY;

    const finger0PageX = 'touches' in event ? event.touches[0]?.pageX : null;
    const finger0PageY = 'touches' in event ? event.touches[0]?.pageY : null;

    const finger1PageX = 'touches' in event ? event.touches[1]?.pageX : null;
    const finger1PageY = 'touches' in event ? event.touches[1]?.pageY : null;

    if (finger0PageX !== null && finger0PageY !== null && finger1PageX !== null && finger1PageY !== null) {
      const distanceBetweenTouches = Math.hypot(finger0PageX - finger1PageX, finger0PageY - finger1PageY);

      if (distanceBetweenTouchesRef.current) {
        if (distanceBetweenTouches > distanceBetweenTouchesRef.current) {
          incrementZoom(1);
        } else if (distanceBetweenTouches < distanceBetweenTouchesRef.current) {
          decrementZoom(1);
        }
      }

      distanceBetweenTouchesRef.current = distanceBetweenTouches;
    }

    const movementX =
      'movementX' in event
        ? event.movementX
        : previousTouchRef.current?.pageX
          ? event.touches[0].pageX - previousTouchRef.current.pageX
          : 0;

    const movementY =
      'movementY' in event
        ? event.movementY
        : previousTouchRef.current?.pageY
          ? event.touches[0].pageY - previousTouchRef.current.pageY
          : 0;

    if ('touches' in event) {
      previousTouchRef.current = event.touches[0];
    }

    const relativeMousePosition = getRelativeMousePositionOnCanvas({
      windowMouseX: clientX,
      windowMouseY: clientY,
      canvasWorkingSize,
      scrollPosition,
      zoom,
    });

    const finalX = relativeMousePosition.relativeMouseX;
    const finalY = relativeMousePosition.relativeMouseY;

    switch (userMode) {
      case 'select': {
        if (activeObjectId && actionMode.type === 'isMoving') {
          moveCanvasObject({
            id: activeObjectId,
            deltaPosition: {
              deltaX: movementX / (zoom / 100),
              deltaY: movementY / (zoom / 100),
            },
            canvasWorkingSize,
          });
        } else if (activeObjectId && actionMode.type === 'isResizing' && actionMode.option) {
          resizeCanvasObject({
            id: activeObjectId,
            actionModeOption: actionMode.option,
            delta: {
              deltaX: movementX / (zoom / 100),
              deltaY: movementY / (zoom / 100),
            },
            canvasWorkingSize,
          });
        } else if (actionMode.type === 'isPanning') {
          updateScrollPosition({
            deltaX: movementX,
            deltaY: movementY,
          });
        }
        break;
      }
      case 'free-draw': {
        if (activeObjectId) {
          appendFreeDrawPointToCanvasObject(activeObjectId, {
            x: finalX,
            y: finalY,
          });
        }
        break;
      }
      case 'rectangle':
      case 'ellipse': {
        if (activeObjectId) {
          const topLeftX = Math.min(initialDrawingPositionRef.current.x, finalX);
          const topLeftY = Math.min(initialDrawingPositionRef.current.y, finalY);

          const width = Math.abs(initialDrawingPositionRef.current.x - finalX);
          const height = Math.abs(initialDrawingPositionRef.current.y - finalY);

          updateCanvasObject(activeObjectId, {
            x: topLeftX,
            y: topLeftY,
            width,
            height,
          });
        }
        break;
      }
      default: {
        break;
      }
    }
  };

  // On pointer up

  const onPointerUp = (event: PointerOrTouchEvent) => {
    event.preventDefault();
    setActionMode(null);
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    previousTouchRef.current = null;
    if ('touches' in event) {
      distanceBetweenTouchesRef.current = 0;
    }

    switch (userMode) {
      case 'select': {
        break;
      }
      case 'text': {
        break;
      }
      case 'free-draw': {
        context.closePath();
        if (activeObject) {
          const dimensions = getDimensionsFromFreeDraw({
            freeDrawObject: activeObject,
          });
          updateCanvasObject(activeObject.id, {
            width: dimensions.width,
            height: dimensions.height,
          });
        }
        setUserMode('select');
        drawEverything();
        break;
      }
      case 'rectangle':
      case 'ellipse': {
        setUserMode('select');
        drawEverything();
        break;
      }
      default: {
        break;
      }
    }
  };
  const showPreviews = async () => {
    const jsonData = [
      {
        id: 1,
        "canvas": { "width": 1915, "height": 2681 },
        "image": {
          "url": localStorage ? localStorage?.getItem("imageimage") : null
          ,
          "position": {},
          "dimensions": { "width": 1915, "height": 2681 }
        },
        "texts": [
          {
            "content": "Happy 1st Birthday!",
            "x": 957.5,
            "y": 1340.5,
            "font": "20px Arial",
            "color": "white",
            "align": "center",
            "width": 174.53125,
            "height": 20
          }
        ]
      }];
    const container = document.getElementById('imgContainer');
    const currentObj = [{ "x": 599.0070921985815, "y": 263.1914893617021, "width": 200, "height": 100, "backgroundColorHex": "#000000", "strokeColorHex": "#000000", "strokeWidth": 1, "opacity": 100, "borderRadius": 0, "freeDrawPoints": [], "text": "TESTTTT", "textJustify": false, "textAlignHorizontal": "right", "textAlignVertical": "middle", "fontColorHex": "#ec0404", "fontSize": 197, "fontFamily": "sans-serif", "fontStyle": "italic", "fontVariant": "small-caps", "fontWeight": "bold", "fontLineHeightRatio": 1, "svgPath": "", "imageUrl": "", "imageElement": null, "type": "text", "id": "b4fb1f4d-05a7-439a-b1cb-9f85119156f1" }, { "x": 70.80851063829785, "y": 50.8368794326241, "width": 400, "height": 600, "backgroundColorHex": "#000000", "strokeColorHex": "#000000", "strokeWidth": 1, "opacity": 100, "borderRadius": 0, "freeDrawPoints": [], "text": "", "textJustify": false, "textAlignHorizontal": "center", "textAlignVertical": "middle", "fontColorHex": "#000000", "fontSize": 48, "fontFamily": "sans-serif", "fontStyle": "normal", "fontVariant": "normal", "fontWeight": "normal", "fontLineHeightRatio": 1, "svgPath": "", "imageUrl": "https://images.unsplash.com/photo-1545486332-9e0999c535b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MzQ0NDN8MHwxfHNlYXJjaHwzfHxibGFja3xlbnwwfHx8fDE3MDE0MTI0OTN8MA&ixlib=rb-4.0.3&q=80&w=400", "imageElement": {}, "type": "image", "id": "093c040a-1ff0-4cea-9275-828208bcc211" }, { "x": 412.97872340425545, "y": 265.98581560283696, "width": 200, "height": 100, "backgroundColorHex": "#000000", "strokeColorHex": "#000000", "strokeWidth": 1, "opacity": 100, "borderRadius": 0, "freeDrawPoints": [], "text": "TESTTTT", "textJustify": false, "textAlignHorizontal": "right", "textAlignVertical": "middle", "fontColorHex": "#ec0404", "fontSize": 197, "fontFamily": "sans-serif", "fontStyle": "italic", "fontVariant": "small-caps", "fontWeight": "bold", "fontLineHeightRatio": 1, "svgPath": "", "imageUrl": "", "imageElement": null, "type": "text", "id": "93934a0c-33bb-47d7-8105-eba12fdb699d" }]
    const imgEle = document.createElement('img')!;
    if (imgEle) {
      await currentObj.map(async (obj: any) => obj.imageElement = await commonPushImageObject(localStorage ? localStorage?.getItem("imageimage") : null))
      // @ts-ignore
      imgEle.src = localStorage ? localStorage?.getItem("imageimage") : null;

      // @ts-ignore
      imgEle.onclick = () => setCanvasObject(currentObj)
      imgEle.style.width = '100%';
      imgEle.style.border = '1px solid gray';
      imgEle.style.padding = '10px';
      imgEle.style.backgroundColor = 'white';
      container?.appendChild(imgEle);
    }
    jsonData && jsonData.length && jsonData.forEach(async data => {

      // @ts-ignore

      // const ctx = canvas.getContext('2d');
      // if (ctx) {
      //   const img = new Image();
      //   img.onload = function () {
      //     ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      data.texts.forEach((text: any) => {
        // @ts-ignore
        ;
        console.log('text', text)

      });
      //     // Convert canvas to data URL
      //     const dataURL = canvas.toDataURL();
      //     // @ts-ignore
      //     document.getElementById('previewImage').src = dataURL;
      //   };
      //   img.src = data.image.url;
      //   return
      // }
      // return
    });
  };
  useEffect(() => {
    if (userMode == 'template') {
      showPreviews()
    }
    return () => { }
  }, [userMode])

  useEffect(() => {
    console.log("canvasObjects", canvasObjects)
  }, [canvasObjects])

  // imageData variable now contains the pixel data of the canvas
  return (
    <FixedMain
      id={APP_FIXED_MAIN_UNIQUE_ID}
      style={{
        cursor: getCursorFromModes({ userMode, actionMode }),
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      <canvas
        id={CANVAS_CONTROLS_OVERLAY}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${windowSize.width}px`,
          height: `${windowSize.height}px`,
          zIndex: theme.layers.canvasElement + 1,
        }}
        width={windowSize.width}
        height={windowSize.height}
      />
      <div
        style={{
          position: 'absolute',
          top: scrollPosition.y,
          left: scrollPosition.x,
          width: `${canvasWorkingSize.width}px`,
          height: `${canvasWorkingSize.height}px`,
          transform: `scale(${zoom / 100})`,
          zIndex: theme.layers.canvasElement,
          backgroundImage: `url(${TRANSPARENT_BACKGROUND_IMAGE})`,
          backgroundColor: 'white',
        }}
      >
        <h1
          style={{
            position: 'absolute',
            top: `${-38 / (zoom / 100)}px`,
            left: '0',
            width: `${Number.MAX_SAFE_INTEGER}px`,
            color: 'white',
            fontSize: `${20 / (zoom / 100)}px`,
          }}
        >
          {`${canvasWorkingSize.width} x ${canvasWorkingSize.height} px`}
        </h1>
        <canvas id='workingCanvas' ref={canvasRef} width={canvasWorkingSize.width} height={canvasWorkingSize.height} />
      </div>
    </FixedMain>
  );
}
