'use client';

import {Button} from "@/components/ui/button";
import {importCardDatabase} from "@/app/(app)/settings/actions";

export default function Settings() {
  return (
    <>
      <Button onClick={() => importCardDatabase()}>Import cards database</Button>
    </>
  )
}