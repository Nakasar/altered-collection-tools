'use client';

import {MinusIcon, PlusIcon} from "@heroicons/react/24/outline";

export function AddCardToCollectionButton({ execute }: { execute: Function }) {
  return (
    <button
      type="button"
      className="relative inline-flex items-center rounded-l-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
      onClick={() => execute()}
    >
      <span className="sr-only">Remove one</span>
      <MinusIcon aria-hidden="true" className="h-5 w-5"/>
    </button>
  )
}

export function RemoveCardToCollectionButton({ execute }: { execute: Function }) {
  return (
    <button
      type="button"
      className="relative inline-flex items-center rounded-l-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
      onClick={() => execute()}
    >
      <span className="sr-only">Add one</span>
      <PlusIcon aria-hidden="true" className="h-5 w-5"/>
    </button>
  )
}