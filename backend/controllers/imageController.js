import { streamObjectFromOracleStorage } from '../config/ociStorageService.js'

// Secure proxy endpoint to stream private Oracle Cloud bucket images (/api/images/:folder/:filename)
export const serveImage = async (req, res) => {
  const { folder, filename } = req.params

  const allowedFolders = ['campsites', 'avatars']
  if (!allowedFolders.includes(folder)) {
    return res.status(400).json({ success: false, message: 'Invalid image folder.' })
  }

  if (!filename || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ success: false, message: 'Invalid filename.' })
  }

  const objectKey = `${folder}/${filename}`
  await streamObjectFromOracleStorage(objectKey, res)
}
