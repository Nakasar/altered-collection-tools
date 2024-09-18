'use server';

import 'server-only';

import {MeiliSearch} from "meilisearch";
import clientPromise from "@/lib/mongo";

const meiliClient = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
});

export type Card = {
  id: string;
  imageUrl: string;
  lang: string;
  setCode: "string";
  collectorNumber: "string";
  name: "string";
  subtitle: "string";
  traits: string[];
  type: "string";
  arenas: string[];
  text: "string";
  price: "string";
  foilPrice: "string";
  rarity: "string";
  cost: number;
  hp: number;
  power: number;
};

export async function importCardDatabase() {
  console.info('Importing cards database...');

  let page = 1;
  while (true) {
    console.debug(`Fetching page ${page}...`);
    const cardsResult = await fetch(`https://api.altered.gg/cards?page=${page}`);

    if (!cardsResult.ok) {
      console.error('Failed to fetch cards database');
      return;
    }

    const responseRaw = await cardsResult.json();
    const cardsRaw = responseRaw['hydra:member'];

    const cardsIndex = meiliClient.index('altered-cards');

    const mongoClient = await clientPromise;
    const db = mongoClient.db(process.env.MONGODB_DBNAME);

    const cards = cardsRaw.map((cardRaw: any) => ({
      id: cardRaw.reference,
      imageUrl: cardRaw.imagePath,
      lang: 'en',
      rarity: cardRaw.rarity.reference,
      type: cardRaw.cardType.reference,
      collectorNumber: cardRaw.collectorNumberFormatted,
      faction: cardRaw.mainFaction.name,
      name: cardRaw.name,
      elements: cardRaw.elements,
    }))

    await cardsIndex.addDocuments(cards);
    await db.collection('cards').insertMany(cards);

    if (!responseRaw['hydra:view']['hydra:next']) {
      break;
    }

    page++;
  }

  console.info('Cards database imported!')
}