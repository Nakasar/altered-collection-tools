'use client';

import {MeiliSearch} from "meilisearch";
import React, {FormEvent, useEffect, useState} from "react";
import {Combobox} from "@headlessui/react";
import {MagnifyingGlassIcon} from "@heroicons/react/20/solid";
import {ExclamationCircleIcon} from "@heroicons/react/24/outline";
import {cn} from "@/lib/utils";

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
});

type Card = {
  id: string;
  name: string;
  collectorNumber: string;
  setCode: string;
  price?: string;
  foilPrice?: string;
  imageUrl?: string;
};

const cardCollectorNumberRegex = /^(?<set>[A-Z]{3})?[- ]?(?<number>[0-9]{1,3})?[- ]?(?<rarity>[A-Z])??[- ]?(?<unique>[0-9]{1,4})?$/i;

export default function AddCardBar({ setCode, lang, addCard }: { setCode: string; lang: string; addCard: (({ setCode, collectorNumber }: { setCode: string; collectorNumber: string }) => Promise<void>) }) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Card[]>([]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
  }

  async function search(): Promise<Card[]> {
    const index = client.index<Card>('altered-cards');

    const queryOptions: { filter: string[] } = { filter: [] };
    let queryString = "";

    const parsedCard = cardCollectorNumberRegex.exec(searchQuery);
    console.log(parsedCard);
    if (parsedCard?.groups) {
      const collectorNumber = `${parsedCard.groups.set ? `${parsedCard.groups.set}-` : ''}${parsedCard.groups.number ? `${parsedCard.groups.number}-` : ''}${parsedCard.groups.rarity ? `${parsedCard.groups.rarity}` : ''}${parsedCard.groups.unique ? `-${parsedCard.groups.unique}` : ''}`
      queryOptions.filter.push(
        `collectorNumber CONTAINS "${collectorNumber}"`,
      );
    } else {
      queryString = searchQuery;
    }

    const result = await index.search(queryString, queryOptions);
    if (parsedCard?.groups && result.hits.length === 0) {
      return [
        {
          id: `${parsedCard.groups.set ? `${parsedCard.groups.set}-` : ''}${parsedCard.groups.number ? `${parsedCard.groups.number}-` : ''}${parsedCard.groups.rarity ? `${parsedCard.groups.rarity}` : ''}${parsedCard.groups.unique ? `-${parsedCard.groups.unique}` : ''}`,
          name: 'Ajouter le code de la carte',
          setCode: 'BTG',
          collectorNumber: `${parsedCard.groups.set ? `${parsedCard.groups.set}-` : ''}${parsedCard.groups.number ? `${parsedCard.groups.number}-` : ''}${parsedCard.groups.rarity ? `${parsedCard.groups.rarity}` : ''}${parsedCard.groups.unique ? `-${parsedCard.groups.unique}` : ''}`,
        },
      ];
    }

    return result.hits;
  }

  function selectItem(item: Card) {
    console.log("selectItem", item);
    if (!item) {
      return;
    }

    addCard({
      setCode: item.setCode,
      collectorNumber: item.collectorNumber,
    }).then(() => {
      setSearchQuery("");
    });
  }

  useEffect(() => {
    if (searchQuery.length > 0) {
      search().then(results => setSearchResults(results));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <div>
      <div
        className="divide-y divide-gray-100 overflow-hidden rounded-xl bg-white ring-1 ring-black ring-opacity-5 transition-all">
        <Combobox onChange={selectItem}>
          <div className="relative">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            <Combobox.Input
              className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Rechercher..."
              onChange={(event) => setSearchQuery(event.target.value)}
              autoFocus
            />
          </div>

          {searchResults.length > 0 && (
            <Combobox.Options static className="max-h-96 scroll-py-3 overflow-y-auto p-3">
              {searchResults.map((item) => (
                <Combobox.Option
                  key={item.id}
                  value={item}
                  className={({active}) =>
                    cn('flex cursor-default select-none rounded-xl p-3', active && 'bg-gray-100')
                  }
                >
                  {({active}) => (
                    <>
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-none items-center justify-center rounded-lg',
                        )}
                      >
                        <img alt={item.name} src={item.imageUrl ?? ''} className="h-12 text-white"
                             aria-hidden="true"/>
                      </div>
                      <div className="ml-4 flex-auto">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            active ? 'text-gray-900' : 'text-gray-700'
                          )}
                        >
                          {item.name}
                        </p>
                        <p className={cn('text-sm', active ? 'text-gray-700' : 'text-gray-500')}>
                          {item.setCode} #{item.collectorNumber} ({item.price ?? '-'} €)
                        </p>
                      </div>
                    </>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
          {searchQuery !== '' && searchResults.length === 0 && (
            <div className="px-6 py-14 text-center text-sm sm:px-14">
              <ExclamationCircleIcon
                type="outline"
                name="exclamation-circle"
                className="mx-auto h-6 w-6 text-gray-400"
              />
              <p className="mt-4 font-semibold text-gray-900">Aucun résultat</p>
              <p className="mt-2 text-gray-500">Aucun élément n&apos;a été trouvé avec cette recherche.</p>
            </div>
          )}
        </Combobox>
      </div>
    </div>
  );
}
