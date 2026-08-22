const ENDPOINT = process.env.BUNNY_STORAGE_ENDPOINT;
const PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;
const CDN_URL = process.env.BUNNY_CDN_URL;

const uploadToBunny = async (buffer, remotePath) => {
  const res = await fetch(`${ENDPOINT}/${remotePath}`, {
    method: 'PUT',
    headers: {
      AccessKey: PASSWORD,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) {
    if (res.status === 405) {
      throw new Error(`Bunny CDN upload failed: 405 Method Not Allowed. This is usually caused by using the wrong region endpoint in BUNNY_STORAGE_ENDPOINT (e.g. storage.bunnycdn.com instead of sg.storage.bunnycdn.com) or hitting the Pull Zone URL by mistake.`);
    }
    throw new Error(`Bunny CDN upload failed: ${res.status} ${res.statusText}`);
  }

  return `${CDN_URL}/${remotePath}`;
};

const deleteFromBunny = async (cdnUrl) => {
  const remotePath = cdnUrl.replace(`${CDN_URL}/`, '');
  await fetch(`${ENDPOINT}/${remotePath}`, {
    method: 'DELETE',
    headers: { AccessKey: PASSWORD },
  });
};

module.exports = { uploadToBunny, deleteFromBunny };
