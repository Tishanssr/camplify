import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'


// Create S3 client configured for Oracle Cloud Object Storage endpoint
const buildS3Client = () => {
  const namespace = process.env.OCI_NAMESPACE
  const region = process.env.OCI_REGION || 'ap-mumbai-1'
  const accessKeyId = process.env.OCI_ACCESS_KEY_ID
  const secretAccessKey = process.env.OCI_SECRET_ACCESS_KEY
  const endpoint = process.env.OCI_S3_ENDPOINT || `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

// Quick check if OCI storage env vars are configured
const hasOciCredentials = () => {
  return (
    process.env.OCI_ACCESS_KEY_ID &&
    process.env.OCI_SECRET_ACCESS_KEY &&
    process.env.OCI_BUCKET_NAME &&
    process.env.OCI_NAMESPACE
  )
}

// Upload file to Oracle Cloud bucket (returns object key, or base64 fallback for local dev)
export const uploadToOracleStorage = async (fileBuffer, originalName, mimeType, folder = 'campsites') => {
  if (!hasOciCredentials()) {
    console.warn('[OCI Storage] Credentials missing in backend .env. Falling back to data URI.')
    const base64Data = fileBuffer.toString('base64')
    return `data:${mimeType};base64,${base64Data}`
  }

  const bucketName = process.env.OCI_BUCKET_NAME
  const fileExt = originalName && originalName.includes('.') ? originalName.split('.').pop() : 'jpg'
  const objectKey = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: fileBuffer,
    ContentType: mimeType,
  })

  await buildS3Client().send(command)
  return objectKey
}

// Stream private OCI object directly to HTTP response (keeps credentials secure)
export const streamObjectFromOracleStorage = async (objectKey, res) => {
  if (!hasOciCredentials()) {
    res.status(503).json({ success: false, message: 'Storage not configured.' })
    return
  }

  const bucketName = process.env.OCI_BUCKET_NAME

  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
    const data = await buildS3Client().send(command)

    const contentType = data.ContentType || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'private, max-age=86400')

    data.Body.pipe(res)
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      res.status(404).json({ success: false, message: 'Image not found.' })
    } else {
      console.error(`[OCI Storage] Failed to stream object ${objectKey}:`, error.message)
      res.status(500).json({ success: false, message: 'Failed to retrieve image.' })
    }
  }
}

// Extract object key from plain key, proxy URL, or legacy public URL
const extractObjectKey = (value) => {
  if (!value || typeof value !== 'string') return null

  // Plain key format (e.g. campsites/1234_abc.jpg)
  if (!value.startsWith('http') && !value.startsWith('/')) return value

  // Legacy OCI public URL format
  if (value.includes('/o/')) {
    return decodeURIComponent(value.split('/o/')[1])
  }

  // Local proxy URL format: /api/images/folder/filename
  const proxyMatch = value.match(/^\/api\/images\/(.+)$/)
  if (proxyMatch) return proxyMatch[1]

  return null
}

// Delete object from Oracle Cloud bucket using object key or URL
export const deleteFromOracleStorage = async (value) => {
  if (!hasOciCredentials()) return false

  const objectKey = extractObjectKey(value)
  if (!objectKey) return false

  const bucketName = process.env.OCI_BUCKET_NAME

  try {
    const command = new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey })
    await buildS3Client().send(command)
    console.log(`[OCI Storage] Deleted object: ${objectKey}`)
    return true
  } catch (error) {
    console.error(`[OCI Storage] Failed to delete object ${objectKey}:`, error.message)
    return false
  }
}
