import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2, BUCKET } from '../../lib/r2'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
const MAX_BYTES = 20 * 1024 * 1024

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { filename, contentType, uploaderName, fileSize } = req.body

  if (!ACCEPTED.includes(contentType)) return res.status(400).json({ error: 'Unsupported file type' })
  if (fileSize > MAX_BYTES) return res.status(400).json({ error: 'File too large' })

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const prefix = uploaderName ? uploaderName.replace(/[^a-zA-Z0-9]/g, '_') + '_' : ''
  const key = `gallery/${prefix}${Date.now()}_${safe}`

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 3600 }
  )

  res.json({ url, key })
}
