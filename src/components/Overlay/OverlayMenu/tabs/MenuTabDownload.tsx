import { Button, Checkbox } from '@mantine/core';
import React, { useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import styled from 'styled-components';

import CanvasPreview from '~/components/CanvasPreview';
import { CANVAS_PREVIEW_UNIQUE_ID } from '~/config/globalElementIds';
import useCanvasBackgroundColor from '~/store/useCanvasBackgroundColor';
import useCanvasWorkingSize from '~/store/useCanvasWorkingSize';
import useDefaultParams from '~/store/useDefaultParams';
import generateUniqueId from '~/utils/generateUniqueId';

import { H4 } from '../commonTabComponents';
import useCanvasElem from '~/store/useCanvasElem';
import { exportToJson } from '~/utils/exportJson';
import useCanvasContext from '~/context/useCanvasContext';
import useCanvasObjects from '~/store/useCanvasObjects';

const DownloadButtonsGridDiv = styled.div`
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-gap: 0.5rem;
  margin-bottom: 1rem;
`;

export default function MenuTabDownload() {
  const defaultParams = useDefaultParams((state) => state.defaultParams);
  const { canvasElement, setCanvasElement } = useCanvasElem()
  const { canvasRef, contextRef } = useCanvasContext();
  const canvasObjects = useCanvasObjects((state) => state.canvasObjects);

  const canvasWorkingSize = useCanvasWorkingSize((state) => state.canvasWorkingSize);

  const canvasBackgroundColor = useCanvasBackgroundColor((state) => state.canvasBackgroundColor);
  const setCanvasBackgroundColor = useCanvasBackgroundColor((state) => state.setCanvasBackgroundColor);

  const downloadCanvas = async (type: 'png' | 'jpg' | 'json') => {
    if (type == 'json') {
      const canvas = document.getElementById(CANVAS_PREVIEW_UNIQUE_ID) as HTMLCanvasElement;
      const image = canvas.toDataURL();
      // localStorage.setItem("imageimage", image)
      await exportToJson(canvasElement, canvasWorkingSize, contextRef, canvasObjects)
    } else {
      const canvas = document.getElementById(CANVAS_PREVIEW_UNIQUE_ID) as HTMLCanvasElement;
      const image = canvas.toDataURL();
      const a = document.createElement('a');
      a.download = `${generateUniqueId()}.${type}`;
      a.href = image;
      a.click();
      a.remove();
    }

  };


  useEffect(() => {
    const canvasEl: HTMLElement | null = document.getElementById('workingCanvas')!

    if (canvasEl) {
      setCanvasElement(canvasEl)
      // console.log("ctxctx", canvasRef.getContext("2d"));

    }
  }, [])


  return (
    <>
      <H4>Download</H4>
      <DownloadButtonsGridDiv>
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            downloadCanvas('png');
          }}
          leftIcon={<FaDownload />}
        >
          PNG
        </Button>
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            downloadCanvas('jpg');
          }}
          leftIcon={<FaDownload />}
        >
          JPG
        </Button>
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            downloadCanvas('json');
          }}
          leftIcon={<FaDownload />}
        >
          JSON
        </Button>
      </DownloadButtonsGridDiv>
      <H4>
        Preview<span>{`${canvasWorkingSize.width} x ${canvasWorkingSize.height} px`}</span>
      </H4>
      <CanvasPreview />
      <Checkbox
        sx={{ marginTop: '1rem' }}
        size="sm"
        label="Transparent Background"
        checked={canvasBackgroundColor === 'transparent'}
        onChange={(event) => {
          if (event.target.checked) {
            setCanvasBackgroundColor('transparent');
          } else {
            setCanvasBackgroundColor(defaultParams.canvasBackgroundColor);
          }
        }}
      />
    </>
  );
}
