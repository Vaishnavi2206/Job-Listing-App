import api from '../api/axios'
import type { CreatePostMediaItem } from '../types/post.types'

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
export const MAX_UPLOAD_MB = 50

type SignedUploadUrlResponse = {
  signedUrl: string
  path: string
  expiresIn: number
}

const getSignedUploadUrl = async (file: File) => {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File "${file.name}" exceeds ${MAX_UPLOAD_MB}MB limit.`)
  }

  const response = await api.post<{ data: SignedUploadUrlResponse }>('/uploads/signed-url', {
    filename: file.name,
    mimeType: file.type,
    fileSize: file.size,
    folder: 'posts',
  })

  return response.data.data
}

const uploadFileToSignedUrl = async (signedUrl: string, file: File) => {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }
}

const resolveMediaStoragePath = (path: string) => {
  if (!path?.trim()) {
    throw new Error('Upload response is missing media path.')
  }

  return path
}

export const uploadPostMedia = async (
  file: File,
): Promise<Omit<CreatePostMediaItem, 'displayOrder' | 'width' | 'height' | 'duration'>> => {
  const uploadUrlData = await getSignedUploadUrl(file)
  await uploadFileToSignedUrl(uploadUrlData.signedUrl, file)

  return {
    url: resolveMediaStoragePath(uploadUrlData.path),
    mimeType: file.type,
    mediaType: file.type.startsWith('video/') ? 'video' : 'image',
    filename: file.name,
    size: file.size,
  }
}
