import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to .env.local");
}

const uri: string = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: false,
});
const clientPromise = client.connect();

export async function getDB(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}
