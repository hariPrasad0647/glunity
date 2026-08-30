const ENDPOINT = process.env.BUNNY_STORAGE_ENDPOINT;
const PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;
const CDN_URL = process.env.BUNNY_CDN_URL;
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;

if (!ENDPOINT || !PASSWORD || !CDN_URL || !STORAGE_ZONE) {
  throw new Error(
    'Missing Bunny configuration. Required: BUNNY_STORAGE_ENDPOINT, BUNNY_STORAGE_PASSWORD, BUNNY_CDN_URL, BUNNY_STORAGE_ZONE'
  );
}

const uploadToBunny = async (buffer, remotePath) => {
  const storageUrl = `${ENDPOINT}/${STORAGE_ZONE}/${remotePath}`;

  const res = await fetch(storageUrl, {
    method: 'PUT',
    headers: {
      AccessKey: PASSWORD,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');

    if (res.status === 401) {
      throw new Error(
        `Bunny Storage authentication failed: 401 Unauthorized. ` +
        `Check BUNNY_STORAGE_PASSWORD and make sure it is the API/HTTP Access Key for the "${STORAGE_ZONE}" storage zone.`
      );
    }

    if (res.status === 405) {
      throw new Error(
        `Bunny Storage upload failed: 405 Method Not Allowed. ` +
        `Check BUNNY_STORAGE_ENDPOINT and storage zone configuration.`
      );
    }

    throw new Error(
      `Bunny Storage upload failed: ${res.status} ${res.statusText} ${errorBody}`
    );
  }

  return `${CDN_URL}/${remotePath}`;
};

const deleteFromBunny = async (cdnUrl) => {
  if (!cdnUrl) return;

  const prefix = `${CDN_URL}/`;

  if (!cdnUrl.startsWith(prefix)) {
    throw new Error('Invalid Bunny CDN URL');
  }

  const remotePath = cdnUrl.slice(prefix.length);

  const storageUrl = `${ENDPOINT}/${STORAGE_ZONE}/${remotePath}`;

  const res = await fetch(storageUrl, {
    method: 'DELETE',
    headers: {
      AccessKey: PASSWORD,
    },
  });

  if (!res.ok && res.status !== 404) {
    const errorBody = await res.text().catch(() => '');

    throw new Error(
      `Bunny Storage delete failed: ${res.status} ${res.statusText} ${errorBody}`
    );
  }
};

module.exports = {
  uploadToBunny,
  deleteFromBunny,
};