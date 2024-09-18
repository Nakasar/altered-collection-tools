import {NextResponse} from "next/server";
import clientPromise from "@/lib/mongo";

export type BoosterCard = {
  id: string;
  name: string;
  setCode: string;
  collectorNumber: string;
  imageUrl?: string;
  foil: boolean;
  price?: string;
  newInCollection?: boolean;
};

export type Booster = {
  id: string;
  lang: string;
  setCode: string;
  cards: BoosterCard[];
  createdAt: string;
  price?: string;
  archived: boolean;
};

export async function GET() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DBNAME);

  const boosters = await db.collection<Booster>("boosters").find().sort({ createdAt: -1 }).toArray();

  return NextResponse.json(boosters);
}
