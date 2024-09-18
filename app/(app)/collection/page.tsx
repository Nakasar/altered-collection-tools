import {getCardsInCollection} from "@/app/(app)/collection/action";
import BigNumber from "bignumber.js";
import {MinusIcon, PlusIcon} from "@heroicons/react/24/outline";
import {ExportCollection} from "@/app/(app)/collection/components";

export default async function Collection() {
  const cards = await getCardsInCollection();

  return (
    <>
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-bold">Collection</h1>

        <div className="space-x-2 flex flex-row items-center">
          <ExportCollection />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-8">
        {cards.map((card, index) => (
          <div key={`${card.setCode}-${card.collectorNumber}-${card.foil}`}
               className={`rounded-md border-2 ${card.foil ? 'border-yellow-500' : 'border-gray-200'} p-2 w-[160px] flex flex-col`}>
            <img src={card.imageUrl} alt={card.name} className={``}/>
            <p>{card.name}</p>
            <p>{card.setCode} #{card.collectorNumber}</p>
            <p>{card.price ? BigNumber(card.price).toFixed(2) : '?'} €</p>

            <div className="flex flex-col h-full justify-end pt-4">
              <span className="isolate inline-flex rounded-md shadow-sm">
                <button
                  type="button"
                  className="relative inline-flex items-center rounded-l-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
                >
                  <span className="sr-only">Previous</span>
                  <MinusIcon aria-hidden="true" className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  className="block w-16 text-center border-l-0 border-r-0 border-gray-300 p-2"
                  value={card.quantity}
                  readOnly
                  />
                <button
                  type="button"
                  className="relative -ml-px inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
                >
                  <span className="sr-only">Next</span>
                  <PlusIcon aria-hidden="true" className="h-5 w-5" />
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}