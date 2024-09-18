'use server';

import 'server-only';

import {nanoid} from "nanoid";
import {revalidatePath, revalidateTag} from "next/cache";
import {redirect} from "next/navigation";

import clientPromise from "@/lib/mongo";
import {Booster, BoosterCard} from "@/app/api/boosters/route";
import BigNumber from "bignumber.js";
import {MeiliSearch} from "meilisearch";
import Boosters from "@/app/(app)/boosters/page";
import {CollectionCard} from "@/app/(app)/collection/action";

const meiliClient = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
});

export async function createBooster(formData: FormData) {
  const rawFormData = {
    setCode: formData.get('setCode'),
    lang: formData.get('lang'),
  };

  if (!rawFormData.setCode || !rawFormData.lang || typeof rawFormData.setCode !== 'string' || typeof rawFormData.lang !== 'string') {
    throw new Error('Invalid form data');
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const booster: Booster = {
    lang: rawFormData.lang,
    id: nanoid(12),
    setCode: rawFormData.setCode,
    cards: [],
    createdAt: new Date().toISOString(),
    archived: false,
  };

  await db.collection<Booster>('boosters').insertOne(booster);

  revalidateTag('boosters');
  revalidatePath('/api/boosters');
  redirect(`/boosters/${booster.id}`);
}

export async function getBooster(boosterId: string) {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const booster = await db.collection<Booster>('boosters').findOne({id: boosterId});

  if (!booster) {
    return null;
  }

  const cardNames = booster.cards.map((card) => card.name);

  const cardsInCollection = await db.collection('collection').aggregate(
    [
      { $sort: { cardName: 1 } },
      {
        $group:
          {
            _id: "$cardName",
            cardName: { $first: "$cardName" }
          }
      },
      { $match: { _id: { $in: cardNames } } },
    ]
  ).toArray();

  booster.cards.map((card) => {
    if (!cardsInCollection.find((cardInCollection) => cardInCollection._id === card.name)) {
      card.newInCollection = true;
    }
  });

  return {
    setCode: booster.setCode,
    id: booster.id,
    lang: booster.lang,
    cards: booster.cards,
    price: booster.price,
    createdAt: booster.createdAt,
    archived: booster.archived,
  };
}

export async function addCardToBoster(boosterId: Booster['id'], card: {
  setCode: string;
  collectorNumber: string
}): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const booster = await db.collection<Booster>('boosters').findOne({id: boosterId});

  if (!booster) {
    throw new Error('Booster not found');
  }

  const index = meiliClient.index('altered-cards');
  const result = await index.search("", {
    filter: [`collectorNumber = ${card.collectorNumber}`, `lang IN [${booster.lang}, en]`],
  });

  const cardFound = result.hits[0];

  if (cardFound) {
    const cardPrice = (cardFound.foil ? cardFound.foilPrice : cardFound.price) ?? 0;

    let imageUrl = cardFound.imageUrl ?? null;

    const cardData = {
      id: nanoid(12),
      name: cardFound.name,
      setCode: cardFound.setCode,
      collectorNumber: cardFound.collectorNumber,
      foil: cardFound.foil ?? false,
      imageUrl: imageUrl,
      price: cardPrice.toString(),
    };

    const boosterPrice = booster.price ? BigNumber(booster.price) : BigNumber(0);
    const newPrice = boosterPrice.plus(cardPrice);

    await db.collection<Booster>('boosters').updateOne({id: boosterId}, {
      $push: {cards: cardData},
      $set: {price: newPrice.toString()},
    });
  } else {
    const cardData = {
      id: nanoid(12),
      name: '???',
      setCode: 'BTG',
      collectorNumber: card.collectorNumber,
      foil: false,
      imageUrl: '',
    };

    await db.collection<Booster>('boosters').updateOne({id: boosterId}, {
      $push: {cards: cardData},
    });
  }

  revalidateTag('boosters');
}

export async function removeCardFromBooster(boosterId: Booster['id'], cardId: BoosterCard['id']): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const booster = await db.collection<Booster>('boosters').findOne({id: boosterId});

  if (!booster) {
    throw new Error('Booster not found');
  }

  await db.collection<Booster>('boosters').updateOne({id: boosterId}, {$pull: {cards: {id: cardId}}});

  revalidateTag('boosters');
}

export async function updateCardInBooster(boosterId: Booster['id'], cardId: BoosterCard['id'], data: Partial<BoosterCard>): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const booster = await db.collection<Booster>('boosters').findOne({id: boosterId});

  if (!booster) {
    throw new Error('Booster not found');
  }

  const update: Record<string, any> = {};

  if (data.foil !== undefined) {
    update['cards.$.foil'] = data.foil;
    update['cards.$.price'] = undefined;
  }

  await db.collection<Booster>('boosters').updateOne({id: boosterId, 'cards.id': cardId}, {$set: update});

  revalidateTag('boosters');
}

export async function deleteBooster(boosterId: Booster['id']): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  await db.collection<Booster>('boosters').deleteOne({id: boosterId});

  revalidateTag('boosters');
  revalidatePath('/api/boosters');
  redirect('/boosters');
}

export async function refreshBoosterPrices(boosterId: Booster['id']): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const booster = await db.collection<Booster>('boosters').findOne({id: boosterId});

  if (!booster) {
    throw new Error('Booster not found');
  }

  let boosterPrice = BigNumber(0);

  const index = meiliClient.index('altered-cards');

  for (const card of booster.cards) {
    const result = await index.search("", {
      filter: [`setCode = ${card.setCode}`, `collectorNumber = ${card.collectorNumber}`, `lang IN [${booster.lang}, en]`],
    });

    if (result.hits.length === 0) {
      throw new Error('Card not found');
    }

    let cardFound = result.hits[0];

    if (cardFound.prices === null) {
      cardFound = result.hits[1];
    }

    if (cardFound) {
      const cardPrice: string = (card.foil ? cardFound.foilPrice : cardFound.price) ?? '0';
      boosterPrice = boosterPrice.plus(cardPrice);

      await db.collection<Booster>('boosters').updateOne({
        id: boosterId,
        'cards.id': card.id
      }, {$set: {'cards.$.price': cardPrice.toString()}});
    }
  }

  await db.collection<Booster>('boosters').updateOne({id: boosterId}, {$set: {price: boosterPrice.toString()}});

  revalidateTag('boosters');
}

export async function archiveBoosters(boosterIds: string[]): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  await db.collection('boosters').updateMany({id: {$in: boosterIds}}, {$set: {archived: true}});
  revalidateTag('boosters');
}

export async function archiveAllBoosters(): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  await db.collection('boosters').updateMany({}, {$set: {archived: true}});
  revalidateTag('boosters');
}

export async function refreshPrices(boosterIds: string[]): Promise<void> {
  await Promise.all(boosterIds.map(async (boosterId) => {
    await refreshBoosterPrices(boosterId);
  }));

  revalidateTag('boosters');
}

export async function refreshPricesAllBoosters(): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const boosters = await db.collection<Booster>('boosters').find().project({id: 1}).toArray();

  const boosterIds = boosters.map((booster) => booster.id);

  await refreshPrices(boosterIds);

  revalidateTag('boosters');
}

export async function addBoosterToCollection(boosterId: Booster['id']): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const booster = await db.collection<Booster>('boosters').findOne({id: boosterId});

  if (!booster) {
    throw new Error('Booster not found');
  }

  const cards: CollectionCard[] = booster.cards.map((card) => ({
    cardName: card.name,
    setCode: card.setCode,
    collectorNumber: card.collectorNumber,
    foil: card.foil,
    imageUrl: card.imageUrl,
    name: card.name,
    price: card.price,
    quantity: 1,
  }));

  for (const card of cards) {
    await db.collection('collection').updateOne({
      setCode: card.setCode,
      collectorNumber: card.collectorNumber,
      foil: card.foil ?? false,
    }, {
      $inc: {quantity: card.quantity},
      $setOnInsert: {
        setCode: card.setCode,
        collectorNumber: card.collectorNumber,
        foil: card.foil ?? false,
        imageUrl: card.imageUrl,
        name: card.name,
        price: card.price,
      },
    }, {upsert: true});
  }

  revalidatePath('/collection');
}

export async function addBoostersToCollection(boosterIds: Booster['id'][]): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const boosters = await db.collection<Booster>('boosters').find({id: { $in: boosterIds } }).toArray();

  const cards = boosters.reduce((acc: { [cardIdentifier: string]: CollectionCard}, booster) => {
    booster.cards.forEach((card) => {
      const cardIdentifier = `${card.setCode}-${card.collectorNumber}-${card.foil}`;

      if (!acc[cardIdentifier]) {
        acc[cardIdentifier] = {
          setCode: card.setCode,
          collectorNumber: card.collectorNumber,
          quantity: 1,
          foil: card.foil,
          imageUrl: card.imageUrl,
          name: card.name,
          price: card.price,
        };
      } else {
        acc[cardIdentifier].quantity = acc[cardIdentifier].quantity + 1;
      }
    });

    return acc;
  }, {});

  const cardsArray = Object.values(cards);

  for (const card of cardsArray) {
    await db.collection<CollectionCard>('collection').updateOne({
      setCode: card.setCode,
      collectorNumber: card.collectorNumber,
      foil: card.foil ?? false,
    }, {
      $inc: {quantity: card.quantity},
      $setOnInsert: {
        setCode: card.setCode,
        collectorNumber: card.collectorNumber,
        foil: card.foil ?? false,
        imageUrl: card.imageUrl,
        name: card.name,
        price: card.price,
      },
    }, {upsert: true});
  }

  revalidatePath('/collection');
}

export async function addAllNonArchivedBoostersToCollection(): Promise<void> {
  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const boosters = await db.collection<Booster>('boosters').find({archived: false}, { projection: { id: 1 } }).toArray();

  await addBoostersToCollection(boosters.map((booster) => booster.id));
}