import { IncomingForm, Fields, Files } from "formidable";
import { Readable } from "stream";
import type { IncomingMessage } from "http";
import { Socket } from "net"; 

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function parseForm(request: Request): Promise<{ fields: Fields; files: Files }> {
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");

  if (!contentType || !contentLength) {
    throw new Error("Missing content-type or content-length");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body reader not available");

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);

  const stream = Readable.from(buffer) as unknown as IncomingMessage;

  stream.headers = {
    "content-type": contentType,
    "content-length": contentLength,
  };

  stream.method = "POST";
  stream.url = "";
  stream.socket = new Socket();

  const form = new IncomingForm({ keepExtensions: true });

  return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(stream, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}
