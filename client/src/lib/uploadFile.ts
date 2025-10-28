/**
 * Upload de arquivos para o storage
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Erro ao fazer upload do arquivo');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Upload de múltiplos arquivos
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const uploads = files.map(file => uploadFile(file));
  return Promise.all(uploads);
}

