import {NextResponse} from "next/server";
import clientPromise from "@/lib/mongo";

export async function POST(request: Request) {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const cards = await db.collection('collection').find().toArray();

  return NextResponse.json(cards, {
    headers: {
      'filename': `swu-export-collection-${new Date().toISOString()}.json`,
    },
  });
}
