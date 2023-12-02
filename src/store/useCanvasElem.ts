import { create } from 'zustand';

const useCanvasElem = create<{
  canvasElement: HTMLElement | null;
  setCanvasElement: (elem: HTMLElement) => void;
}>((set) => ({
  canvasElement: null,
  setCanvasElement: (elem: HTMLElement) => set(() => ({ canvasElement: elem })),
}));

export default useCanvasElem;
