import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { r2, BUCKET, PUBLIC_URL } from '../../lib/r2'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const result = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'gallery/' }))

  const photos = (result.Contents || [])
    .filter(obj => obj.Key !== 'gallery/')
    .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
    .map(obj => ({
      url: `${PUBLIC_URL}/${obj.Key}`,
      key: obj.Key,
      lastModified: obj.LastModified,
    }))

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate')
  res.json({ photos })
}
