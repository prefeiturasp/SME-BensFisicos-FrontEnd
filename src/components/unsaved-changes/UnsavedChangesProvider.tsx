import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  UnsavedChangesContext,
  type NavigationAction,
  type UnsavedChangesMode,
} from './useUnsavedChanges';

interface UnsavedChangesProviderProps {
  readonly children: ReactNode;
}

const DIALOG_COPY: Record<
  UnsavedChangesMode,
  { title: string; message: string; confirmLabel: string; cancelLabel: string }
> = {
  create: {
    title: 'Sair sem salvar?',
    message:
      'As informações preenchidas ainda não foram salvas. Se você sair agora, elas serão perdidas.',
    confirmLabel: 'Descartar e sair',
    cancelLabel: 'Continuar preenchendo',
  },
  edit: {
    title: 'Descartar alterações?',
    message:
      'As alterações realizadas ainda não foram salvas. Se você sair agora, elas serão perdidas.',
    confirmLabel: 'Descartar alterações',
    cancelLabel: 'Continuar editando',
  },
  selection: {
    title: 'Descartar seleção?',
    message:
      'Os itens selecionados ainda não foram utilizados. Se você sair agora, a seleção será perdida.',
    confirmLabel: 'Descartar seleção',
    cancelLabel: 'Manter seleção',
  },
};

export function UnsavedChangesProvider({ children }: UnsavedChangesProviderProps) {
  const [guard, setGuard] = useState<{ isDirty: boolean; mode: UnsavedChangesMode }>({
    isDirty: false,
    mode: 'edit',
  });
  const navigationAllowed = useRef(false);
  const copy = DIALOG_COPY[guard.mode];

  const setDirty = useCallback((isDirty: boolean, mode: UnsavedChangesMode) => {
    if (isDirty) navigationAllowed.current = false;
    setGuard((current) => {
      if (current.isDirty === isDirty && current.mode === mode) return current;
      return { isDirty, mode };
    });
  }, []);

  const navigateAfterSave = useCallback((action: NavigationAction) => {
    navigationAllowed.current = true;
    setGuard((current) => ({ ...current, isDirty: false }));
    action();
  }, []);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        guard.isDirty &&
        !navigationAllowed.current &&
        currentLocation.pathname + currentLocation.search !==
          nextLocation.pathname + nextLocation.search,
      [guard.isDirty],
    ),
  );

  useEffect(() => {
    if (!guard.isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (navigationAllowed.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    globalThis.addEventListener('beforeunload', handleBeforeUnload);
    return () => globalThis.removeEventListener('beforeunload', handleBeforeUnload);
  }, [guard.isDirty]);

  useEffect(() => {
    if (guard.isDirty) return;
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker, guard.isDirty]);

  const contextValue = useMemo(
    () => ({
      setDirty,
      navigateAfterSave,
      navigateAfterCommit: navigateAfterSave,
    }),
    [navigateAfterSave, setDirty],
  );

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={copy.title}
        message={copy.message}
        confirmLabel={copy.confirmLabel}
        cancelLabel={copy.cancelLabel}
        variant='destructive'
        testId='unsaved-changes-dialog'
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
        onClose={() => {
          if (blocker.state === 'blocked') blocker.reset();
        }}
      />
    </UnsavedChangesContext.Provider>
  );
}
