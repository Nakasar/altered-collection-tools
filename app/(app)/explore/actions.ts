import clientPromise from "@/lib/mongo";
import {CollectionCard} from "@/app/(app)/collection/action";
import {Card} from "@/app/(app)/settings/actions";
import {revalidatePath} from "next/cache";

export type CardWithCollection = Card & {
  quantity: number;
  quantityFoil: number;
};

export async function getExistingCardsWithCollection(): Promise<CardWithCollection[]> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const cardsList = await db.collection<Card>('cards')
    .find()
    .sort({
      setCode: 1,
      collectorNumber: 1,
    })
    .project<Card>({ _id: 0 })
    .collation({ locale: 'en_US', numericOrdering: true })
    .toArray();

  const cardsInCollection = await db.collection<CollectionCard>('collection').find().toArray();

  const cards: CardWithCollection[] = cardsList.map((card) => {
    const cardInCollection = cardsInCollection.find((cardInCollection) => cardInCollection.setCode === card.setCode && cardInCollection.collectorNumber === card.collectorNumber && !cardInCollection.foil);
    const cardFoilInCollection = cardsInCollection.find((cardInCollection) => cardInCollection.setCode === card.setCode && cardInCollection.collectorNumber === card.collectorNumber && cardInCollection.foil);

    return {
      ...card,
      quantity: cardInCollection?.quantity ?? 0,
      quantityFoil: cardFoilInCollection?.quantity ?? 0,
    };
  });

  return cards;
}

export async function updateCardToCollection(card: Omit<CollectionCard, 'quantity'>, quantity: number): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  await db.collection('collection').updateOne({
    setCode: card.setCode,
    collectorNumber: card.collectorNumber,
    foil: card.foil,
  }, {
    $inc: {quantity},
    $setOnInsert: {
      collectorNumber: card.collectorNumber,
      foil: card.foil,
      imageUrl: card.imageUrl,
      name: card.name,
      price: card.price,
    },
  }, {upsert: true});

  revalidatePath('/explore');
}