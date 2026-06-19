export function toggleOrdering(current: string, backendField: string) {
  if (current === backendField) {
    return `-${backendField}`;
  }

  if (current === `-${backendField}`) {
    return backendField;
  }

  return backendField;
}

export function downloadBlobFile(blob: Blob, fileName: string) {
  const blobUrl = globalThis.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  globalThis.URL.revokeObjectURL(blobUrl);
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}