'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input";
import {PlusIcon} from "@heroicons/react/24/outline";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {createBooster} from "@/app/(app)/boosters/actions";
import {Booster} from "@/app/api/boosters/route";
import {ArchiveBoxIcon} from "@heroicons/react/24/solid";

export default function NewBoosterModal() {
  return (
    <div>
      <Dialog>
        <DialogTrigger>
          <div className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <PlusIcon className="w-5 h-5 inline"/> Nouveau
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un booster</DialogTitle>
            <DialogDescription>
              <form className="mt-4 space-y-4" action={createBooster}>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="setCode">Set code</Label>
                  <Input name="setCode" type="text" placeholder="SET" defaultValue="SHD"/>
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="lang">Langue</Label>
                  <Select name="lang" defaultValue="fr">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Langue"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Type de booster</SelectLabel>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="en">🇬🇧 Anglais</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <input type="submit" value="Créer"
                       className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"/>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BoosterCard(booster: Booster) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <div className="flex justify-between">
        <div className="text-lg font-semibold">
          {booster.archived && <ArchiveBoxIcon className="w-5 h-5 text-amber-500 inline mr-2" />}
          {booster.setCode}
        </div>
        <div className="text-sm text-gray-500">DRAFT</div>
      </div>
      <div className="">
        <span
          className="">{booster.cards.length} carte{booster.cards.length > 1 ? 's' : ''}</span> {booster.price ? `(environ ${booster.price} €)` : ''}
      </div>
    </div>
  );
}