import clientPromise from "@/lib/mongo";

export type CollectionCard = {
  setCode: string;
  collectorNumber: string;
  foil: boolean;
  imageUrl?: string;
  name: string;
  price?: string;
  quantity: number;
};


export async function getCardsInCollection() {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const cards = await db.collection('collection')
    .find()
    .sort({ setCode: 1, collectorNumber: 1 })
    .collation({locale: "en_US", numericOrdering: true})
    .toArray();

  return cards;
}