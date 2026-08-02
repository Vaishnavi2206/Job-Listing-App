import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react'
import { isAxiosError } from 'axios'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import Input from '../ui/Input'
import { Alert } from '../ui'
import useAuth from '../../hooks/useAuth'
import { createPost } from '../../services/posts.service'
import { MAX_UPLOAD_MB, uploadPostMedia } from '../../services/uploads.service'
import type { Post } from '../../types'
import type { CreatePostMediaItem } from '../../types/post.types'
import './PostForm.css'

// â”€â”€ Toolbar icon SVGs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const IconBold = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </svg>
)

const IconItalic = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

const IconUnderline = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </svg>
)

const IconStrike = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.3 12H21" />
    <path d="M3 12h4.7" />
    <path d="M12 21a4 4 0 0 1-4-4v-1h8v1a4 4 0 0 1-4 4Z" />
    <path d="M12 3a4 4 0 0 1 4 4v1H8V7a4 4 0 0 1 4-4Z" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
)

const IconBulletList = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

const IconOrderedList = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1V3" fill="none" />
    <path d="M4 10h2a1 1 0 0 0 0-2H4.5A.5.5 0 0 1 4 7.5v0A.5.5 0 0 1 4.5 7H6" fill="none" />
    <path d="M6 18H4c0-1 2-2 2-3a1 1 0 0 0-2 0" fill="none" />
  </svg>
)

const IconImage = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const IconClose = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">
    <polygon points="6,3 20,12 6,21" />
  </svg>
)

const IconBlockquote = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </svg>
)

const IconCode = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
)

const IconUndo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
)

const IconRedo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
  </svg>
)

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TITLE_MIN = 5
const TITLE_MAX = 100
const DESC_MIN = 10
const DESC_MAX = 1000

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface MediaItem {
  id: string
  file: File
  previewUrl: string
  type: 'image' | 'video'
  uploadStatus: 'uploading' | 'uploaded' | 'failed'
  uploadError: string | null
  uploadedMedia: Omit<CreatePostMediaItem, 'displayOrder'> | null
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (isAxiosError(err) && err.response?.data?.message) {
    return String(err.response.data.message)
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return fallback
}

const getImageMetadata = (previewUrl: string) =>
  new Promise<Pick<CreatePostMediaItem, 'width' | 'height'>>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }

    image.onerror = () => {
      reject(new Error('Could not read image dimensions.'))
    }

    image.src = previewUrl
  })

const getVideoMetadata = (previewUrl: string) =>
  new Promise<Pick<CreatePostMediaItem, 'width' | 'height' | 'duration'>>((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
        duration: Number.isFinite(video.duration) ? video.duration : undefined,
      })
    }

    video.onerror = () => {
      reject(new Error('Could not read video metadata.'))
    }

    video.src = previewUrl
  })

const getMediaMetadata = async (type: 'image' | 'video', previewUrl: string) => {
  if (type === 'video') {
    return await getVideoMetadata(previewUrl)
  }

  return await getImageMetadata(previewUrl)
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PostFormProps {
  /** Called with the newly created post after a successful submission. */
  onSuccess?: (post: Post) => void
}

const PostForm = ({ onSuccess }: PostFormProps) => {
  const { user } = useAuth()

  // â”€â”€ Field state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)

  // â”€â”€ Submit state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // â”€â”€ Media state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showEmoji, setShowEmoji] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createdUrlsRef = useRef(new Set<string>())

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Write something interestingâ€¦' }),
    ],
    content: '',
    onUpdate: () => {
      setDescriptionError(null)
    },
  })

  const handleEmojiClick = useCallback(
    (emojiData: EmojiClickData) => {
      editor?.chain().focus().insertContent(emojiData.emoji).run()
      setShowEmoji(false)
    },
    [editor],
  )

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const selectedFiles = Array.from(e.target.files)
    const invalidTypeFiles = selectedFiles.filter(
      (file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'),
    )
    const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_UPLOAD_MB * 1024 * 1024)
    const validFiles = selectedFiles.filter((file) => {
      const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isWithinLimit = file.size <= MAX_UPLOAD_MB * 1024 * 1024
      return isMedia && isWithinLimit
    })

    if (invalidTypeFiles.length > 0 || oversizedFiles.length > 0) {
      const errors: string[] = []

      if (invalidTypeFiles.length > 0) {
        errors.push(
          `Only image and video files are allowed. Skipped: ${invalidTypeFiles
            .map((file) => file.name)
            .join(', ')}`,
        )
      }

      if (oversizedFiles.length > 0) {
        errors.push(
          `These files exceed ${MAX_UPLOAD_MB}MB and were skipped: ${oversizedFiles
            .map((file) => file.name)
            .join(', ')}`,
        )
      }

      setSubmitError(errors.join(' '))
    }

    const newItems: MediaItem[] = validFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file)
      createdUrlsRef.current.add(previewUrl)

      return {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        file,
        previewUrl,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        uploadStatus: 'uploading',
        uploadError: null,
        uploadedMedia: null,
      }
    })

    setMediaItems((prev) => [...prev, ...newItems])
    e.target.value = ''

    newItems.forEach(async (item) => {
      try {
        const [uploadedMedia, metadata] = await Promise.all([
          uploadPostMedia(item.file),
          getMediaMetadata(item.type, item.previewUrl),
        ])

        setMediaItems((prev) =>
          prev.map((existingItem) =>
            existingItem.id === item.id
              ? {
                  ...existingItem,
                  uploadStatus: 'uploaded',
                  uploadError: null,
                  uploadedMedia: {
                    ...uploadedMedia,
                    ...metadata,
                  },
                }
              : existingItem,
          ),
        )
      } catch (err: unknown) {
        setMediaItems((prev) =>
          prev.map((existingItem) =>
            existingItem.id === item.id
              ? {
                  ...existingItem,
                  uploadStatus: 'failed',
                  uploadError: getErrorMessage(err, 'Failed to upload selected media.'),
                }
              : existingItem,
          ),
        )
      }
    })
  }

  const removeMedia = useCallback((index: number) => {
    setMediaItems((prev) => {
      const item = prev[index]
      URL.revokeObjectURL(item.previewUrl)
      createdUrlsRef.current.delete(item.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  useEffect(() => {
    const urls = createdUrlsRef.current
    return () => { urls.forEach((url) => URL.revokeObjectURL(url)) }
  }, [])

  // â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const validate = (): boolean => {
    let valid = true

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('Title is required.')
      valid = false
    } else if (trimmedTitle.length < TITLE_MIN) {
      setTitleError(`Title must be at least ${TITLE_MIN} characters.`)
      valid = false
    } else if (trimmedTitle.length > TITLE_MAX) {
      setTitleError(`Title must be ${TITLE_MAX} characters or fewer (${trimmedTitle.length}/${TITLE_MAX}).`)
      valid = false
    } else {
      setTitleError(null)
    }

    const plainText = editor?.getText()?.trim() ?? ''
    if (!plainText) {
      setDescriptionError('Description is required.')
      valid = false
    } else if (plainText.length < DESC_MIN) {
      setDescriptionError(`Description must be at least ${DESC_MIN} characters.`)
      valid = false
    } else if (plainText.length > DESC_MAX) {
      setDescriptionError(`Description must be ${DESC_MAX} characters or fewer (${plainText.length}/${DESC_MAX}).`)
      valid = false
    } else {
      setDescriptionError(null)
    }

    return valid
  }

  // â”€â”€ Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const resetForm = useCallback(() => {
    setTitle('')
    setTitleError(null)
    setDescriptionError(null)
    setSubmitError(null)
    editor?.commands.clearContent()
    setMediaItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return []
    })
    createdUrlsRef.current.clear()
  }, [editor])

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSubmit = async () => {
    if (!editor || !user) return
    if (!validate()) return

    const uploadingCount = mediaItems.filter((item) => item.uploadStatus === 'uploading').length
    const failedUploads = mediaItems.filter((item) => item.uploadStatus === 'failed').length

    if (uploadingCount > 0) {
      setSubmitError(`Please wait. ${uploadingCount} media file(s) still uploading.`)
      return
    }

    if (failedUploads > 0) {
      setSubmitError('Please remove failed media items before posting.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const uploadedMediaItems = mediaItems
        .map((item) => item.uploadedMedia)
        .filter(
          (item): item is Omit<CreatePostMediaItem, 'displayOrder'> => item !== null,
        )
        .map((item, index) => ({
          ...item,
          displayOrder: index,
        }))

      const post = await createPost({
        title: title.trim(),
        description: editor.getHTML(),
        authorId: user.id,
        mediaItems: uploadedMediaItems.length > 0 ? uploadedMediaItems : undefined,
      })
      resetForm()
      onSuccess?.(post)
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, 'Failed to create post. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const uploadingCount = mediaItems.filter((item) => item.uploadStatus === 'uploading').length
  const failedUploads = mediaItems.filter((item) => item.uploadStatus === 'failed').length
  const isPostable =
    title.trim().length >= TITLE_MIN &&
    !(editor?.isEmpty ?? true) &&
    uploadingCount === 0 &&
    failedUploads === 0

  return (
    <div className="post-form card">
      {/* Header */}
      <div className="card__header">
        <h3 className="post-form__heading">Create Post</h3>
      </div>

      {/* Body */}
      <div className="card__body post-form__body">
        {/* API-level error */}
        {submitError && (
          <Alert
            variant="danger"
            message={submitError}
            dismissible
            onDismiss={() => setSubmitError(null)}
            compact
          />
        )}

        {/* Title */}
        <FormField
          label="Title"
          htmlFor="post-title"
          required
          error={titleError ?? undefined}
        >
          <Input
            id="post-title"
            placeholder="Give your post a titleâ€¦"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (titleError) setTitleError(null)
            }}
            error={!!titleError}
          />
        </FormField>

        {/* Rich text editor */}
        <div className="form-field">
          <label className="form-label form-label--required">Description</label>
          <div className={`post-editor${descriptionError ? ' post-editor--error' : ''}`}>
            {/* Toolbar */}
            <div className="post-editor__toolbar" role="toolbar" aria-label="Text formatting">
              {/* â”€â”€ Headings â”€â”€ */}
              <button
                type="button"
                className={`post-editor__tool post-editor__tool--label${editor?.isActive('heading', { level: 1 }) ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run() }}
                aria-label="Heading 1"
                title="Heading 1"
              >H1</button>

              <button
                type="button"
                className={`post-editor__tool post-editor__tool--label${editor?.isActive('heading', { level: 2 }) ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run() }}
                aria-label="Heading 2"
                title="Heading 2"
              >H2</button>

              <button
                type="button"
                className={`post-editor__tool post-editor__tool--label${editor?.isActive('heading', { level: 3 }) ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run() }}
                aria-label="Heading 3"
                title="Heading 3"
              >H3</button>

              <div className="post-editor__divider" aria-hidden="true" />

              {/* â”€â”€ Inline formatting â”€â”€ */}
              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('bold') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run() }}
                aria-label="Bold"
                title="Bold (Ctrl+B)"
              >
                <IconBold />
              </button>

              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('italic') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run() }}
                aria-label="Italic"
                title="Italic (Ctrl+I)"
              >
                <IconItalic />
              </button>

              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('underline') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run() }}
                aria-label="Underline"
                title="Underline (Ctrl+U)"
              >
                <IconUnderline />
              </button>

              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('strike') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleStrike().run() }}
                aria-label="Strikethrough"
                title="Strikethrough"
              >
                <IconStrike />
              </button>

              <div className="post-editor__divider" aria-hidden="true" />

              {/* â”€â”€ Lists + blockquote â”€â”€ */}
              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('bulletList') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run() }}
                aria-label="Bullet list"
                title="Bullet list"
              >
                <IconBulletList />
              </button>

              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('orderedList') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run() }}
                aria-label="Ordered list"
                title="Ordered list"
              >
                <IconOrderedList />
              </button>

              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('blockquote') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run() }}
                aria-label="Blockquote"
                title="Blockquote"
              >
                <IconBlockquote />
              </button>

              <div className="post-editor__divider" aria-hidden="true" />

              {/* â”€â”€ Code â”€â”€ */}
              <button
                type="button"
                className={`post-editor__tool${editor?.isActive('code') ? ' is-active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run() }}
                aria-label="Inline code"
                title="Inline code"
              >
                <IconCode />
              </button>

              <div className="post-editor__divider" aria-hidden="true" />

              {/* â”€â”€ History â”€â”€ */}
              <button
                type="button"
                className="post-editor__tool"
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().undo().run() }}
                disabled={!editor?.can().undo()}
                aria-label="Undo"
                title="Undo (Ctrl+Z)"
              >
                <IconUndo />
              </button>

              <button
                type="button"
                className="post-editor__tool"
                onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().redo().run() }}
                disabled={!editor?.can().redo()}
                aria-label="Redo"
                title="Redo (Ctrl+Y)"
              >
                <IconRedo />
              </button>

              <div className="post-editor__divider" aria-hidden="true" />

              {/* â”€â”€ Emoji â”€â”€ */}
              <div className="post-editor__emoji-wrap">
                <button
                  type="button"
                  className="post-editor__tool post-editor__emoji-tool"
                  onClick={() => setShowEmoji((v) => !v)}
                  aria-label="Insert emoji"
                  aria-expanded={showEmoji}
                  title="Emoji"
                >
                  ðŸ˜Š
                </button>

                {showEmoji && (
                  <>
                    <div
                      className="post-form__emoji-backdrop"
                      onClick={() => setShowEmoji(false)}
                      aria-hidden="true"
                    />
                    <div className="post-editor__emoji-picker">
                      <EmojiPicker onEmojiClick={handleEmojiClick} lazyLoadEmojis />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Editable content */}
            <EditorContent editor={editor} className="post-editor__content" />
          </div>
          {descriptionError && (
            <p className="form-error" role="alert">{descriptionError}</p>
          )}
        </div>

        {/* Media preview */}
        {mediaItems.length > 0 && (
          <div className="post-form__media-section">
            <span className="post-form__media-label">
              Attached media
              <span className="post-form__media-count">{mediaItems.length}</span>
            </span>
            <div className="post-form__media-grid">
              {mediaItems.map((item, idx) => (
                <div key={item.id} className="post-form__media-item">
                  {item.type === 'image' ? (
                    <img src={item.previewUrl} alt={item.file.name} />
                  ) : (
                    <>
                      <video
                        src={item.previewUrl}
                        className="post-form__media-video-thumb"
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="post-form__media-play" aria-hidden="true">
                        <IconPlay />
                      </div>
                      <span className="post-form__media-type-badge">VIDEO</span>
                    </>
                  )}
                  <button
                    type="button"
                    className="post-form__media-remove"
                    onClick={() => removeMedia(idx)}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <IconClose />
                  </button>
                  {item.uploadStatus === 'uploading' && (
                    <span className="post-form__media-type-badge">UPLOADING...</span>
                  )}
                  {item.uploadStatus === 'failed' && (
                    <span className="post-form__media-type-badge">UPLOAD FAILED</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {uploadingCount > 0 && (
          <p className="form-hint" role="status">
            Uploading {uploadingCount} media file(s)...
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="card__footer post-form__footer">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="post-form__file-input"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className="post-form__footer-actions">
          <button
            type="button"
            className="post-form__attach-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image or video"
          >
            <IconImage />
            Photo / Video
            {mediaItems.length > 0 && (
              <span className="post-form__attach-count">{mediaItems.length}</span>
            )}
          </button>
        </div>

        <Button
          type="button"
          variant="primary"
          loading={submitting}
          disabled={!isPostable || submitting}
          onClick={handleSubmit}
        >
          Post
        </Button>
      </div>
    </div>
  )
}

export default PostForm
