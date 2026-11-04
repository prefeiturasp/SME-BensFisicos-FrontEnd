import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  let matchMediaMock: Mock;
  let addEventListenerMock: Mock;
  let removeEventListenerMock: Mock;
  let listeners: Record<string, (e: unknown) => void> = {};

  beforeEach(() => {
    listeners = {};

    addEventListenerMock = vi.fn((event, callback) => {
      listeners[event] = callback;
    });

    removeEventListenerMock = vi.fn();

    matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  it('deve retornar false se a largura for maior ou igual ao breakpoint (desktop)', () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('deve retornar true se a largura for menor que o breakpoint (mobile)', () => {
    setWindowWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('deve atualizar o valor quando o evento de mudança ocorrer', () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));

    act(() => {
      setWindowWidth(500);
      if (listeners['change']) {
        listeners['change']({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);

    act(() => {
      setWindowWidth(1200);
      if (listeners['change']) {
        listeners['change']({ matches: false } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(false);
  });

  it('deve limpar o event listener ao desmontar', () => {
    setWindowWidth(1024);
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
