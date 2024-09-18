const fs = require('fs/promises');
const path = require('path');
const {parse} = require("csv-parse/sync");
const {nanoid} = require("nanoid");
const {MongoClient} = require("mongodb");

(async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  const db = client.db('altered-tools');

  const input = await fs.readFile(path.join(__dirname, 'boosters.csv'), 'utf-8');

  const raw = parse(input, {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    encoding: 'utf-8',
    bom: true,
    trim: true,
  });

  const cards = await Promise.all(raw.map(async card => {
    const formattedCollectorNumber = `${card['SET']}-${card['Collector Number'].replace(/(\d+)-([A-Z])/g, (_, number, letter) => {
      return `${number.padStart(3, '0')}-${letter}`;
    })}-EN`;

    const cardInDb = await db.collection('cards').findOne({
      collectorNumber: formattedCollectorNumber,
    });

    return {
      boosterId: card['ID'],
      set: card['SET'],
      collectorNumber: cardInDb?.collectorNumber ?? formattedCollectorNumber,
      foil: card['Foil'] === 'VRAI',
      token: card['Jeton'] === 'VRAI',
      name: cardInDb?.name,
      imageUrl: cardInDb?.imageUrl,
      type: cardInDb?.type,
      faction: cardInDb?.faction,
      rarity: cardInDb?.rarity,
    };
  }));

  const boostersSet = cards.reduce((acc, card) => {
    let booster = acc[card.boosterId];
    if (!booster) {
      booster = {
        id: card.boosterId,
        cards: [],
      };
      acc[card.boosterId] = booster;
    }

    booster.cards.push(card);

    return acc;
  }, {});

  const boosters = Object.values(boostersSet);

  await db.collection('boosters').insertMany(boosters.map(booster => ({
    id: nanoid(12),
    cards: booster.cards,
  })));

  await client.close();
})();
