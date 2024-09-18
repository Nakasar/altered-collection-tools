'use client';

import useSWR from "swr";
import {Booster} from "@/app/api/boosters/route";
import Link from "next/link";
import NewBoosterModal, {BoosterCard} from "@/app/(app)/boosters/components";
import {ArrowTopRightOnSquareIcon, ChevronDownIcon} from "@heroicons/react/24/outline";
import {useReducer, useState} from "react";
import {
  addAllNonArchivedBoostersToCollection,
  addBoostersToCollection,
  archiveAllBoosters,
  archiveBoosters,
  refreshPrices,
  refreshPricesAllBoosters
} from "@/app/(app)/boosters/actions";
import {SelectIcon} from "@radix-ui/react-select";
import {Menu, Transition, MenuItems, MenuItem, MenuButton} from "@headlessui/react";
import {cn} from "@/lib/utils";
import {EuroIcon} from "lucide-react";
import {ArchiveBoxIcon, FolderIcon} from "@heroicons/react/24/solid";

async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);
  return res.json();
}

export default function Boosters() {
  const { data, isLoading, error} = useSWR<Booster[]>('/api/boosters', fetcher);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [allBoostersSelected, setAllBoostersSelected] = useState(false);
  const [selectedBoosters, dispatchSelectedBoosters] = useReducer((state: { [boosterId: string]: boolean }, action: {
    type: 'SELECT' | 'UNSELECT',
    boosterId: Booster['id']
  }) => {
    if (action.type === 'SELECT') {
      return {
        ...state,
        [action.boosterId]: true
      }
    }

    if (action.type === 'UNSELECT') {
      const newState = {...state};
      delete newState[action.boosterId];
      return newState;
    }

    return state;
  }, {})

  async function exportDatabase() {
    const response = await fetch('/api/boosters/exports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ format: 'DATABASE', allBoosters: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(error);
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('filename') ?? `swu-export-boosters-${new Date().toISOString()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function archiveSelectedBoosters() {
    if (allBoostersSelected) {
      await archiveAllBoosters();
    } else {
      const selectedBoostersIds = Object.keys(selectedBoosters);

      if (selectedBoostersIds.length === 0) {
        return;
      }

      await archiveBoosters(selectedBoostersIds);
    }
  }

  return (
    <>
      <div className="flex flex-row justify-between">
        <h1 className="text-2xl font-bold">Boosters</h1>

        <div className="space-x-2 flex flex-row items-center">
          {isSelectMode ? (
            <>
              <div className="inline-flex rounded-md shadow-sm">
                <Menu as="div" className="relative -ml-px block">
                  <MenuButton
                    className="relative inline-flex items-center rounded-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10">
                    <span>Actions</span>
                    <ChevronDownIcon className="h-5 w-5" aria-hidden="true"/>
                  </MenuButton>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems
                      className="absolute right-0 z-10 -mr-1 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <MenuItem>
                          {({focus}) => (
                            <button
                              className={cn(
                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block px-4 py-2 text-sm w-full text-left'
                              )}
                              onClick={() => allBoostersSelected ? refreshPricesAllBoosters() : refreshPrices(Object.keys(selectedBoosters))}
                            >
                              <EuroIcon className="size-5 inline" /> Actualiser les prix
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({focus}) => (
                            <button
                              className={cn(
                                focus ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'block px-4 py-2 text-sm w-full text-left'
                              )}
                              onClick={() => allBoostersSelected ? addAllNonArchivedBoostersToCollection() : addBoostersToCollection(Object.keys(selectedBoosters))}
                            >
                              <FolderIcon className="size-5 inline" /> Add to collection
                            </button>
                          )}
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Transition>
                </Menu>
              </div>

              <button className="bg-amber-500 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded"
                      onClick={archiveSelectedBoosters}>
                <ArchiveBoxIcon className="w-5 h-5 inline"/> Archiver
              </button>

              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => setAllBoostersSelected(!allBoostersSelected)}>
                {allBoostersSelected ? 'Tout déselectionner' : 'Tout sélectionner'}
              </button>

              <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => setIsSelectMode(false)}>
                Annuler
              </button>
            </>
          ) : (
            <>
              <NewBoosterModal/>

              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => setIsSelectMode(true)}>
                <SelectIcon className="w-5 h-5 inline"/> Sélectionner
              </button>

              <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                      onClick={exportDatabase}>
                <ArrowTopRightOnSquareIcon className="w-5 h-5 inline"/> Exporter
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div>Error</div>}
      {isLoading && <div>Loading...</div>}

      {data &&
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((booster) => (
              <div key={booster.id}>
                {isSelectMode ? (
                  <button onClick={() => dispatchSelectedBoosters({
                    type: selectedBoosters[booster.id] ? 'UNSELECT' : 'SELECT',
                    boosterId: booster.id
                  })}
                          className={cn((allBoostersSelected || selectedBoosters[booster.id]) ? 'border-green-700 border-4' : '')}>
                    <BoosterCard {...booster} />
                  </button>
                ) : (
                  <Link href={`/boosters/${booster.id}`}>
                    <BoosterCard {...booster} />
                  </Link>
                )}
              </div>
            ))}
          </div>
      }
    </>
  )
}