import { Input, Button, Loader, Tooltip, Group, Text } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { orderBy } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { BsImage, BsX } from 'react-icons/bs';
import { FaPlus, FaSearch, FaUnsplash, FaUpload } from 'react-icons/fa';
import styled from 'styled-components';

import { UnderlineLink } from '~/components/Link';
import ControlHeader from '~/components/Overlay/OverlaySidebar/components/ControlHeader';
import useCanvasContext from '~/context/useCanvasContext';
import useActiveObjectId from '~/store/useActiveObjectId';
import useCanvasObjects from '~/store/useCanvasObjects';
import useDefaultParams from '~/store/useDefaultParams';
import useUnsplashImages from '~/store/useUnsplashImages';
import useUserMode from '~/store/useUserMode';
import fetchImages from '~/utils/api/fetchImages';
import fileToBase64 from '~/utils/fileToBase64';
import generateUniqueId from '~/utils/generateUniqueId';
import getDimensionsFromImage from '~/utils/getDimensionsFromImage';
import getImageElementFromUrl from '~/utils/getImageElementFromUrl';
import notification from '~/utils/notification';

import UnsplashImageButton, { type OptionItem } from './UnsplashImageButton';
import useCanvasWorkingSize from '~/store/useCanvasWorkingSize';
import StrokeWidthControl from '../StrokeWidthControl';
const jsonData = [
  {
    id: 1,
    "canvas": { "width": 1915, "height": 2681 },
    "image": {
      "url": "https://images.unsplash.com/photo-1701220293175-5c17f172b77a?q=80&w=1915&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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



const GridDiv = styled.div`
  width: 100%;
  pointer-events: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
  border: 0.0625rem solid var(--color-borderPrimary);
  border-radius: 0.25rem;
`;

const ImageUrlForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  grid-gap: 5px;
`;

const SearchForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  grid-gap: 5px;
`;

const PoweredByP = styled.p`
  margin: 0;
  font-size: 0.7rem;
  margin-top: 0.5rem;

  & > svg {
    transform: translateY(1px);
    margin-right: 0.15rem;
  }
`;

const LoadingDiv = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
`;

interface Props {
  pageSize?: number;
}

export default function TemplateControl({ pageSize = 60 }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [visibleImages, setVisibleImages] = useState<number>(pageSize);
  const { contextRef } = useCanvasContext();

  const defaultParams = useDefaultParams((state) => state.defaultParams);
  const setDefaultParams = useDefaultParams((state) => state.setDefaultParams);

  const imageUrlInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const setActiveObjectId = useActiveObjectId((state) => state.setActiveObjectId);

  const setUserMode = useUserMode((state) => state.setUserMode);
  const userMode = useUserMode((state) => state.userMode);

  const unsplashImagesMap = useUnsplashImages((state) => state.unsplashImagesMap);
  const setUnsplashImages = useUnsplashImages((state) => state.setUnsplashImages);

  const appendImageObject = useCanvasObjects((state) => state.appendImageObject);

  const imagesToRender = orderBy(Object.values(unsplashImagesMap), ['fetchedAt'], ['desc'])
    //.filter(([slug]) => slug.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, visibleImages);

  const hasAlreadyFetched = Object.values(unsplashImagesMap).some((image) => image.query === defaultParams.searchQueryImages);

  useEffect(() => {
    setVisibleImages(pageSize);
  }, [pageSize, defaultParams.searchQueryImages]);
  const { canvasWorkingSize, setCanvasWorkingWidth, setCanvasWorkingHeight } = useCanvasWorkingSize()
  const pushImageObject = async ({ imageUrl, imageElement, dimensions }: OptionItem) => {
    setImageUrl(imageUrl);
    const wdth = dimensions.width > canvasWorkingSize.width ? (dimensions.width * 50) / 100 : dimensions.width
    const hght = dimensions.height > canvasWorkingSize.height ? (dimensions.height * 50) / 100 : dimensions.height
    const createdObjectId = generateUniqueId();
    if (dimensions.width > canvasWorkingSize.width) {
      setCanvasWorkingWidth(dimensions.width)
    }

    if (dimensions.height > canvasWorkingSize.height) {
      setCanvasWorkingHeight(dimensions.height)
    }

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

  const hasImages = imagesToRender.length > 0;





  const showPreviews = (id: any) => {

    const container = document.getElementById('imgContainer')
    jsonData.map((data: any) => {
      console.log('iddd', data?.id)
      const canvas = document.createElement('canvas')
      canvas.classList.add('img')
      canvas.style.width = '100%'
      canvas.style.border = '1px solid gray'
      canvas.style.padding = '10px'
      canvas.style.backgroundColor = 'white'
      container?.appendChild(canvas)
      const ctx = canvas.getContext('2d')!;

      // Load image onto canvas
      const img = new Image();
      img.onload = function () {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Add text onto canvas
        data?.texts.forEach((text: any) => {
          ctx.font = text.font;
          ctx.fillStyle = text.color;
          ctx.textAlign = text.align;
          ctx.fillText(text.content, text.x, text.y);
        });
      };
      img.src = data.image.url;
    })
  }
  // const showPreviews = async () => {

  //   const container = document.getElementById('imgContainer');

  //   jsonData && jsonData.length && await jsonData.forEach(data => {
  //     const canvas = document.createElement('canvas');
  //     canvas.classList.add('img');
  //     canvas.style.width = '100%';
  //     canvas.style.height = '200px'
  //     canvas.style.border = '1px solid gray';
  //     canvas.style.padding = '10px';
  //     canvas.style.backgroundColor = 'white';
  //     container?.appendChild(canvas);
  //     const ctx = canvas.getContext('2d');

  //     if (ctx) {
  //       const img = new Image();
  //       img.onload = async function () {
  //         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  //         if (data.texts) {
  //           await data.texts.forEach(text => {
  //             ctx.font = text.font;
  //             ctx.fillStyle = text.color;
  //             // @ts-ignore
  //             ctx.textAlign = text.align;
  //             ctx.fillText(text.content, text.x, text.y);
  //             return
  //           });
  //         }
  //       };
  //       img.src = data.image.url;
  //       return
  //     }
  //     return
  //   });
  // };
  // useEffect(() => {
  //   if (userMode == 'template') {
  //     showPreviews()
  //   }
  //   return () => { }
  // }, [userMode])


  return (
    <GridDiv id='imgContainer'>
    </GridDiv>
  );
}
