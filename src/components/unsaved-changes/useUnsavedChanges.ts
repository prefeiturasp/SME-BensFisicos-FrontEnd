import { createContext, useContext, useEffect } from 'react';

export type NavigationAction = () => void;
export type UnsavedChangesMode = 'create' | 'edit' | 'selection';

export interface UnsavedChangesContextValue {
  setDirty: (isDirty: boolean, mode: UnsavedChangesMode) => void;
  navigateAfterSave: (action: NavigationAction) => void;
  navigateAfterCommit: (action: NavigationAction) => void;
}

export const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

const executeImmediately = (action: NavigationAction) => action();

export function useUnsavedChanges(isDirty: boolean, mode: UnsavedChangesMode) {
  const context = useContext(UnsavedChangesContext);

  useEffect(() => {
    if (!context) return;
    context.setDirty(isDirty, mode);
    return () => context.setDirty(false, mode);
  }, [context, isDirty, mode]);

  return {
    navigateAfterSave: context?.navigateAfterSave ?? executeImmediately,
    navigateAfterCommit: context?.navigateAfterCommit ?? executeImmediately,
  };
}
