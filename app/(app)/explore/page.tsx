import {getExistingCardsWithCollection, updateCardToCollection} from "@/app/(app)/explore/actions";
import BigNumber from "bignumber.js";
import {AddCardToCollectionButton, RemoveCardToCollectionButton} from "@/app/(app)/explore/components";
import {cn} from "@/lib/utils";

export default async function Explorer() {
  const cards = await getExistingCardsWithCollection();

  return (
    <div>
      <h1 className="text-2xl font-bold">Explorateur</h1>

      <div className="flex flex-wrap gap-2">
        {cards.map((card, index) => (
          <div key={`${card.setCode}-${card.collectorNumber}`}
               className={cn(card.quantity + card.quantityFoil === 0 ? 'border-4 border-red-500' : 'border-2 border-gray-200', "rounded-md p-2 w-[160px] flex flex-col")}>
            <img src={card.imageUrl} alt={card.name} className={``}/>
            <p>{card.name}</p>
            <p>{card.setCode} #{card.collectorNumber}</p>
            <p>{card.price ? BigNumber(card.price).toFixed(2) : '?'} €</p>

            <div className="flex flex-col h-full justify-end pt-4">
              <span className="isolate inline-flex rounded-md shadow-sm">
                <AddCardToCollectionButton execute={async () => {
                  'use server';
                  await updateCardToCollection({ ...card, foil: false }, -1)
                }} />
                <input
                  type="text"
                  className="block w-16 text-center border-l-0 border-r-0 border-gray-300 p-2"
                  value={card.quantity}
                  readOnly
                />
                <RemoveCardToCollectionButton execute={async () => {
                  'use server';
                  await updateCardToCollection({ ...card, foil: false }, 1)
                }} />
              </span>
              <span className="isolate inline-flex rounded-md shadow-sm border-yellow-300 border-2 mt-2">
                <AddCardToCollectionButton execute={async () => {
                  'use server';
                  await updateCardToCollection({ ...card, foil: true }, -1)
                }} />
                <input
                  type="text"
                  className="block w-16 text-center border-l-0 border-r-0 border-gray-300 p-2"
                  value={card.quantityFoil}
                  readOnly
                />
                <RemoveCardToCollectionButton execute={async () => {
                  'use server';
                  await updateCardToCollection({ ...card, foil: true }, 1)
                }} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}