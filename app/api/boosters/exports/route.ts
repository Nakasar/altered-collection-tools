import {NextResponse} from "next/server";
import {Booster} from "@/app/api/boosters/route";
import clientPromise from "@/lib/mongo";

export async function POST(request: Request) {
  const body = await request.json();

  if (!['DATABASE'].includes(body.format)) {
    return NextResponse.json({ error: 'Invalid format (accepted: DATABASE' }, { status: 400 });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db(process.env.MONGODB_DBNAME);

  const filter = body.format === 'DATABASE' ? {} : { archived: false };

  const boosters = body.allBoosters ? await db.collection<Booster>('boosters').find(filter).sort({ createdAt: -1 }).toArray() : await db.collection<Booster>('boosters').find({
    id: {
      $in: body.boosters
    }
  }).sort({ createdAt: -1 }).toArray();

  if (body.format === 'DATABASE') {
    return NextResponse.json(boosters, {
      headers: {
        'filename': `swu-export-boosters-${new Date().toISOString()}.json`,
      },
    });
  } else {
    return NextResponse.json({ error: 'Invalid format (accepted: JSON, DRAGONSHIELD' }, { status: 400 });
  }
}